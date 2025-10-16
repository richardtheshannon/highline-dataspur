import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, ApiProvider } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { decryptString } from '@/lib/encryption'
import { logApiActivity, createApiActivity } from '@/lib/apiActivity'
import { GoogleAdsService, GoogleAdsCredentials } from '@/lib/googleAdsService'
import { GoogleAdsMetricsSync } from '@/lib/googleAdsMetricsSync'

const prisma = new PrismaClient()

// GET /api/apis/google-adwords/metrics - Fetch Google AdWords metrics and performance data
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const forceRefresh = searchParams.get('refresh') === 'true'

    const config = await prisma.apiConfiguration.findFirst({
      where: {
        userId: userId,
        provider: ApiProvider.GOOGLE_ADWORDS
      }
    })

    if (!config) {
      return NextResponse.json(
        { error: 'No Google AdWords configuration found' },
        { status: 404 }
      )
    }

    if (config.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Google AdWords API not configured or connection failed' },
        { status: 400 }
      )
    }

    // Check if we need to sync fresh data
    const shouldSync = forceRefresh || await GoogleAdsMetricsSync.shouldSync(config.id, 3) // 3 hours max age

    if (shouldSync) {
      console.log('[GoogleAdsMetrics] Syncing fresh data (cache stale or forced refresh)')
      const syncService = await GoogleAdsMetricsSync.createFromApiConfig(config.id)
      if (syncService) {
        await syncService.performFullSync()
      }
    }

    // Calculate date range for metrics
    const endDate = new Date()
    const startDate = new Date()

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Fetch campaigns with their metrics from cache
    console.log('[GoogleAdsMetrics] Fetching campaigns for config:', config.id)
    console.log('[GoogleAdsMetrics] Date range:', startDate, 'to', endDate)

    const campaigns = await prisma.googleAdsCampaign.findMany({
      where: {
        apiConfigId: config.id
      },
      include: {
        GoogleAdsMetrics: {
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            date: 'desc'
          }
        }
      }
    })

    console.log('[GoogleAdsMetrics] Found', campaigns.length, 'campaigns in database')
    campaigns.forEach(campaign => {
      console.log(`[GoogleAdsMetrics] Campaign: ${campaign.name}, Metrics: ${campaign.GoogleAdsMetrics?.length || 0}`)
    })

    if (campaigns.length === 0) {
      // No cached data, try to sync and fallback to live API
      console.log('[GoogleAdsMetrics] No cached data found, attempting live API fallback')

      const clientSecret = decryptString(config.clientSecret)
      const developerToken = decryptString(config.developerToken || '')
      const refreshToken = config.refreshToken ? decryptString(config.refreshToken) : undefined
      const customerId = config.apiKey || undefined

      const googleAdsService = new GoogleAdsService({
        client_id: config.clientId,
        client_secret: clientSecret,
        developer_token: developerToken,
        refresh_token: refreshToken,
        customer_id: customerId
      })

      const liveCampaigns = await googleAdsService.getCampaigns()
      const enabledCampaigns = liveCampaigns.filter(campaign =>
        campaign.status && String(campaign.status).toLowerCase() === 'enabled'
      )

      const metrics = processGoogleAdsData(enabledCampaigns, timeRange)

      await logApiActivity(createApiActivity.metricsSync(
        userId,
        config.id,
        ApiProvider.GOOGLE_ADWORDS,
        true,
        enabledCampaigns.length,
        `Fallback: fetched metrics for ${enabledCampaigns.length} enabled campaigns (no cache)`
      ))

      return NextResponse.json({
        metrics,
        config: {
          status: config.status,
          lastSync: config.updatedAt
        },
        meta: {
          dataSource: 'live_api_fallback',
          cacheAvailable: false
        },
        lastUpdated: new Date().toISOString()
      })
    }

    // Process cached data into metrics format
    console.log('[GoogleAdsMetrics] Processing cached data...')
    let metrics
    try {
      metrics = processCachedData(campaigns, timeRange, startDate, endDate)
      console.log('[GoogleAdsMetrics] Successfully processed cached data')
    } catch (processingError) {
      console.error('[GoogleAdsMetrics] Error processing cached data:', processingError)
      throw processingError
    }

    // Log successful cached metrics fetch
    await logApiActivity(createApiActivity.metricsSync(
      userId,
      config.id,
      ApiProvider.GOOGLE_ADWORDS,
      true,
      campaigns.length,
      `Successfully served metrics from cache for ${campaigns.length} campaigns`
    ))

    const lastSyncAt = campaigns.reduce((latest, campaign) => {
      return campaign.lastSyncAt > latest ? campaign.lastSyncAt : latest
    }, new Date(0))

    return NextResponse.json({
      metrics,
      config: {
        status: config.status,
        lastSync: lastSyncAt
      },
      meta: {
        dataSource: 'cache',
        cacheAge: Date.now() - lastSyncAt.getTime(),
        freshDataAvailable: !shouldSync
      },
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache response for 5 minutes
      }
    })
  } catch (error: any) {
    console.error('Google AdWords metrics error:', error)

    // Try to log the error
    try {
      const session = await getSession()
      const userId = session?.user?.id || 'cmfegx5kh0000uai1jn1e8skq'

      const config = await prisma.apiConfiguration.findFirst({
        where: {
          userId: userId,
          provider: ApiProvider.GOOGLE_ADWORDS
        }
      })

      if (config) {
        await logApiActivity(createApiActivity.metricsSync(
          userId,
          config.id,
          ApiProvider.GOOGLE_ADWORDS,
          false,
          0,
          `Failed to fetch metrics: ${error.message}`
        ))
      }
    } catch (logError) {
      console.error('Failed to log error activity:', logError)
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch metrics',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

function processGoogleAdsData(campaigns: any[], timeRange: string) {
  // Calculate date range for performance data simulation
  const days = timeRange === '7d' ? 7 :
               timeRange === '30d' ? 30 :
               timeRange === '90d' ? 90 : 365

  // Calculate totals from real campaign data
  const totals = campaigns.reduce((acc, campaign) => ({
    impressions: acc.impressions + (campaign.impressions || 0),
    clicks: acc.clicks + (campaign.clicks || 0),
    conversions: acc.conversions + (campaign.conversions || 0),
    cost: acc.cost + (campaign.spend || campaign.cost || 0)
  }), { impressions: 0, clicks: 0, conversions: 0, cost: 0 })

  // Calculate additional metrics
  const calculatedMetrics = {
    ctr: totals.impressions > 0 ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
    conversionRate: totals.clicks > 0 ? parseFloat(((totals.conversions / totals.clicks) * 100).toFixed(2)) : 0,
    cpc: totals.clicks > 0 ? parseFloat((totals.cost / totals.clicks).toFixed(2)) : 0,
    cpa: totals.conversions > 0 ? parseFloat((totals.cost / totals.conversions).toFixed(2)) : 0
  }

  // Generate performance data for charts (distribute real totals across days)
  // This is a simulation for chart display since we're getting aggregated data
  const performanceData = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // Distribute totals across days with some variation
    const dayFactor = 1 / days
    const variation = 0.7 + Math.random() * 0.6 // 70-130% variation

    const dayImpressions = Math.floor(totals.impressions * dayFactor * variation)
    const dayClicks = Math.floor(totals.clicks * dayFactor * variation)
    const dayConversions = Math.floor(totals.conversions * dayFactor * variation)
    const dayCost = parseFloat((totals.cost * dayFactor * variation).toFixed(2))

    performanceData.push({
      date: date.toISOString().split('T')[0],
      impressions: dayImpressions,
      clicks: dayClicks,
      conversions: dayConversions,
      cost: dayCost,
      ctr: dayImpressions > 0 ? parseFloat(((dayClicks / dayImpressions) * 100).toFixed(2)) : 0,
      conversionRate: dayClicks > 0 ? parseFloat(((dayConversions / dayClicks) * 100).toFixed(2)) : 0,
      cpc: dayClicks > 0 ? parseFloat((dayCost / dayClicks).toFixed(2)) : 0,
      cpa: dayConversions > 0 ? parseFloat((dayCost / dayConversions).toFixed(2)) : 0
    })
  }

  // Generate dummy performance data for each campaign (since live API doesn't provide daily granularity)
  const campaignPerformanceData = new Map()

  campaigns.forEach(campaign => {
    const campaignDailyData = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // Distribute campaign totals across days with some variation
      const dayFactor = 1 / days
      const variation = 0.7 + Math.random() * 0.6 // 70-130% variation

      const dayImpressions = Math.floor((campaign.impressions || 0) * dayFactor * variation)
      const dayClicks = Math.floor((campaign.clicks || 0) * dayFactor * variation)
      const dayConversions = Math.floor((campaign.conversions || 0) * dayFactor * variation)
      const dayCost = parseFloat(((campaign.spend || campaign.cost || 0) * dayFactor * variation).toFixed(2))

      campaignDailyData.push({
        date: date.toISOString().split('T')[0],
        impressions: dayImpressions,
        clicks: dayClicks,
        conversions: dayConversions,
        cost: dayCost,
        ctr: dayImpressions > 0 ? parseFloat(((dayClicks / dayImpressions) * 100).toFixed(2)) : 0,
        conversionRate: dayClicks > 0 ? parseFloat(((dayConversions / dayClicks) * 100).toFixed(2)) : 0,
        cpc: dayClicks > 0 ? parseFloat((dayCost / dayClicks).toFixed(2)) : 0,
        cpa: dayConversions > 0 ? parseFloat((dayCost / dayConversions).toFixed(2)) : 0
      })
    }

    campaignPerformanceData.set(campaign.id, campaignDailyData)
  })

  // Format campaigns for display (add calculated fields and performance data)
  const formattedCampaigns = campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status ? String(campaign.status).toLowerCase() : 'unknown',
    budget: campaign.budget || 0,
    impressions: campaign.impressions || 0,
    clicks: campaign.clicks || 0,
    conversions: campaign.conversions || 0,
    cost: campaign.spend || campaign.cost || 0,
    ctr: campaign.ctr || 0,
    conversionRate: campaign.conversionRate || 0,
    cpc: campaign.cpc || 0,
    cpa: campaign.conversions > 0 ? parseFloat(((campaign.spend || campaign.cost || 0) / campaign.conversions).toFixed(2)) : 0,
    performanceData: campaignPerformanceData.get(campaign.id) || []
  }))

  // TODO: Implement real comparison data with previous period
  const comparison = null // No fake comparison data

  return {
    totals: {
      ...totals,
      ...calculatedMetrics
    },
    performanceData,
    campaigns: formattedCampaigns,
    comparison
  }
}

// Process cached campaign and metrics data
function processCachedData(campaigns: any[], timeRange: string, startDate: Date, endDate: Date) {
  const days = timeRange === '7d' ? 7 :
               timeRange === '30d' ? 30 :
               timeRange === '90d' ? 90 : 365

  // Create campaign-specific performance data first
  const campaignPerformanceData = new Map()

  campaigns.forEach(campaign => {
    const campaignMetrics = new Map()

    // Initialize all dates with zero values for this campaign
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      campaignMetrics.set(dateKey, {
        date: dateKey,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        ctr: 0,
        conversionRate: 0,
        cpc: 0,
        cpa: 0
      })
    }

    // Fill in actual data from campaign metrics
    (campaign.GoogleAdsMetrics || []).forEach((metric: any) => {
      const dateKey = metric.date.toISOString().split('T')[0]
      if (campaignMetrics.has(dateKey)) {
        const dayData = {
          date: dateKey,
          impressions: metric.impressions,
          clicks: metric.clicks,
          conversions: metric.conversions,
          cost: Math.round(metric.cost * 100) / 100,
          ctr: metric.impressions > 0 ? parseFloat(((metric.clicks / metric.impressions) * 100).toFixed(2)) : 0,
          conversionRate: metric.clicks > 0 ? parseFloat(((metric.conversions / metric.clicks) * 100).toFixed(2)) : 0,
          cpc: metric.clicks > 0 ? parseFloat((metric.cost / metric.clicks).toFixed(2)) : 0,
          cpa: metric.conversions > 0 ? parseFloat((metric.cost / metric.conversions).toFixed(2)) : 0
        }
        campaignMetrics.set(dateKey, dayData)
      }
    })

    // Convert to sorted array
    const campaignSortedMetrics = Array.from(campaignMetrics.values())
      .sort((a, b) => a.date.localeCompare(b.date))

    campaignPerformanceData.set(campaign.campaignId, campaignSortedMetrics)
  })

  // Process campaigns with their cached metrics
  const formattedCampaigns = campaigns.map(campaign => {
    // Calculate totals for this campaign across the date range
    const campaignTotals = (campaign.GoogleAdsMetrics || []).reduce(
      (acc: any, metric: any) => ({
        impressions: acc.impressions + metric.impressions,
        clicks: acc.clicks + metric.clicks,
        conversions: acc.conversions + metric.conversions,
        cost: acc.cost + metric.cost
      }),
      { impressions: 0, clicks: 0, conversions: 0, cost: 0 }
    )

    // Calculate rates
    const ctr = campaignTotals.impressions > 0 ? (campaignTotals.clicks / campaignTotals.impressions) * 100 : 0
    const conversionRate = campaignTotals.clicks > 0 ? (campaignTotals.conversions / campaignTotals.clicks) * 100 : 0
    const cpc = campaignTotals.clicks > 0 ? campaignTotals.cost / campaignTotals.clicks : 0
    const cpa = campaignTotals.conversions > 0 ? campaignTotals.cost / campaignTotals.conversions : 0

    return {
      id: campaign.campaignId,
      name: campaign.name,
      status: campaign.status,
      budget: campaign.budget || 0,
      impressions: campaignTotals.impressions,
      clicks: campaignTotals.clicks,
      conversions: campaignTotals.conversions,
      cost: Math.round(campaignTotals.cost * 100) / 100,
      ctr: Math.round(ctr * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      cpa: Math.round(cpa * 100) / 100,
      performanceData: campaignPerformanceData.get(campaign.campaignId) || []
    }
  })

  // Calculate overall totals
  const totals = formattedCampaigns.reduce(
    (acc, campaign) => ({
      impressions: acc.impressions + campaign.impressions,
      clicks: acc.clicks + campaign.clicks,
      conversions: acc.conversions + campaign.conversions,
      cost: acc.cost + campaign.cost
    }),
    { impressions: 0, clicks: 0, conversions: 0, cost: 0 }
  )

  // Calculate overall metrics
  const calculatedMetrics = {
    ctr: totals.impressions > 0 ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
    conversionRate: totals.clicks > 0 ? parseFloat(((totals.conversions / totals.clicks) * 100).toFixed(2)) : 0,
    cpc: totals.clicks > 0 ? parseFloat((totals.cost / totals.clicks).toFixed(2)) : 0,
    cpa: totals.conversions > 0 ? parseFloat((totals.cost / totals.conversions).toFixed(2)) : 0
  }

  // Create performance data from daily metrics
  const performanceData = []
  const metricsMap = new Map()

  // Group metrics by date across all campaigns
  campaigns.forEach(campaign => {
    campaign.GoogleAdsMetrics.forEach((metric: any) => {
      const dateKey = metric.date.toISOString().split('T')[0]
      if (!metricsMap.has(dateKey)) {
        metricsMap.set(dateKey, {
          date: dateKey,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          cost: 0
        })
      }
      const existing = metricsMap.get(dateKey)
      existing.impressions += metric.impressions
      existing.clicks += metric.clicks
      existing.conversions += metric.conversions
      existing.cost += metric.cost
    })
  })

  // Convert to sorted array and calculate daily metrics
  const sortedMetrics = Array.from(metricsMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(day => ({
      ...day,
      ctr: day.impressions > 0 ? parseFloat(((day.clicks / day.impressions) * 100).toFixed(2)) : 0,
      conversionRate: day.clicks > 0 ? parseFloat(((day.conversions / day.clicks) * 100).toFixed(2)) : 0,
      cpc: day.clicks > 0 ? parseFloat((day.cost / day.clicks).toFixed(2)) : 0,
      cpa: day.conversions > 0 ? parseFloat((day.cost / day.conversions).toFixed(2)) : 0
    }))

  // Fill in missing dates with zero values
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate)
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split('T')[0]

    if (!sortedMetrics.find(m => m.date === dateKey)) {
      sortedMetrics.push({
        date: dateKey,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        cost: 0,
        ctr: 0,
        conversionRate: 0,
        cpc: 0,
        cpa: 0
      })
    }
  }

  performanceData.push(...sortedMetrics.sort((a, b) => a.date.localeCompare(b.date)))

  // TODO: Implement real comparison data with historical data
  const comparison = null // No fake comparison data

  return {
    totals: {
      ...totals,
      ...calculatedMetrics
    },
    performanceData,
    campaigns: formattedCampaigns,
    comparison
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, ApiProvider } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { decryptString } from '@/lib/encryption'
import { logApiActivity, createApiActivity } from '@/lib/apiActivity'
import { GoogleAdsService, GoogleAdsCredentials } from '@/lib/googleAdsService'
import { GoogleAdsMetricsSync } from '@/lib/googleAdsMetricsSync'

const prisma = new PrismaClient()

// GET /api/apis/google-adwords/campaigns - Fetch Google AdWords campaigns
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

    const { searchParams } = new URL(request.url)
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

    // Check if we should sync fresh data
    const shouldSync = forceRefresh || await GoogleAdsMetricsSync.shouldSync(config.id, 1) // 1 hour max age for campaigns

    if (shouldSync) {
      console.log('[GoogleAdsCampaigns] Syncing fresh campaign data')
      const syncService = await GoogleAdsMetricsSync.createFromApiConfig(config.id)
      if (syncService) {
        await syncService.syncCampaigns()
      }
    }

    // Fetch campaigns from cache with latest metrics
    const cachedCampaigns = await prisma.googleAdsCampaign.findMany({
      where: {
        apiConfigId: config.id
      },
      include: {
        metrics: {
          orderBy: {
            date: 'desc'
          },
          take: 1 // Get only the latest metrics
        }
      }
    })

    if (cachedCampaigns.length === 0) {
      // No cached campaigns, fallback to live API
      console.log('[GoogleAdsCampaigns] No cached campaigns, using live API')

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

      await logApiActivity(createApiActivity.campaignFetch(
        userId,
        config.id,
        ApiProvider.GOOGLE_ADWORDS,
        true,
        liveCampaigns.length,
        `Fallback: fetched ${liveCampaigns.length} campaigns (no cache)`
      ))

      return NextResponse.json({
        campaigns: liveCampaigns,
        total: liveCampaigns.length,
        meta: {
          dataSource: 'live_api_fallback',
          cacheAvailable: false
        },
        lastUpdated: new Date().toISOString()
      })
    }

    // Format cached campaigns with latest metrics
    const formattedCampaigns = cachedCampaigns.map(campaign => {
      const latestMetrics = campaign.metrics[0]

      return {
        id: campaign.campaignId,
        name: campaign.name,
        status: campaign.status,
        budget: campaign.budget || 0,
        spend: latestMetrics ? Math.round(latestMetrics.cost * 100) / 100 : 0,
        impressions: latestMetrics ? latestMetrics.impressions : 0,
        clicks: latestMetrics ? latestMetrics.clicks : 0,
        conversions: latestMetrics ? latestMetrics.conversions : 0,
        ctr: latestMetrics ? Math.round(latestMetrics.ctr * 100) / 100 : 0,
        cpc: latestMetrics ? Math.round(latestMetrics.averageCpc * 100) / 100 : 0,
        conversionRate: latestMetrics ? Math.round(latestMetrics.conversionRate * 100) / 100 : 0,
        startDate: campaign.startDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        endDate: campaign.endDate?.toISOString().split('T')[0] || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastSyncAt: campaign.lastSyncAt
      }
    })

    // Log successful cached campaign fetch
    await logApiActivity(createApiActivity.campaignFetch(
      userId,
      config.id,
      ApiProvider.GOOGLE_ADWORDS,
      true,
      formattedCampaigns.length,
      `Successfully served ${formattedCampaigns.length} campaigns from cache`
    ))

    const lastSyncAt = cachedCampaigns.reduce((latest, campaign) => {
      return campaign.lastSyncAt > latest ? campaign.lastSyncAt : latest
    }, new Date(0))

    return NextResponse.json({
      campaigns: formattedCampaigns,
      total: formattedCampaigns.length,
      meta: {
        dataSource: 'cache',
        lastSyncAt: lastSyncAt.toISOString(),
        cacheAge: Date.now() - lastSyncAt.getTime(),
        freshDataAvailable: !shouldSync
      },
      lastUpdated: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    })
  } catch (error: any) {
    console.error('Google AdWords campaigns error:', error)
    
    // Try to log the error activity
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
        await logApiActivity(createApiActivity.campaignFetch(
          userId,
          config.id,
          ApiProvider.GOOGLE_ADWORDS,
          false,
          0,
          `Failed to fetch campaigns: ${error.message}`
        ))
      }
    } catch (logError) {
      console.error('Failed to log error activity:', logError)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch campaigns',
        details: error.message || 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
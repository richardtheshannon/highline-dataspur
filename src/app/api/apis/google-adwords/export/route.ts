import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GET /api/apis/google-adwords/export
 *
 * Export Google Ads data as CSV
 * Query params:
 * - format: 'csv' (default)
 * - timeRange: '7d' | '30d' | '90d' | '1y' (default: 30d)
 * - startDate: ISO date string (optional, overrides timeRange)
 * - endDate: ISO date string (optional, overrides timeRange)
 * - includeGoals: 'true' | 'false' (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get the user's Google Ads API configuration
    const apiConfig = await prisma.apiConfiguration.findFirst({
      where: {
        userId: user.id,
        provider: 'GOOGLE_ADWORDS'
      }
    })

    if (!apiConfig) {
      return NextResponse.json(
        { error: 'Google Ads configuration not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
    const timeRange = searchParams.get('timeRange') || '30d'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const includeGoals = searchParams.get('includeGoals') === 'true'

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()

    if (startDateParam && endDateParam) {
      // Custom date range
      startDate = new Date(startDateParam)
      endDate = new Date(endDateParam)
    } else {
      // Use timeRange
      const days = parseInt(timeRange.replace('d', '').replace('y', '')) || 30
      const isYear = timeRange.includes('y')
      startDate = new Date()
      startDate.setDate(startDate.getDate() - (isYear ? days * 365 : days))
    }

    // Fetch campaigns
    const campaigns = await prisma.googleAdsCampaign.findMany({
      where: { apiConfigId: apiConfig.id },
      include: includeGoals ? {
        GoogleAdsCampaignGoal: true
      } : undefined
    })

    // Fetch metrics data
    const metrics = await prisma.googleAdsMetrics.findMany({
      where: {
        campaignId: {
          in: campaigns.map(c => c.campaignId)
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    if (format !== 'csv') {
      return NextResponse.json(
        { error: 'Only CSV format is supported' },
        { status: 400 }
      )
    }

    // Generate CSV
    const csv = generateCSV(campaigns, metrics, includeGoals)

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="google-ads-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Error exporting Google Ads data:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}

/**
 * Generate CSV from campaigns and metrics data
 */
function generateCSV(
  campaigns: any[],
  metrics: any[],
  includeGoals: boolean
): string {
  const rows: string[] = []

  // Header row
  const headers = [
    'Date',
    'Campaign ID',
    'Campaign Name',
    'Campaign Status',
    'Impressions',
    'Clicks',
    'Conversions',
    'Cost',
    'CTR (%)',
    'CVR (%)',
    'CPC',
    'CPA'
  ]

  if (includeGoals) {
    headers.push(
      'Target CPA',
      'Target CTR (%)',
      'Target CVR (%)',
      'Target Conversions',
      'Monthly Budget',
      'Goal Notes'
    )
  }

  rows.push(headers.join(','))

  // Create a map of campaigns for quick lookup
  const campaignMap = new Map(campaigns.map(c => [c.campaignId, c]))

  // Data rows
  for (const metric of metrics) {
    const campaign = campaignMap.get(metric.campaignId)
    if (!campaign) continue

    const ctr = metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0
    const cvr = metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0
    const cpc = metric.clicks > 0 ? metric.cost / metric.clicks : 0
    const cpa = metric.conversions > 0 ? metric.cost / metric.conversions : 0

    const row = [
      new Date(metric.date).toISOString().split('T')[0],
      escapeCSV(metric.campaignId),
      escapeCSV(campaign.name),
      escapeCSV(campaign.status),
      metric.impressions,
      metric.clicks,
      metric.conversions.toFixed(2),
      metric.cost.toFixed(2),
      ctr.toFixed(2),
      cvr.toFixed(2),
      cpc.toFixed(2),
      cpa.toFixed(2)
    ]

    if (includeGoals && campaign.GoogleAdsCampaignGoal) {
      row.push(
        campaign.GoogleAdsCampaignGoal.targetCPA?.toFixed(2) || '',
        campaign.GoogleAdsCampaignGoal.targetCTR?.toFixed(2) || '',
        campaign.GoogleAdsCampaignGoal.targetCVR?.toFixed(2) || '',
        campaign.GoogleAdsCampaignGoal.targetConversions?.toString() || '',
        campaign.GoogleAdsCampaignGoal.monthlyBudget?.toFixed(2) || '',
        escapeCSV(campaign.GoogleAdsCampaignGoal.notes || '')
      )
    } else if (includeGoals) {
      row.push('', '', '', '', '', '')
    }

    rows.push(row.join(','))
  }

  // Add summary row
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0)
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0)
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0)
  const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0)
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
  const avgCvr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
  const avgCpc = totalClicks > 0 ? totalCost / totalClicks : 0
  const avgCpa = totalConversions > 0 ? totalCost / totalConversions : 0

  rows.push('') // Empty row
  rows.push([
    'TOTALS',
    '',
    '',
    '',
    totalImpressions,
    totalClicks,
    totalConversions.toFixed(2),
    totalCost.toFixed(2),
    avgCtr.toFixed(2),
    avgCvr.toFixed(2),
    avgCpc.toFixed(2),
    avgCpa.toFixed(2),
    ...(includeGoals ? ['', '', '', '', '', ''] : [])
  ].join(','))

  return rows.join('\n')
}

/**
 * Escape CSV values that contain commas, quotes, or newlines
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

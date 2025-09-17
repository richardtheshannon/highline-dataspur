import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { GoogleAdsMetricsSync } from '@/lib/googleAdsMetricsSync'

// POST /api/apis/google-adwords/sync - Manual sync trigger
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const { forceSync = false, syncCampaigns = true, syncMetrics = true, historical = false, yearsBack = 1 } = body

    console.log(`[GoogleAdsSync] Manual sync triggered by user ${userId}`, { historical, yearsBack })

    let results
    if (historical) {
      // Historical data sync for all configurations
      results = await GoogleAdsMetricsSync.syncAllConfigurations({
        forceSync: true,
        syncCampaigns: true,
        syncMetrics: true,
        dateRange: {
          startDate: new Date(new Date().setFullYear(new Date().getFullYear() - yearsBack)),
          endDate: new Date()
        }
      })
    } else {
      // Standard sync
      results = await GoogleAdsMetricsSync.syncAllConfigurations({
        forceSync,
        syncCampaigns,
        syncMetrics
      })
    }

    const totalCampaigns = results.reduce((sum, r) => sum + r.campaignsSynced, 0)
    const totalMetrics = results.reduce((sum, r) => sum + r.metricsRecordsSynced, 0)
    const allErrors = results.flatMap(r => r.errors)
    const success = results.every(r => r.success)

    return NextResponse.json({
      success,
      totalCampaigns,
      totalMetrics,
      configurations: results.length,
      historical,
      ...(historical && { yearsBack }),
      errors: allErrors,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Google Ads sync error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync Google Ads data',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// GET /api/apis/google-adwords/sync - Check sync status
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
    const apiConfigId = searchParams.get('configId')

    if (apiConfigId) {
      // Check specific configuration
      const shouldSync = await GoogleAdsMetricsSync.shouldSync(apiConfigId)
      return NextResponse.json({
        shouldSync,
        configId: apiConfigId
      })
    }

    // Return general sync status
    return NextResponse.json({
      message: 'Use POST to trigger sync or provide configId to check specific status'
    })

  } catch (error: any) {
    console.error('Google Ads sync status error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check sync status',
        details: error.message
      },
      { status: 500 }
    )
  }
}
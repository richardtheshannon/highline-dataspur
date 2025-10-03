import { PrismaClient, ApiProvider, ApiActivityType, ApiActivityStatus } from '@prisma/client'
import { createId } from '@paralleldrive/cuid2'
import { decryptString } from './encryption'
import { GoogleAdsService, GoogleAdsCredentials } from './googleAdsService'
import { logApiActivity, createApiActivity } from './apiActivity'

const prisma = new PrismaClient()

export interface SyncOptions {
  forceSync?: boolean
  syncCampaigns?: boolean
  syncMetrics?: boolean
  dateRange?: {
    startDate: Date
    endDate: Date
  }
}

export interface SyncResult {
  success: boolean
  campaignsSynced: number
  metricsRecordsSynced: number
  errors: string[]
  lastSyncAt: Date
}

export class GoogleAdsMetricsSync {
  private apiConfigId: string
  private userId: string
  private googleAdsService: GoogleAdsService

  constructor(apiConfigId: string, userId: string, googleAdsService: GoogleAdsService) {
    this.apiConfigId = apiConfigId
    this.userId = userId
    this.googleAdsService = googleAdsService
  }

  static async createFromApiConfig(apiConfigId: string): Promise<GoogleAdsMetricsSync | null> {
    const config = await prisma.apiConfiguration.findUnique({
      where: { id: apiConfigId }
    })

    if (!config || config.provider !== ApiProvider.GOOGLE_ADWORDS || config.status !== 'ACTIVE') {
      return null
    }

    // Decrypt credentials
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

    return new GoogleAdsMetricsSync(apiConfigId, config.userId, googleAdsService)
  }

  async syncCampaigns(): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = []
    let syncedCount = 0

    try {
      console.log(`[GoogleAdsMetricsSync] Starting campaign sync for config ${this.apiConfigId}`)

      // Fetch campaigns from Google Ads API using existing service
      const campaigns = await this.googleAdsService.getCampaigns()
      console.log(`[GoogleAdsMetricsSync] Fetched ${campaigns.length} campaigns from API`)

      for (const campaign of campaigns) {
        try {
          // Upsert campaign data
          await prisma.googleAdsCampaign.upsert({
            where: {
              apiConfigId_campaignId: {
                apiConfigId: this.apiConfigId,
                campaignId: campaign.id
              }
            },
            update: {
              name: campaign.name,
              status: campaign.status,
              budget: campaign.budget,
              startDate: new Date(campaign.startDate),
              endDate: new Date(campaign.endDate),
              lastSyncAt: new Date()
            },
            create: {
              id: createId(),
              apiConfigId: this.apiConfigId,
              campaignId: campaign.id,
              name: campaign.name,
              status: campaign.status,
              budget: campaign.budget,
              startDate: new Date(campaign.startDate),
              endDate: new Date(campaign.endDate),
              lastSyncAt: new Date(),
              updatedAt: new Date()
            }
          })
          syncedCount++
        } catch (error: any) {
          console.error(`[GoogleAdsMetricsSync] Error syncing campaign ${campaign.id}:`, error)
          errors.push(`Campaign ${campaign.name}: ${error.message}`)
        }
      }

      // Log successful sync activity
      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.CAMPAIGN_SYNC,
        ApiActivityStatus.SUCCESS,
        `Campaign sync completed`,
        `Successfully synced ${syncedCount} campaigns`,
        { campaignCount: syncedCount, errors: errors.length }
      ))

      console.log(`[GoogleAdsMetricsSync] Campaign sync completed: ${syncedCount} campaigns`)
      return { success: errors.length === 0, count: syncedCount, errors }

    } catch (error: any) {
      console.error('[GoogleAdsMetricsSync] Campaign sync failed:', error)
      errors.push(`Campaign sync failed: ${error.message}`)

      // Log error activity
      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.CAMPAIGN_SYNC,
        ApiActivityStatus.ERROR,
        `Campaign sync failed`,
        error.message,
        { error: error.message }
      ))

      return { success: false, count: 0, errors }
    }
  }

  async syncMetrics(dateRange?: { startDate: Date; endDate: Date }): Promise<{ success: boolean; count: number; errors: string[] }> {
    const errors: string[] = []
    let syncedCount = 0

    try {
      console.log(`[GoogleAdsMetricsSync] Starting metrics sync for config ${this.apiConfigId}`)

      // Get local campaigns to sync metrics for
      const localCampaigns = await prisma.googleAdsCampaign.findMany({
        where: { apiConfigId: this.apiConfigId }
      })

      if (localCampaigns.length === 0) {
        console.log('[GoogleAdsMetricsSync] No local campaigns found, syncing campaigns first')
        await this.syncCampaigns()
        return this.syncMetrics(dateRange)
      }

      // Default to last 30 days if no date range specified
      const endDate = dateRange?.endDate || new Date()
      const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      console.log(`[GoogleAdsMetricsSync] Syncing metrics from ${startDate.toISOString()} to ${endDate.toISOString()}`)

      // Get campaign IDs for the API call
      const campaignIds = localCampaigns.map(c => c.campaignId)

      // Fetch daily metrics from Google Ads API
      const dailyMetrics = await this.googleAdsService.getDailyMetrics(campaignIds, startDate, endDate)
      console.log(`[GoogleAdsMetricsSync] Fetched ${dailyMetrics.length} daily metric records from API`)

      for (const dailyMetric of dailyMetrics) {
        try {
          // Find the corresponding local campaign
          const localCampaign = localCampaigns.find(c => c.campaignId === dailyMetric.campaignId)
          if (!localCampaign) {
            console.log(`[GoogleAdsMetricsSync] Local campaign not found for ${dailyMetric.campaignId}, skipping`)
            continue
          }

          // Parse the date and ensure it's properly formatted
          const metricDate = new Date(dailyMetric.date)
          metricDate.setHours(0, 0, 0, 0)

          await prisma.googleAdsMetrics.upsert({
            where: {
              campaignId_date: {
                campaignId: localCampaign.id,
                date: metricDate
              }
            },
            update: {
              impressions: dailyMetric.impressions,
              clicks: dailyMetric.clicks,
              conversions: dailyMetric.conversions,
              cost: dailyMetric.cost,
              ctr: dailyMetric.ctr,
              averageCpc: dailyMetric.averageCpc,
              conversionRate: dailyMetric.conversionRate
            },
            create: {
              id: createId(),
              campaignId: localCampaign.id,
              date: metricDate,
              impressions: dailyMetric.impressions,
              clicks: dailyMetric.clicks,
              conversions: dailyMetric.conversions,
              cost: dailyMetric.cost,
              ctr: dailyMetric.ctr,
              averageCpc: dailyMetric.averageCpc,
              conversionRate: dailyMetric.conversionRate,
              updatedAt: new Date()
            }
          })
          syncedCount++
        } catch (error: any) {
          console.error(`[GoogleAdsMetricsSync] Error syncing daily metric for campaign ${dailyMetric.campaignId} on ${dailyMetric.date}:`, error)
          errors.push(`Daily metric for campaign ${dailyMetric.campaignId} on ${dailyMetric.date}: ${error.message}`)
        }
      }

      // Log successful sync activity
      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.METRICS_SYNC,
        ApiActivityStatus.SUCCESS,
        `Daily metrics sync completed`,
        `Successfully synced ${syncedCount} daily metrics records`,
        {
          dailyMetricsCount: syncedCount,
          dateRange: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          errors: errors.length
        }
      ))

      console.log(`[GoogleAdsMetricsSync] Daily metrics sync completed: ${syncedCount} records`)
      return { success: errors.length === 0, count: syncedCount, errors }

    } catch (error: any) {
      console.error('[GoogleAdsMetricsSync] Daily metrics sync failed:', error)
      errors.push(`Daily metrics sync failed: ${error.message}`)

      // Log error activity
      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.METRICS_SYNC,
        ApiActivityStatus.ERROR,
        `Daily metrics sync failed`,
        error.message,
        { error: error.message }
      ))

      return { success: false, count: 0, errors }
    }
  }

  async performFullSync(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = new Date()
    const errors: string[] = []
    let campaignsSynced = 0
    let metricsRecordsSynced = 0

    try {
      console.log(`[GoogleAdsMetricsSync] Starting full sync for config ${this.apiConfigId}`)

      // Sync campaigns if requested or by default
      if (options.syncCampaigns !== false) {
        const campaignResult = await this.syncCampaigns()
        campaignsSynced = campaignResult.count
        errors.push(...campaignResult.errors)
      }

      // Sync metrics if requested or by default
      if (options.syncMetrics !== false) {
        const metricsResult = await this.syncMetrics(options.dateRange)
        metricsRecordsSynced = metricsResult.count
        errors.push(...metricsResult.errors)
      }

      // Log background sync activity
      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.BACKGROUND_SYNC,
        errors.length === 0 ? ApiActivityStatus.SUCCESS : ApiActivityStatus.WARNING,
        `Background sync completed`,
        `Synced ${campaignsSynced} campaigns and ${metricsRecordsSynced} metrics records`,
        {
          campaignsSynced,
          metricsRecordsSynced,
          errors: errors.length,
          duration: Date.now() - startTime.getTime()
        }
      ))

      console.log(`[GoogleAdsMetricsSync] Full sync completed: ${campaignsSynced} campaigns, ${metricsRecordsSynced} metrics`)

      return {
        success: errors.length === 0,
        campaignsSynced,
        metricsRecordsSynced,
        errors,
        lastSyncAt: new Date()
      }

    } catch (error: any) {
      console.error('[GoogleAdsMetricsSync] Full sync failed:', error)

      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.BACKGROUND_SYNC,
        ApiActivityStatus.ERROR,
        `Background sync failed`,
        error.message,
        { error: error.message }
      ))

      return {
        success: false,
        campaignsSynced,
        metricsRecordsSynced,
        errors: [...errors, error.message],
        lastSyncAt: new Date()
      }
    }
  }

  // Static method to sync all active Google Ads configurations
  static async syncAllConfigurations(options: SyncOptions = {}): Promise<SyncResult[]> {
    const configs = await prisma.apiConfiguration.findMany({
      where: {
        provider: ApiProvider.GOOGLE_ADWORDS,
        status: 'ACTIVE'
      }
    })

    console.log(`[GoogleAdsMetricsSync] Found ${configs.length} active Google Ads configurations`)

    const results: SyncResult[] = []

    for (const config of configs) {
      try {
        const syncService = await GoogleAdsMetricsSync.createFromApiConfig(config.id)
        if (syncService) {
          const result = await syncService.performFullSync(options)
          results.push(result)
        } else {
          console.warn(`[GoogleAdsMetricsSync] Could not create sync service for config ${config.id}`)
        }
      } catch (error: any) {
        console.error(`[GoogleAdsMetricsSync] Error syncing config ${config.id}:`, error)
        results.push({
          success: false,
          campaignsSynced: 0,
          metricsRecordsSynced: 0,
          errors: [error.message],
          lastSyncAt: new Date()
        })
      }
    }

    return results
  }

  // Sync a full year of historical data
  async syncHistoricalData(yearsBack = 1): Promise<SyncResult> {
    const startTime = new Date()
    const errors: string[] = []
    let campaignsSynced = 0
    let metricsRecordsSynced = 0

    try {
      console.log(`[GoogleAdsMetricsSync] Starting historical data sync for ${yearsBack} year(s)`)

      // First sync campaigns
      const campaignResult = await this.syncCampaigns()
      campaignsSynced = campaignResult.count
      errors.push(...campaignResult.errors)

      // Calculate date range for historical data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setFullYear(startDate.getFullYear() - yearsBack)

      console.log(`[GoogleAdsMetricsSync] Syncing historical metrics from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`)

      // Sync historical metrics
      const metricsResult = await this.syncMetrics({ startDate, endDate })
      metricsRecordsSynced = metricsResult.count
      errors.push(...metricsResult.errors)

      // Log historical sync activity
      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.BACKGROUND_SYNC,
        errors.length === 0 ? ApiActivityStatus.SUCCESS : ApiActivityStatus.WARNING,
        `Historical data sync completed`,
        `Synced ${campaignsSynced} campaigns and ${metricsRecordsSynced} historical metrics (${yearsBack} year${yearsBack !== 1 ? 's' : ''})`,
        {
          campaignsSynced,
          metricsRecordsSynced,
          yearsBack,
          dateRange: {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          errors: errors.length,
          duration: Date.now() - startTime.getTime()
        }
      ))

      console.log(`[GoogleAdsMetricsSync] Historical sync completed: ${campaignsSynced} campaigns, ${metricsRecordsSynced} metrics over ${yearsBack} year(s)`)

      return {
        success: errors.length === 0,
        campaignsSynced,
        metricsRecordsSynced,
        errors,
        lastSyncAt: new Date()
      }

    } catch (error: any) {
      console.error('[GoogleAdsMetricsSync] Historical sync failed:', error)

      await logApiActivity(createApiActivity.generic(
        this.userId,
        this.apiConfigId,
        ApiProvider.GOOGLE_ADWORDS,
        ApiActivityType.BACKGROUND_SYNC,
        ApiActivityStatus.ERROR,
        `Historical data sync failed`,
        error.message,
        { error: error.message, yearsBack }
      ))

      return {
        success: false,
        campaignsSynced,
        metricsRecordsSynced,
        errors: [...errors, error.message],
        lastSyncAt: new Date()
      }
    }
  }

  // Check if sync is needed based on last sync time
  static async shouldSync(apiConfigId: string, maxAgeHours = 3): Promise<boolean> {
    const campaigns = await prisma.googleAdsCampaign.findMany({
      where: { apiConfigId },
      select: { lastSyncAt: true },
      orderBy: { lastSyncAt: 'desc' },
      take: 1
    })

    if (campaigns.length === 0) {
      return true // No campaigns synced yet
    }

    const lastSync = campaigns[0].lastSyncAt
    const maxAge = maxAgeHours * 60 * 60 * 1000 // Convert to milliseconds
    const shouldSync = Date.now() - lastSync.getTime() > maxAge

    console.log(`[GoogleAdsMetricsSync] Last sync: ${lastSync}, should sync: ${shouldSync}`)
    return shouldSync
  }
}
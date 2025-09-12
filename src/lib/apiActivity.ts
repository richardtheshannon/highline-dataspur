import { PrismaClient, ApiProvider, ApiActivityType, ApiActivityStatus } from '@prisma/client'

const prisma = new PrismaClient()

export interface ApiActivityData {
  userId: string
  apiConfigId: string
  provider: ApiProvider
  type: ApiActivityType
  status: ApiActivityStatus
  title: string
  description?: string
  metadata?: any
}

export async function logApiActivity(data: ApiActivityData) {
  try {
    const activity = await prisma.apiActivity.create({
      data: {
        userId: data.userId,
        apiConfigId: data.apiConfigId,
        provider: data.provider,
        type: data.type,
        status: data.status,
        title: data.title,
        description: data.description,
        metadata: data.metadata
      }
    })
    return activity
  } catch (error) {
    console.error('Failed to log API activity:', error)
    // Don't throw error to avoid breaking main functionality
    return null
  }
}

export async function getRecentApiActivity(userId: string, provider?: ApiProvider, limit = 10) {
  try {
    const activities = await prisma.apiActivity.findMany({
      where: {
        userId,
        ...(provider && { provider })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      include: {
        apiConfig: {
          select: {
            name: true,
            provider: true
          }
        }
      }
    })
    
    return activities
  } catch (error) {
    console.error('Failed to fetch API activities:', error)
    return []
  }
}

export async function getApiActivityStats(userId: string, provider?: ApiProvider) {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [today, thisWeek, errors] = await Promise.all([
      // Activities in last 24 hours
      prisma.apiActivity.count({
        where: {
          userId,
          ...(provider && { provider }),
          createdAt: {
            gte: twentyFourHoursAgo
          }
        }
      }),
      // Activities in last 7 days
      prisma.apiActivity.count({
        where: {
          userId,
          ...(provider && { provider }),
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      }),
      // Error activities in last 7 days
      prisma.apiActivity.count({
        where: {
          userId,
          ...(provider && { provider }),
          status: ApiActivityStatus.ERROR,
          createdAt: {
            gte: sevenDaysAgo
          }
        }
      })
    ])

    return {
      today,
      thisWeek,
      errors
    }
  } catch (error) {
    console.error('Failed to fetch API activity stats:', error)
    return {
      today: 0,
      thisWeek: 0,
      errors: 0
    }
  }
}

// Helper function to create common activity types
export const createApiActivity = {
  connectionTest: (userId: string, apiConfigId: string, provider: ApiProvider, success: boolean, details?: string) => ({
    userId,
    apiConfigId,
    provider,
    type: ApiActivityType.CONNECTION_TEST,
    status: success ? ApiActivityStatus.SUCCESS : ApiActivityStatus.ERROR,
    title: success ? 'Connection test successful' : 'Connection test failed',
    description: details
  }),

  dataSync: (userId: string, apiConfigId: string, provider: ApiProvider, success: boolean, syncCount?: number, details?: string) => ({
    userId,
    apiConfigId,
    provider,
    type: ApiActivityType.DATA_SYNC,
    status: success ? ApiActivityStatus.SUCCESS : ApiActivityStatus.ERROR,
    title: success ? 'Data sync completed' : 'Data sync failed',
    description: success ? `Successfully synced ${syncCount || 0} items` : details,
    metadata: syncCount ? { syncCount } : undefined
  }),

  campaignFetch: (userId: string, apiConfigId: string, provider: ApiProvider, success: boolean, campaignCount?: number, details?: string) => ({
    userId,
    apiConfigId,
    provider,
    type: ApiActivityType.CAMPAIGN_FETCH,
    status: success ? ApiActivityStatus.SUCCESS : ApiActivityStatus.ERROR,
    title: success ? 'Campaign data synced' : 'Campaign fetch failed',
    description: success ? `Successfully synced ${campaignCount || 0} campaigns` : details,
    metadata: campaignCount ? { campaignCount } : undefined
  }),

  keywordUpdate: (userId: string, apiConfigId: string, provider: ApiProvider, success: boolean, keywordCount?: number, details?: string) => ({
    userId,
    apiConfigId,
    provider,
    type: ApiActivityType.KEYWORD_UPDATE,
    status: success ? ApiActivityStatus.SUCCESS : ApiActivityStatus.ERROR,
    title: success ? 'Keywords updated' : 'Keyword update failed',
    description: success ? `Updated ${keywordCount || 0} keyword bids` : details,
    metadata: keywordCount ? { keywordCount } : undefined
  }),

  rateLimitWarning: (userId: string, apiConfigId: string, provider: ApiProvider, currentUsage: number, limit: number) => ({
    userId,
    apiConfigId,
    provider,
    type: ApiActivityType.RATE_LIMIT_WARNING,
    status: ApiActivityStatus.WARNING,
    title: 'Rate limit warning',
    description: `Approaching daily API limit (${currentUsage.toLocaleString()}/${limit.toLocaleString()})`,
    metadata: { currentUsage, limit }
  }),

  error: (userId: string, apiConfigId: string, provider: ApiProvider, title: string, details: string) => ({
    userId,
    apiConfigId,
    provider,
    type: ApiActivityType.ERROR,
    status: ApiActivityStatus.ERROR,
    title,
    description: details
  })
} as const
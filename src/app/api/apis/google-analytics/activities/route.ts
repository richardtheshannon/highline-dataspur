import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/db'
import { ApiProvider } from '@prisma/client'

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString()
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Get the user's Google Analytics configuration first
    const config = await prisma.apiConfiguration.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: ApiProvider.GOOGLE_ANALYTICS
        }
      }
    })

    if (!config) {
      return NextResponse.json({
        activities: [],
        total: 0,
        hasMore: false
      })
    }

    // Fetch activities for this specific API configuration
    const [activities, totalCount] = await Promise.all([
      prisma.apiActivity.findMany({
        where: {
          userId: session.user.id,
          provider: ApiProvider.GOOGLE_ANALYTICS,
          apiConfigId: config.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          status: true,
          title: true,
          description: true,
          metadata: true,
          createdAt: true
        }
      }),
      prisma.apiActivity.count({
        where: {
          userId: session.user.id,
          provider: ApiProvider.GOOGLE_ANALYTICS,
          apiConfigId: config.id
        }
      })
    ])

    // Format activities with time ago
    const formattedActivities = activities.map(activity => ({
      ...activity,
      type: activity.type,
      status: activity.status.toLowerCase(),
      timeAgo: formatTimeAgo(activity.createdAt),
      createdAt: activity.createdAt.toISOString()
    }))

    return NextResponse.json({
      activities: formattedActivities,
      total: totalCount,
      hasMore: offset + limit < totalCount
    })

  } catch (error) {
    console.error('Failed to fetch activities:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch activities',
      activities: [],
      total: 0,
      hasMore: false
    }, { status: 500 })
  }
}
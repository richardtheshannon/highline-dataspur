import { NextRequest, NextResponse } from 'next/server'
import { ApiProvider } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { getRecentApiActivity, getApiActivityStats } from '@/lib/apiActivity'

// GET /api/apis/google-adwords/activities - Get recent Google AdWords API activities
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.user?.id || 'user_test_1'
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const includeStats = searchParams.get('stats') === 'true'
    
    // Fetch recent activities for Google AdWords
    const activities = await getRecentApiActivity(userId, ApiProvider.GOOGLE_ADWORDS, limit)
    
    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      status: activity.status.toLowerCase(),
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt,
      timeAgo: getTimeAgo(activity.createdAt)
    }))
    
    let stats = null
    if (includeStats) {
      stats = await getApiActivityStats(userId, ApiProvider.GOOGLE_ADWORDS)
    }
    
    return NextResponse.json({
      activities: formattedActivities,
      total: formattedActivities.length,
      ...(stats && { stats })
    })
  } catch (error) {
    console.error('Google AdWords activities error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffInMinutes / 60)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInMinutes < 10080) { // 7 days
    const days = Math.floor(diffInMinutes / 1440)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else {
    return date.toLocaleDateString()
  }
}
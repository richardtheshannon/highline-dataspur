import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/timeline/tomorrow - Get timeline events for tomorrow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    // Get tomorrow's date range (start of day to end of day)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const startOfDay = new Date(tomorrow)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(tomorrow)
    endOfDay.setHours(23, 59, 59, 999)

    console.log('Fetching timeline events for tomorrow:', startOfDay, 'to', endOfDay)

    // Fetch timeline events for tomorrow with project details (user-scoped)
    const tomorrowEvents = await prisma.timelineEvent.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        project: {
          ownerId: user.id
        }
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            projectType: true
          }
        }
      },
      orderBy: { date: 'asc' }
    })

    console.log(`Found ${tomorrowEvents.length} timeline events for tomorrow`)
    
    return NextResponse.json(tomorrowEvents)
  } catch (error) {
    console.error('Timeline tomorrow GET error:', error)
    return NextResponse.json(
      { error: "Failed to fetch tomorrow's timeline events", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
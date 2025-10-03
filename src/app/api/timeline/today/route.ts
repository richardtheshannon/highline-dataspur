import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/timeline/today - Get timeline events for today
export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DEBUG: DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20))

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
    // Get today's date range (start of day to end of day)
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    console.log('Fetching timeline events for date range:', startOfDay, 'to', endOfDay)

    // Fetch timeline events for today with project details (user-scoped)
    const todayEvents = await prisma.timelineEvent.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        Project: {
          ownerId: user.id
        }
      },
      include: {
        Project: {
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

    console.log(`Found ${todayEvents.length} timeline events for today`)

    // Map Project relation to project for frontend compatibility
    const mappedEvents = todayEvents.map(event => {
      const { Project, ...eventData } = event
      return {
        ...eventData,
        project: Project
      }
    })

    return NextResponse.json(mappedEvents)
  } catch (error) {
    console.error('Timeline today GET error:', error)
    return NextResponse.json(
      { error: "Failed to fetch today's timeline events", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
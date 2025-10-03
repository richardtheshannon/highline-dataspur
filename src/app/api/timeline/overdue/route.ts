import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/timeline/overdue - Get overdue timeline events
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
    // Get current date/time
    const now = new Date()
    
    console.log('Fetching overdue timeline events before:', now)

    // Fetch timeline events that are in the past (user-scoped)
    // Exclude events from completed projects
    const overdueEvents = await prisma.timelineEvent.findMany({
      where: {
        date: {
          lt: now
        },
        Project: {
          ownerId: user.id,
          status: {
            notIn: ['COMPLETED', 'CANCELLED']
          }
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
      orderBy: { date: 'desc' } // Most recently overdue first
    })

    console.log(`Found ${overdueEvents.length} overdue timeline events`)
    
    // Calculate how overdue each event is and map relations
    const eventsWithOverdueInfo = overdueEvents.map(event => {
      const eventDate = new Date(event.date)
      const msOverdue = now.getTime() - eventDate.getTime()
      const daysOverdue = Math.floor(msOverdue / (1000 * 60 * 60 * 24))
      const hoursOverdue = Math.floor(msOverdue / (1000 * 60 * 60))

      // Map Project relation to project for frontend compatibility
      const { Project, ...eventData } = event

      return {
        ...eventData,
        project: Project,
        daysOverdue,
        hoursOverdue,
        overdueText: daysOverdue > 0
          ? `${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue`
          : `${hoursOverdue} hour${hoursOverdue !== 1 ? 's' : ''} overdue`
      }
    })
    
    return NextResponse.json(eventsWithOverdueInfo)
  } catch (error) {
    console.error('Timeline overdue GET error:', error)
    return NextResponse.json(
      { error: "Failed to fetch overdue timeline events", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
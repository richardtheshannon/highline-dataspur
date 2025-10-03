import { NextRequest, NextResponse } from 'next/server'
import { TimelineEventStatus } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Map frontend status values to database enum values
function mapStatusToDb(status: string): TimelineEventStatus {
  switch (status.toLowerCase()) {
    case 'pending': return TimelineEventStatus.PENDING
    case 'in_progress': return TimelineEventStatus.IN_PROGRESS
    case 'completed': return TimelineEventStatus.COMPLETED
    default: return TimelineEventStatus.PENDING
  }
}

// Map database enum values to frontend values
function mapStatusFromDb(status: TimelineEventStatus | null | undefined): 'pending' | 'in_progress' | 'completed' {
  if (!status) return 'pending'
  switch (status) {
    case TimelineEventStatus.PENDING: return 'pending'
    case TimelineEventStatus.IN_PROGRESS: return 'in_progress'
    case TimelineEventStatus.COMPLETED: return 'completed'
    default: return 'pending'
  }
}

// GET /api/projects - Get all projects with relations
export async function GET(request: NextRequest) {
  console.log('GET /api/projects - Request received')
  try {
    console.log('Getting session...')
    const session = await getSession()
    console.log('Session result:', session ? 'exists' : 'null')
    
    // For development, allow access without session for testing
    // In production, uncomment the following lines:
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    console.log('Fetching projects from database...')
    const projects = await prisma.project.findMany({
      // Filter by user when authentication is fully implemented
      // where: {
      //   OR: [
      //     { ownerId: session.user.id },
      //     { members: { some: { userId: session.user.id } } }
      //   ]
      // },
      include: {
        User: {
          select: { id: true, name: true, email: true }
        },
        TimelineEvent: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Found ${projects.length} projects`)
    console.log('Projects data:', projects)
    
    // Convert timeline event status from database enum to frontend format
    const projectsWithMappedStatus = projects.map(project => {
      const { User, TimelineEvent, ...projectData } = project
      return {
        ...projectData,
        owner: User, // Map User relation to owner for frontend compatibility
        timelineEvents: TimelineEvent.map(event => ({
          ...event,
          status: mapStatusFromDb(event.status),
          date: event.date.toISOString()
        }))
      }
    })
    
    return NextResponse.json(projectsWithMappedStatus)
  } catch (error) {
    console.error('Projects GET error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: "Failed to fetch projects", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    console.log('POST /api/projects - Request body:', JSON.stringify(body, null, 2))
    console.log('POST /api/projects - Session:', session ? 'exists' : 'null')
    const { name, description, projectGoal, projectValue, website, status, priority, projectType, startDate, endDate, timelineEvents } = body

    // Use session user ID or fallback to test user for development
    const userId = session?.user?.id || 'user_test_1' // For development testing

    // Create project and timeline events in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the project first
      const project = await tx.project.create({
        data: {
          id: crypto.randomUUID(),
          name,
          description,
          projectGoal,
          projectValue: projectValue ? parseFloat(projectValue) : null,
          website,
          status: status || 'PLANNING',
          priority: priority || 'MEDIUM',
          projectType: projectType || 'DEVELOPMENT',
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          ownerId: userId,
          updatedAt: new Date()
        },
        include: {
          User: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Create timeline events if provided
      let createdEvents: any[] = []
      if (timelineEvents && Array.isArray(timelineEvents) && timelineEvents.length > 0) {
        const timelineData = timelineEvents.map((event: any) => ({
          id: crypto.randomUUID(),
          projectId: project.id,
          title: event.title,
          description: event.description || null,
          date: new Date(event.date),
          type: event.type || 'milestone',
          status: mapStatusToDb(event.status || 'pending'),
          updatedAt: new Date()
        }))

        // Create timeline events individually (SQLite compatibility)
        for (const eventData of timelineData) {
          const createdEvent = await tx.timelineEvent.create({
            data: eventData
          })
          createdEvents.push(createdEvent)
        }
      }

      return { project, timelineEvents: createdEvents }
    })

    const { project, timelineEvents: createdTimelineEvents } = result

    // Convert timeline event status from database enum to frontend format
    const mappedTimelineEvents = createdTimelineEvents.map(event => ({
      ...event,
      status: mapStatusFromDb(event.status),
      date: event.date.toISOString()
    }))

    // Map User relation to owner for frontend compatibility
    return NextResponse.json({
      ...project,
      owner: project.User, // Map User relation to owner for frontend compatibility
      timelineEvents: mappedTimelineEvents
    }, { status: 201 })
  } catch (error) {
    console.error('Projects POST error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: "Failed to create project", 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
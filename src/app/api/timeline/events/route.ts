import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TimelineEventStatus } from '@prisma/client'

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

// POST /api/timeline/events - Create a new timeline event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.type || !body.projectId) {
      return NextResponse.json(
        { error: 'Title, type, and projectId are required' },
        { status: 400 }
      )
    }

    // Verify the project exists and belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: body.projectId,
        ownerId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Map status if provided
    const mappedStatus = body.status ? mapStatusToDb(body.status) : TimelineEventStatus.PENDING

    // Create the timeline event
    const newEvent = await prisma.timelineEvent.create({
      data: {
        title: body.title,
        description: body.description || null,
        date: body.date ? new Date(body.date) : new Date(),
        type: body.type,
        status: mappedStatus,
        projectId: body.projectId
      }
    })

    // Convert timeline event status from database enum to frontend format
    const eventWithMappedStatus = {
      ...newEvent,
      status: mapStatusFromDb(newEvent.status),
      date: newEvent.date.toISOString()
    }

    return NextResponse.json(eventWithMappedStatus, { status: 201 })
  } catch (error) {
    console.error('Error creating timeline event:', error)
    return NextResponse.json(
      { error: 'Failed to create timeline event' },
      { status: 500 }
    )
  }
}
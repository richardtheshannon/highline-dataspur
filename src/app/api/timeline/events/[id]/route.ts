import { NextRequest, NextResponse } from 'next/server'
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

// GET /api/timeline/events/[id] - Get a single timeline event
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    const event = await prisma.timelineEvent.findUnique({
      where: { id: eventId },
      include: {
        Project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Timeline event not found' },
        { status: 404 }
      )
    }

    // Convert timeline event status from database enum to frontend format
    const eventWithMappedStatus = {
      ...event,
      project: event.Project, // Map Project relation to project for frontend compatibility
      status: mapStatusFromDb(event.status),
      date: event.date.toISOString()
    }

    return NextResponse.json(eventWithMappedStatus)
  } catch (error) {
    console.error('Error fetching timeline event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline event' },
      { status: 500 }
    )
  }
}

// PUT /api/timeline/events/[id] - Update a timeline event
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.date || !body.type) {
      return NextResponse.json(
        { error: 'Title, date, and type are required' },
        { status: 400 }
      )
    }

    // Map status if provided
    const mappedStatus = body.status ? mapStatusToDb(body.status) : TimelineEventStatus.PENDING

    // Update the timeline event
    const updatedEvent = await prisma.timelineEvent.update({
      where: { id: eventId },
      data: {
        title: body.title,
        description: body.description || null,
        date: new Date(body.date),
        type: body.type,
        status: mappedStatus
      }
    })

    // Convert timeline event status from database enum to frontend format
    const eventWithMappedStatus = {
      ...updatedEvent,
      status: mapStatusFromDb(updatedEvent.status),
      date: updatedEvent.date.toISOString()
    }

    return NextResponse.json(eventWithMappedStatus)
  } catch (error) {
    console.error('Error updating timeline event:', error)
    
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Timeline event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update timeline event' },
      { status: 500 }
    )
  }
}

// DELETE /api/timeline/events/[id] - Delete a timeline event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id

    // Delete the timeline event
    await prisma.timelineEvent.delete({
      where: { id: eventId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting timeline event:', error)
    
    if ((error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Timeline event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete timeline event' },
      { status: 500 }
    )
  }
}
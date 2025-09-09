import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
        project: {
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

    return NextResponse.json(event)
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

    // Update the timeline event
    const updatedEvent = await prisma.timelineEvent.update({
      where: { id: eventId },
      data: {
        title: body.title,
        description: body.description || null,
        date: new Date(body.date),
        type: body.type
      }
    })

    return NextResponse.json(updatedEvent)
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
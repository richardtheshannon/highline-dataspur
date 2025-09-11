import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/projects/[id] - Get individual project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        timelineEvents: {
          orderBy: { date: 'asc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error('Project GET error:', error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('PUT /api/projects/[id] - Request body:', JSON.stringify(body, null, 2))
    const { name, description, projectGoal, projectValue, website, status, priority, projectType, startDate, endDate, timelineEvents } = body

    // Update project and timeline events in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the project first
      const updatedProject = await tx.project.update({
        where: { id: params.id },
        data: {
          name,
          description,
          projectGoal,
          projectValue: projectValue ? parseFloat(projectValue.toString()) : null,
          website,
          status,
          priority,
          projectType,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      // Handle timeline events if provided
      let updatedEvents: any[] = []
      if (timelineEvents !== undefined) {
        // Delete existing timeline events for this project
        await tx.timelineEvent.deleteMany({
          where: { projectId: params.id }
        })

        // Create new timeline events if array is not empty
        if (Array.isArray(timelineEvents) && timelineEvents.length > 0) {
          const timelineData = timelineEvents.map((event: any) => ({
            projectId: params.id,
            title: event.title,
            description: event.description || null,
            date: new Date(event.date),
            type: event.type || 'milestone'
          }))

          // Create timeline events individually (for compatibility)
          for (const eventData of timelineData) {
            const createdEvent = await tx.timelineEvent.create({
              data: eventData
            })
            updatedEvents.push(createdEvent)
          }
        }
      } else {
        // If timelineEvents not provided, fetch existing ones
        updatedEvents = await tx.timelineEvent.findMany({
          where: { projectId: params.id },
          orderBy: { date: 'asc' }
        })
      }

      return { project: updatedProject, timelineEvents: updatedEvents }
    })

    const { project, timelineEvents: updatedTimelineEvents } = result

    return NextResponse.json({ 
      ...project, 
      timelineEvents: updatedTimelineEvents 
    })
  } catch (error) {
    console.error('Project PUT error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: "Failed to update project",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.project.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Project DELETE error:', error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
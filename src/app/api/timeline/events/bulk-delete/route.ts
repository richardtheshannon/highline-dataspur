import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // First verify the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete all timeline events for this project
    const deleteResult = await prisma.timelineEvent.deleteMany({
      where: {
        projectId: projectId
      }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} timeline event${deleteResult.count !== 1 ? 's' : ''}`
    })

  } catch (error) {
    console.error('Error deleting timeline events:', error)
    return NextResponse.json(
      { error: 'Failed to delete timeline events' },
      { status: 500 }
    )
  }
}
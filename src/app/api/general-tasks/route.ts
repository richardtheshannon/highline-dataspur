import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/general-tasks - Get all general tasks for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get all general tasks for the user
    const tasks = await prisma.generalTask.findMany({
      where: { userId: user.id },
      orderBy: [
        { completed: 'asc' },  // Incomplete tasks first
        { dueDate: 'asc' },    // Then by due date
        { createdAt: 'desc' }  // Then by creation date (newest first)
      ]
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching general tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch general tasks' },
      { status: 500 }
    )
  }
}

// POST /api/general-tasks - Create a new general task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, dueDate } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Validate optional fields
    if (description !== undefined && typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      )
    }

    if (dueDate !== undefined && dueDate !== null) {
      const parsedDate = new Date(dueDate)
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid due date format' },
          { status: 400 }
        )
      }
    }

    // Create the task
    const task = await prisma.generalTask.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating general task:', error)
    return NextResponse.json(
      { error: 'Failed to create general task' },
      { status: 500 }
    )
  }
}
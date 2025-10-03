import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/general-tasks/migrate - Migrate localStorage tasks to database
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
    const { tasks } = body

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Tasks must be an array' },
        { status: 400 }
      )
    }

    // Validate and process each task
    const validTasks = []
    for (const task of tasks) {
      if (
        typeof task === 'object' &&
        task !== null &&
        typeof task.title === 'string' &&
        task.title.trim().length > 0
      ) {
        validTasks.push({
          id: crypto.randomUUID(),
          userId: user.id,
          title: task.title.trim(),
          description: typeof task.description === 'string' ? task.description.trim() || null : null,
          completed: Boolean(task.completed),
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          updatedAt: new Date()
        })
      }
    }

    if (validTasks.length === 0) {
      return NextResponse.json({ migrated: 0, message: 'No valid tasks to migrate' })
    }

    // Create all valid tasks in the database
    const result = await prisma.generalTask.createMany({
      data: validTasks,
      skipDuplicates: true
    })

    return NextResponse.json({
      migrated: result.count,
      message: `Successfully migrated ${result.count} tasks to database`
    })
  } catch (error) {
    console.error('Error migrating general tasks:', error)
    return NextResponse.json(
      { error: 'Failed to migrate general tasks' },
      { status: 500 }
    )
  }
}
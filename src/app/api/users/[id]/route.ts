import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/users/[id] - Get single user
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: params.id
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, email, role, resetPassword, newPassword } = body

    // Basic validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Password reset validation
    if (resetPassword && (!newPassword || newPassword.length < 6)) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is taken by another user
    const emailTaken = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id: params.id
        }
      }
    })

    if (emailTaken) {
      return NextResponse.json(
        { error: 'Email is already taken by another user' },
        { status: 400 }
      )
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      role: role || 'USER'
    }

    // Hash new password if resetting
    if (resetPassword && newPassword) {
      const bcrypt = require('bcryptjs')
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      updateData.password = hashedPassword
    }

    // Update user
    const user = await prisma.user.update({
      where: {
        id: params.id
      },
      data: updateData
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has any projects (might want to prevent deletion if they have projects)
    const userProjects = await prisma.project.findMany({
      where: { userId: params.id }
    })

    if (userProjects.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing projects. Please reassign or delete projects first.' },
        { status: 400 }
      )
    }

    // Delete user
    await prisma.user.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
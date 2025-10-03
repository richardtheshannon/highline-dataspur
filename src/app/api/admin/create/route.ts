import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/admin/create - One-time admin user creation
export async function POST(request: Request) {
  try {
    // Check if any admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin user already exists' },
        { status: 400 }
      )
    }
    
    // Hash the default password
    const hashedPassword = await bcrypt.hash('DataSpur2025!', 10)
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: 'admin@dataspur.com',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN',
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      credentials: {
        email: 'admin@dataspur.com',
        password: 'DataSpur2025!'
      }
    })
    
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
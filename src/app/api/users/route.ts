// src/app/api/users/route.ts

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client'; // Import the UserRole enum

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // 1. Validate input
    if (!name || !email || !password || !role) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse('User with this email already exists', { status: 409 });
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the new user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole, // Cast the role to the UserRole enum
        isActive: true, // New users are active by default
      },
    });

    // Exclude password from the returned user object
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({ message: 'User created successfully', user: userWithoutPassword }, { status: 201 });

  } catch (error) {
    console.error('USER_CREATION_ERROR:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

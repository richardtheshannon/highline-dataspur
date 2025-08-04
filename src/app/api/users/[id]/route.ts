// src/app/api/users/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import bcrypt from 'bcryptjs';

/**
 * Handles updating a user's information (name, email, isActive).
 * - Only Admins can change the 'isActive' status.
 * - Users can update their own name/email.
 * - Admins can update anyone's name/email.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // 1. Authentication Check: Ensure user is logged in.
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userIdToUpdate = params.id;
  const body = await request.json();
  const { name, email, isActive } = body;

  const updateData: { name?: string; email?: string; isActive?: boolean } = {};

  // 2. Authorization and Data Preparation
  
  // Logic for updating 'isActive' status (Admin only)
  if (typeof isActive === 'boolean') {
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ message: "Forbidden: Only admins can change user status." }, { status: 403 });
    }
    if (userIdToUpdate === session.user.id) {
      return NextResponse.json({ message: "Forbidden: Admins cannot change their own active status." }, { status: 403 });
    }
    updateData.isActive = isActive;
  }

  // Logic for updating name/email (User can edit self, Admin can edit anyone)
  if (name || email) {
    if (session.user.id !== userIdToUpdate && session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Forbidden: You can only edit your own profile." }, { status: 403 });
    }
    if (name) updateData.name = name;
    if (email) updateData.email = email;
  }

  // 3. Validation: Ensure there's something to update
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ message: "Bad Request: No valid fields to update." }, { status: 400 });
  }

  // 4. Database Update
  try {
    const updatedUser = await prisma.user.update({
      where: { id: userIdToUpdate },
      data: updateData,
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Handles resetting a user's password.
 * - Only Admins can reset passwords.
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    // 1. Authorization Check: Ensure user is an Admin
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Forbidden: Only admins can reset passwords." }, { status: 403 });
    }

    try {
        const userId = params.id;
        const body = await request.json();
        const { password } = body;

        // 2. Validation
        if (!userId) {
            return new NextResponse('User ID is required', { status: 400 });
        }
        if (!password || password.length < 6) {
            return new NextResponse('Password must be at least 6 characters long', { status: 400 });
        }

        // 3. Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Update the user's password in the database
        await prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword,
            },
        });

        return NextResponse.json({ message: 'Password updated successfully' }, { status: 200 });

    } catch (error) {
        console.error('PASSWORD_RESET_ERROR:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}


/**
 * Handles deleting a user.
 * - Only Admins can delete users.
 * - Admins cannot delete their own account.
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // 1. Authorization Check: Ensure user is an Admin
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  
  const userIdToDelete = params.id;

  // 2. Business Logic: Prevent self-deletion
  if (session.user.id === userIdToDelete) {
    return NextResponse.json({ message: 'Forbidden: You cannot delete your own account.' }, { status: 403 });
  }

  // 3. Database Deletion
  try {
    await prisma.user.delete({
      where: { id: userIdToDelete },
    });
    // Return a success response with no content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

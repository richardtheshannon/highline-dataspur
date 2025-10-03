import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const categories = await prisma.reportCategory.findMany({
      where: { userId: user.id },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
        _count: {
          select: { Report: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const rootCategories = categories.filter(cat => !cat.parentId);

    return NextResponse.json(rootCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let level = 0;
    if (parentId) {
      const parentCategory = await prisma.reportCategory.findUnique({
        where: { id: parentId },
      });

      if (!parentCategory) {
        return NextResponse.json({ error: 'Parent category not found' }, { status: 404 });
      }

      if (parentCategory.level >= 3) {
        return NextResponse.json(
          { error: 'Maximum nesting depth reached (4 levels)' },
          { status: 400 }
        );
      }

      level = parentCategory.level + 1;
    }

    const category = await prisma.reportCategory.create({
      data: {
        name,
        userId: user.id,
        parentId,
        level,
      },
      include: {
        children: true,
        _count: {
          select: { Report: true },
        },
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
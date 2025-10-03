import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        ReportCategory: true,
        ReportSection: {
          orderBy: { order: 'asc' },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (!report.isPublic) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user || user.id !== report.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found or unauthorized' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, content, categoryId, author, isPublic } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    if (author !== undefined) updateData.author = author;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    if (categoryId !== undefined) {
      const category = await prisma.reportCategory.findFirst({
        where: {
          id: categoryId,
          userId: user.id,
        },
      });

      if (!category) {
        return NextResponse.json(
          { error: 'Category not found or unauthorized' },
          { status: 404 }
        );
      }
      updateData.categoryId = categoryId;
    }

    const updatedReport = await prisma.report.update({
      where: { id: params.id },
      data: updateData,
      include: {
        ReportCategory: true,
        ReportSection: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const report = await prisma.report.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found or unauthorized' },
        { status: 404 }
      );
    }

    await prisma.report.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
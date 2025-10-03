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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { userId: user.id };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          ReportCategory: true,
          ReportSection: {
            select: {
              isComplete: true,
            },
          },
          _count: {
            select: { ReportSection: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.report.count({ where }),
    ]);

    // Calculate section progress for each report
    const reportsWithProgress = reports.map(report => {
      const sections = report.ReportSection || [];
      const completedSections = sections.filter(s => s.isComplete).length;
      const totalSections = sections.length;

      // Remove the ReportSection array from the response to reduce payload
      const { ReportSection, ...reportData } = report;

      return {
        ...reportData,
        sectionProgress: {
          completed: completedSections,
          total: totalSections,
        },
      };
    });

    return NextResponse.json({
      reports: reportsWithProgress,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
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
    const { title, description, content, categoryId, author, isPublic } = body;

    if (!title || !categoryId) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      );
    }

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

    const report = await prisma.report.create({
      data: {
        title,
        description,
        content: content || '',
        categoryId,
        author: author || user.name || user.email,
        isPublic: isPublic !== undefined ? isPublic : true,
        userId: user.id,
      },
      include: {
        ReportCategory: true,
        ReportSection: true,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    const section = await prisma.reportSection.findUnique({
      where: { id: params.id },
      include: {
        Report: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    if (section.Report.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isComplete } = body;

    const updatedSection = await prisma.reportSection.update({
      where: { id: params.id },
      data: {
        isComplete,
        completedAt: isComplete ? new Date() : null,
      },
    });

    await prisma.report.update({
      where: { id: section.reportId },
      data: { updatedAt: new Date() },
    });

    const allSections = await prisma.reportSection.findMany({
      where: { reportId: section.reportId },
    });

    const completedCount = allSections.filter(s => s.isComplete).length;
    const totalCount = allSections.length;

    return NextResponse.json({
      section: updatedSection,
      progress: {
        completed: completedCount,
        total: totalCount,
        percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Error toggling section completion:', error);
    return NextResponse.json(
      { error: 'Failed to toggle section completion' },
      { status: 500 }
    );
  }
}
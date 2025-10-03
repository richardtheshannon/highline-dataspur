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
    const { heading, content } = body;

    const updateData: any = {};
    if (heading !== undefined) updateData.heading = heading;
    if (content !== undefined) updateData.content = content;

    const updatedSection = await prisma.reportSection.update({
      where: { id: params.id },
      data: updateData,
    });

    await prisma.report.update({
      where: { id: section.reportId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}
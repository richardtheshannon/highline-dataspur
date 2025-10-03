import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
    const { content, sections } = body;

    const updatePromises = [];

    if (content !== undefined) {
      updatePromises.push(
        prisma.report.update({
          where: { id: params.id },
          data: { content },
        })
      );
    }

    if (sections && Array.isArray(sections)) {
      for (const section of sections) {
        if (section.id) {
          const existingSection = await prisma.reportSection.findFirst({
            where: {
              id: section.id,
              reportId: params.id,
            },
          });

          if (existingSection) {
            updatePromises.push(
              prisma.reportSection.update({
                where: { id: section.id },
                data: {
                  heading: section.heading,
                  content: section.content,
                  order: section.order,
                },
              })
            );
          }
        } else if (section.heading && section.content !== undefined) {
          updatePromises.push(
            prisma.reportSection.create({
              data: {
                reportId: params.id,
                heading: section.heading,
                content: section.content,
                order: section.order || 0,
              },
            })
          );
        }
      }
    }

    await Promise.all(updatePromises);

    await prisma.report.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    const updatedReport = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        ReportCategory: true,
        ReportSection: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json(
      { error: 'Failed to save report' },
      { status: 500 }
    );
  }
}
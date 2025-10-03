import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function parseH2Sections(html: string) {
  const sections: { heading: string; content: string; order: number }[] = [];

  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gi;
  const matches = Array.from(html.matchAll(h2Regex));

  if (matches.length === 0) {
    return sections;
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const heading = match[1].replace(/<[^>]*>/g, '').trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = i < matches.length - 1 ? matches[i + 1].index! : html.length;
    const content = html.substring(startIndex, endIndex).trim();

    sections.push({
      heading,
      content,
      order: i,
    });
  }

  return sections;
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
    const {
      title,
      description,
      content,
      categoryId,
      author,
      isPublic,
      overwrite,
    } = body;

    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { error: 'Title, content, and category are required' },
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

    const existingReport = await prisma.report.findFirst({
      where: {
        title,
        userId: user.id,
      },
    });

    if (existingReport && !overwrite) {
      return NextResponse.json(
        {
          error: 'Report with this title already exists',
          existingReportId: existingReport.id,
        },
        { status: 409 }
      );
    }

    const sections = parseH2Sections(content);

    if (existingReport && overwrite) {
      await prisma.reportSection.deleteMany({
        where: { reportId: existingReport.id },
      });

      const updatedReport = await prisma.report.update({
        where: { id: existingReport.id },
        data: {
          description,
          content,
          categoryId,
          author: author || user.name || user.email,
          isPublic: isPublic !== undefined ? isPublic : true,
        },
      });

      if (sections.length > 0) {
        await prisma.reportSection.createMany({
          data: sections.map(section => ({
            reportId: updatedReport.id,
            ...section,
          })),
        });
      }

      const reportWithSections = await prisma.report.findUnique({
        where: { id: updatedReport.id },
        include: {
          ReportCategory: true,
          ReportSection: {
            orderBy: { order: 'asc' },
          },
        },
      });

      return NextResponse.json(reportWithSections);
    } else {
      const newReport = await prisma.report.create({
        data: {
          title,
          description,
          content,
          categoryId,
          author: author || user.name || user.email,
          isPublic: isPublic !== undefined ? isPublic : true,
          userId: user.id,
        },
      });

      if (sections.length > 0) {
        await prisma.reportSection.createMany({
          data: sections.map(section => ({
            reportId: newReport.id,
            ...section,
          })),
        });
      }

      const reportWithSections = await prisma.report.findUnique({
        where: { id: newReport.id },
        include: {
          ReportCategory: true,
          ReportSection: {
            orderBy: { order: 'asc' },
          },
        },
      });

      return NextResponse.json(reportWithSections);
    }
  } catch (error) {
    console.error('Error importing report:', error);
    return NextResponse.json(
      { error: 'Failed to import report' },
      { status: 500 }
    );
  }
}
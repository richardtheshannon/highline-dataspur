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
    const query = searchParams.get('q');
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const where: any = {
      userId: user.id,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        ReportCategory: true,
        _count: {
          select: { ReportSection: true },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
      ],
      take: limit,
    });

    const resultsWithHighlights = reports.map(report => {
      const titleMatch = report.title.toLowerCase().includes(query.toLowerCase());
      const descriptionMatch = report.description?.toLowerCase().includes(query.toLowerCase());
      const contentMatch = report.content.toLowerCase().includes(query.toLowerCase());

      let contentSnippet = '';
      if (contentMatch) {
        const index = report.content.toLowerCase().indexOf(query.toLowerCase());
        const start = Math.max(0, index - 50);
        const end = Math.min(report.content.length, index + query.length + 50);
        contentSnippet = (start > 0 ? '...' : '') +
                        report.content.substring(start, end).replace(/<[^>]*>/g, '') +
                        (end < report.content.length ? '...' : '');
      }

      return {
        ...report,
        _search: {
          titleMatch,
          descriptionMatch,
          contentMatch,
          contentSnippet,
        },
      };
    });

    return NextResponse.json({
      results: resultsWithHighlights,
      query,
      total: resultsWithHighlights.length,
    });
  } catch (error) {
    console.error('Error searching reports:', error);
    return NextResponse.json(
      { error: 'Failed to search reports' },
      { status: 500 }
    );
  }
}
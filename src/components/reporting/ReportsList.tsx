'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Report {
  id: string;
  title: string;
  description: string | null;
  categoryId: string;
  author: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ReportSection: number;
  };
  sectionProgress?: {
    completed: number;
    total: number;
  };
  _search?: {
    titleMatch: boolean;
    descriptionMatch: boolean;
    contentMatch: boolean;
    contentSnippet: string;
  };
}

interface ReportsListProps {
  reports: Report[];
  loading: boolean;
  selectedCategory: string | null;
  searchQuery?: string;
}

export default function ReportsList({ reports, loading, selectedCategory, searchQuery }: ReportsListProps) {
  const router = useRouter();

  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} style={{ backgroundColor: '#fef08a', padding: '1px 2px', borderRadius: '2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  const handleReportClick = (reportId: string) => {
    router.push(`/dashboard/reporting/${reportId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="stats-card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </div>

            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-3 w-full mb-2" />
            <Skeleton className="h-3 w-2/3 mb-4" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64" style={{ color: 'var(--text-muted)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '1rem', opacity: 0.5 }}>
          description
        </span>
        <p style={{ fontSize: '1.125rem', fontWeight: 500 }}>No reports found</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {selectedCategory
            ? 'No reports in this category. Import a report to get started.'
            : 'Import your first report to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
      {reports.map((report) => {
        const progress = report.sectionProgress || { completed: 0, total: 0 };
        const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

        return (
          <div
            key={report.id}
            onClick={() => handleReportClick(report.id)}
            className="stats-card"
            style={{ cursor: 'pointer', padding: '1rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: '20px' }}>
                article
              </span>
              {progressPercentage === 100 && (
                <span className="material-symbols-outlined" style={{ color: '#10b981', fontSize: '20px' }}>
                  check_circle
                </span>
              )}
            </div>

            <h3 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.5rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
              {searchQuery ? highlightText(report.title, searchQuery) : report.title}
            </h3>

            {report.description && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                {searchQuery ? highlightText(report.description, searchQuery) : report.description}
              </p>
            )}

            {/* Show content snippet if it's a search result */}
            {report._search?.contentMatch && report._search.contentSnippet && (
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-secondary)',
                padding: '0.5rem',
                borderRadius: '4px',
                marginBottom: '0.75rem',
                fontStyle: 'italic',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
                    search
                  </span>
                  <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Content Match
                  </span>
                </div>
                {searchQuery ? highlightText(report._search.contentSnippet, searchQuery) : report._search.contentSnippet}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {report.author && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                  <span>{report.author}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                <span>{formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}</span>
              </div>

              {progress.total > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Progress</span>
                    <span>{progress.completed} / {progress.total} sections</span>
                  </div>
                  <div style={{ width: '100%', backgroundColor: 'var(--border)', borderRadius: '9999px', height: '0.375rem', overflow: 'hidden' }}>
                    <div
                      style={{
                        backgroundColor: progressPercentage === 100 ? '#10b981' : 'var(--accent)',
                        height: '100%',
                        borderRadius: '9999px',
                        transition: 'width 0.3s ease',
                        width: `${progressPercentage}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
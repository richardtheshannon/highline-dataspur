'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Head from 'next/head';
import { FileText, User, Calendar, CheckCircle, Circle, Share, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

interface Report {
  id: string;
  title: string;
  description: string | null;
  content: string;
  author: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  category?: {
    id: string;
    name: string;
  };
}

interface Section {
  id: string;
  heading: string;
  content: string;
  order: number;
  isComplete: boolean;
  completedAt: string | null;
}

export default function PublicReportPage() {
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reportId = params.id as string;

  useEffect(() => {
    if (!reportId) return;
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reporting/reports/${reportId}?public=true`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report not found or not publicly shared');
        }
        throw new Error('Failed to fetch report');
      }

      const data = await response.json();
      // Map the API response to match our interface
      const mappedReport = {
        ...data,
        category: data.ReportCategory,
        sections: data.ReportSection || []
      };
      setReport(mappedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-500 mb-4 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h1 className="text-xl font-semibold mb-2">Report Not Available</h1>
          <p>{error || 'This report is not publicly shared or does not exist.'}</p>
        </div>
      </div>
    );
  }

  const completedSections = report.sections?.filter(s => s.isComplete).length || 0;
  const totalSections = report.sections?.length || 0;
  const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  const generateDescription = () => {
    if (report?.description) return report.description;
    const progress = totalSections > 0 ? ` • ${completedSections}/${totalSections} sections complete` : '';
    const author = report?.author ? ` by ${report.author}` : '';
    return `DataSpur Report${author}${progress}`;
  };

  return (
    <>
      <Head>
        <title>{report ? `${report.title} - DataSpur Report` : 'DataSpur Report'}</title>
        <meta name="description" content={report ? generateDescription() : 'DataSpur Report'} />

        {/* Open Graph tags */}
        <meta property="og:title" content={report ? `${report.title} - DataSpur Report` : 'DataSpur Report'} />
        <meta property="og:description" content={report ? generateDescription() : 'DataSpur Report'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
        <meta property="og:site_name" content="DataSpur" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={report ? `${report.title} - DataSpur Report` : 'DataSpur Report'} />
        <meta name="twitter:description" content={report ? generateDescription() : 'DataSpur Report'} />

        {/* Additional meta tags */}
        {report?.author && <meta name="author" content={report.author} />}
        <meta name="robots" content="index, follow" />
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-3xl font-bold">{report.title}</h1>
                <div className="text-sm text-gray-500 mt-1">
                  Public Report
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Share className="h-4 w-4" />
                  Share Link
                </>
              )}
            </Button>
          </div>

          {report.description && (
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">{report.description}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
            {report.author && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By {report.author}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Updated {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}</span>
            </div>
            {report.category && (
              <div className="text-blue-600 dark:text-blue-400">
                {report.category.name}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {totalSections > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Completion Progress</span>
                <span>{completedSections} of {totalSections} sections complete</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {Math.round(progressPercentage)}% complete
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Main content if no sections */}
        {(!report.sections || report.sections.length === 0) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: report.content }}
            />
          </div>
        )}

        {/* Sections */}
        {report.sections && report.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div
              key={section.id}
              className={`mb-8 rounded-lg shadow-sm overflow-hidden ${
                section.isComplete
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className={`px-6 py-4 border-b ${
                section.isComplete
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700'
              }`}>
                <h2 className="text-xl font-semibold flex items-center gap-3">
                  {section.isComplete ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400" />
                  )}
                  {section.heading}
                </h2>
                {section.isComplete && section.completedAt && (
                  <div className="text-sm text-green-600 dark:text-green-400 mt-2">
                    ✓ Completed {formatDistanceToNow(new Date(section.completedAt), { addSuffix: true })}
                  </div>
                )}
              </div>
              <div
                className={`px-6 py-6 prose dark:prose-invert max-w-none ${
                  section.isComplete ? 'opacity-90' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            </div>
          ))}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 border-t pt-8">
          <p>This report was shared publicly from DataSpur</p>
        </div>
      </div>
      </div>
    </>
  );
}
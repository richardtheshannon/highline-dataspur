'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, FileText, User, Calendar, CheckCircle, Circle, Edit, Save, X, Share, Copy, Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SectionEditor from '@/components/reporting/SectionEditor';

interface Report {
  id: string;
  title: string;
  description: string | null;
  content: string;
  author: string | null;
  categoryId: string;
  isPublic: boolean;
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
  updatedAt?: string;
}

export default function ReportViewerPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareDropdownOpen, setShareDropdownOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const reportId = params.id as string;

  useEffect(() => {
    if (!reportId) return;
    fetchReport();
  }, [reportId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareDropdownOpen && !(event.target as Element).closest('[data-share-dropdown]')) {
        setShareDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shareDropdownOpen]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reporting/reports/${reportId}`);

      if (!response.ok) {
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
      setError('Failed to load report');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const toggleSectionComplete = async (sectionId: string) => {
    if (!report) return;

    try {
      const response = await fetch(`/api/reporting/sections/${sectionId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const section = report.sections.find(s => s.id === sectionId);
        const willBeComplete = !section?.isComplete;

        // Update local state
        setReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            sections: prev.sections.map(section =>
              section.id === sectionId
                ? { ...section, isComplete: !section.isComplete, completedAt: section.isComplete ? null : new Date().toISOString() }
                : section
            ),
          };
        });

        // Auto-collapse when marking as complete, auto-expand when marking as incomplete
        if (willBeComplete) {
          setCollapsedSections(prev => new Set([...prev, sectionId]));
        } else {
          setCollapsedSections(prev => {
            const newSet = new Set(prev);
            newSet.delete(sectionId);
            return newSet;
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle section completion:', err);
    }
  };

  const handleEditSection = (sectionId: string) => {
    setEditingSectionId(sectionId);
    setEditStartTime(new Date().toISOString());
  };

  const handleSaveSection = async (sectionId: string, content: string) => {
    try {
      const currentSection = report?.sections.find(s => s.id === sectionId);

      // Check for concurrent edits by comparing timestamps
      if (currentSection?.updatedAt && editStartTime) {
        const sectionLastModified = new Date(currentSection.updatedAt);
        const editStart = new Date(editStartTime);

        if (sectionLastModified > editStart) {
          const proceed = window.confirm(
            'Warning: This section has been modified by another user since you started editing. ' +
            'Saving will overwrite their changes. Do you want to continue?'
          );

          if (!proceed) {
            throw new Error('Save cancelled due to concurrent edit');
          }
        }
      }

      const response = await fetch(`/api/reporting/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const updatedSection = await response.json();

        // Update local state
        setReport(prev => {
          if (!prev) return null;
          return {
            ...prev,
            sections: prev.sections.map(section =>
              section.id === sectionId
                ? { ...section, content, updatedAt: updatedSection.updatedAt }
                : section
            ),
          };
        });
        setEditingSectionId(null);
        setEditStartTime(null);
      } else {
        throw new Error('Failed to save section');
      }
    } catch (err) {
      console.error('Failed to save section:', err);
      throw err; // Re-throw to let the editor handle the error
    }
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditStartTime(null);
  };

  const handleCopyPublicLink = async () => {
    if (!report) return;

    const publicUrl = `${window.location.origin}/public/report/${report.id}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const togglePublicAccess = async () => {
    if (!report) return;

    try {
      const response = await fetch(`/api/reporting/reports/${report.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !report.isPublic }),
      });

      if (response.ok) {
        setReport(prev => prev ? { ...prev, isPublic: !prev.isPublic } : null);
      }
    } catch (err) {
      console.error('Failed to toggle public access:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="border-b bg-white dark:bg-gray-800 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-3" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border rounded-lg bg-white dark:bg-gray-800">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-red-500 mb-4">{error || 'Report not found'}</div>
        <Button onClick={() => router.push('/dashboard/reporting')}>
          Back to Reports
        </Button>
      </div>
    );
  }

  const completedSections = report.sections?.filter(s => s.isComplete).length || 0;
  const totalSections = report.sections?.length || 0;
  const progressPercentage = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/reporting')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Category: <span className="font-medium">{report.category?.name || 'No Category'}</span>
            </div>
            <div className="relative" data-share-dropdown>
              <Button
                variant="outline"
                onClick={() => setShareDropdownOpen(!shareDropdownOpen)}
                className="flex items-center gap-2"
              >
                <Share className="h-4 w-4" />
                Share
              </Button>
              {shareDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-10 p-4">
                  <h3 className="font-semibold mb-3">Share Report</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span className="text-sm">Public Access</span>
                      </div>
                      <Button
                        variant={report.isPublic ? "default" : "outline"}
                        size="sm"
                        onClick={togglePublicAccess}
                      >
                        {report.isPublic ? 'On' : 'Off'}
                      </Button>
                    </div>

                    {report.isPublic && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Anyone with the link can view this report
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={`${window.location.origin}/public/report/${report.id}`}
                            readOnly
                            className="flex-1 px-3 py-2 text-sm border rounded bg-gray-50 dark:bg-gray-700"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyPublicLink}
                            className="flex items-center gap-1"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                Copy
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {!report.isPublic && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable public access to generate a shareable link
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShareDropdownOpen(false)}
                      className="w-full"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <FileText className="h-8 w-8 text-blue-500 mt-1" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-2">{report.title}</h1>
            {report.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-3">{report.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {report.author && (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{report.author}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Updated {formatDistanceToNow(new Date(report.updatedAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalSections > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{completedSections} of {totalSections} sections complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          {/* Display the full report content as HTML */}
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: report.content }}
          />
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryTreeView from './CategoryTreeView';
import ReportsList from './ReportsList';
import ReportSearch from './ReportSearch';
import ImportReportDialog from './ImportReportDialog';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  children?: Category[];
  _count?: {
    reports: number;
  };
}

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
}

export default function ReportingLayout() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/reporting/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    try {
      let response;

      if (searchQuery) {
        // Use search API
        const params = new URLSearchParams();
        params.append('q', searchQuery);
        if (selectedCategory) {
          params.append('categoryId', selectedCategory);
        }

        response = await fetch(`/api/reporting/search?${params}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data.results || []);
        }
      } else {
        // Use regular reports API
        const params = new URLSearchParams();
        if (selectedCategory) {
          params.append('categoryId', selectedCategory);
        }

        response = await fetch(`/api/reporting/reports?${params}`);
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleImportComplete = () => {
    setIsImportDialogOpen(false);
    fetchCategories();
    fetchReports();
  };

  const handleCreateCategory = async (name: string, parentId: string | null) => {
    try {
      const response = await fetch('/api/reporting/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, parentId }),
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  return (
    <div className="safe-margin projects-page">
      {/* Header with Import Button - Full width */}
      <div className="projects-header">
        <div>
          <h1 className="create-project-title">Reporting Projects</h1>
          <p className="create-project-subtitle">Import and manage markdown documentation</p>
        </div>
        <div className="flex gap-2">
          <ReportSearch onSearch={handleSearch} />
          <button
            onClick={() => setIsImportDialogOpen(true)}
            className="form-btn form-btn-primary flex items-center gap-2"
          >
            <span className="material-symbols-outlined">upload_file</span>
            Import Report
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6 items-start" style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', alignItems: 'start' }}>
        {/* Left Column - Categories */}
        <div className="main-content-left">
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="material-symbols-outlined">folder</span>
              Categories
            </h3>
            <CategoryTreeView
              categories={categories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={handleCategorySelect}
              onCreateCategory={handleCreateCategory}
              onRefresh={fetchCategories}
            />
          </div>
        </div>

        {/* Right Column - Reports List */}
        <div className="main-content-right">
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="material-symbols-outlined">description</span>
              {selectedCategory ? 'Category Reports' : 'All Reports'}
              {searchQuery && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  Searching: "{searchQuery}"
                </span>
              )}
            </h3>
            <ReportsList
              reports={reports}
              loading={loading}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
            />
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      <ImportReportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        categories={categories}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}
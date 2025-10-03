'use client';

import { useState, useRef } from 'react';
import {
  validateMarkdownFile,
  readFileAsText,
  markdownToHtml,
  parseH2Sections,
  extractTitleFromMarkdown,
  extractDescriptionFromMarkdown,
} from '@/lib/markdownParser';

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  level: number;
  children?: Category[];
}

interface ImportReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onImportComplete: () => void;
}

export default function ImportReportDialog({
  isOpen,
  onClose,
  categories,
  onImportComplete,
}: ImportReportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build flat list of categories for dropdown
  const flattenCategories = (cats: Category[], prefix = ''): Array<{ id: string; name: string }> => {
    const result: Array<{ id: string; name: string }> = [];
    cats.forEach(cat => {
      result.push({ id: cat.id, name: prefix + cat.name });
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children, prefix + '  '));
      }
    });
    return result;
  };

  const flatCategories = flattenCategories(categories);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validation = validateMarkdownFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setFile(selectedFile);
    setError(null);

    try {
      // Read file content
      const content = await readFileAsText(selectedFile);
      setMarkdownContent(content);

      // Extract title and description
      const extractedTitle = extractTitleFromMarkdown(content);
      const extractedDescription = extractDescriptionFromMarkdown(content);

      // Auto-populate fields
      setTitle(extractedTitle || selectedFile.name.replace(/\.(md|markdown)$/i, ''));
      setDescription(extractedDescription);

      // Check for duplicates
      await checkForDuplicates(extractedTitle);
    } catch (err) {
      setError('Failed to read file');
      console.error(err);
    }
  };

  const checkForDuplicates = async (reportTitle: string) => {
    try {
      const response = await fetch(`/api/reporting/reports?search=${encodeURIComponent(reportTitle)}`);
      if (response.ok) {
        const reports = await response.json();
        if (reports.length > 0) {
          const exactMatch = reports.find((r: any) => r.title.toLowerCase() === reportTitle.toLowerCase());
          if (exactMatch) {
            setDuplicateWarning(`A report with the title "${reportTitle}" already exists. Importing will create a duplicate.`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check for duplicates:', err);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const response = await fetch('/api/reporting/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim(), parentId: null }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategoryId(newCategory.id);
        setNewCategoryName('');
        setIsCreatingCategory(false);
        // Trigger parent to refresh categories
        window.location.reload(); // Simple refresh for now
      }
    } catch (err) {
      setError('Failed to create category');
    }
  };

  const handleImport = async () => {
    if (!file || !title || !categoryId || !markdownContent) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert markdown to HTML
      const html = markdownToHtml(markdownContent);

      // Parse H2 sections
      const sections = parseH2Sections(html);

      // Create import request
      const importData = {
        title: title.trim(),
        description: description.trim() || null,
        author: author.trim() || null,
        categoryId,
        content: html,
        sections: sections.map(section => ({
          heading: section.heading,
          content: section.content,
          order: section.order,
        })),
      };

      const response = await fetch('/api/reporting/reports/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import report');
      }

      // Success
      onImportComplete();
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setAuthor('');
    setCategoryId('');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setError(null);
    setDuplicateWarning(null);
    setMarkdownContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="material-symbols-outlined">upload_file</span>
            Import Markdown Report
          </h2>
          <button onClick={handleClose} className="modal-close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body">
          <p className="form-section-description mb-4">
            Upload a markdown file to create a new report with automatic section detection.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleImport(); }} className="space-y-4">
            {/* File Upload */}
            <div className="form-field">
              <label className="form-label" htmlFor="file">
                Markdown File *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                id="file"
                accept=".md,.markdown"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="form-btn form-btn-secondary w-full flex items-center justify-start gap-2"
              >
                {file ? (
                  <>
                    <span className="material-symbols-outlined">description</span>
                    {file.name}
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">upload_file</span>
                    Choose file (.md, .markdown)
                  </>
                )}
              </button>
              {file && (
                <p className="text-xs text-gray-500 mt-1">
                  Size: {(file.size / 1024).toFixed(2)} KB
                </p>
              )}
            </div>

            {/* Title */}
            <div className="form-field">
              <label className="form-label" htmlFor="title">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  checkForDuplicates(e.target.value);
                }}
                placeholder="Report title"
                className="form-input"
                required
              />
            </div>

            {/* Description */}
            <div className="form-field">
              <label className="form-label" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the report"
                rows={3}
                className="form-input form-textarea"
              />
            </div>

            {/* Author */}
            <div className="form-field">
              <label className="form-label" htmlFor="author">
                Author
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Report author (optional)"
                className="form-input"
              />
            </div>

            {/* Category */}
            <div className="form-field">
              <label className="form-label" htmlFor="category">
                Category *
              </label>
              <div className="space-y-2">
                {!isCreatingCategory ? (
                  <div className="flex gap-2">
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="form-input form-select flex-1"
                      required
                    >
                      <option value="">Select a category</option>
                      {flatCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(true)}
                      className="form-btn form-btn-secondary"
                    >
                      New Category
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="New category name"
                      className="form-input flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                      className="form-btn form-btn-primary"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="form-btn form-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Duplicate Warning */}
            {duplicateWarning && (
              <div className="create-project-error mb-4 bg-yellow-50 border border-yellow-200">
                <span className="material-symbols-outlined text-2xl text-yellow-600 mr-3">warning</span>
                <p className="text-yellow-800">{duplicateWarning}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="create-project-error mb-4">
                <span className="material-symbols-outlined text-2xl text-red-400 mr-3">error</span>
                <p className="text-red-100">{error}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="submit"
                disabled={loading || !file || !title || !categoryId}
                className="form-btn form-btn-primary"
              >
                {loading && <span className="material-symbols-outlined animate-spin">refresh</span>}
                {loading ? 'Importing...' : 'Import Report'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="form-btn form-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
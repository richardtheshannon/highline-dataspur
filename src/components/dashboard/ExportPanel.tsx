'use client'

import { useState } from 'react'
import DateRangePicker from './DateRangePicker'
import { downloadPDFReport } from '@/lib/pdfReportGenerator'

interface ExportPanelProps {
  campaigns: any[]
  totals: any
  performanceScore: number
  performanceStatus: { label: string; color: string }
  budgetPacing: any
  timeRange: string
}

export default function ExportPanel({
  campaigns,
  totals,
  performanceScore,
  performanceStatus,
  budgetPacing,
  timeRange
}: ExportPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [includeGoals, setIncludeGoals] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv')
  const [isExporting, setIsExporting] = useState(false)

  const handleDateChange = (start: Date | null, end: Date | null) => {
    setCustomStartDate(start)
    setCustomEndDate(end)
  }

  const handleExportCSV = async () => {
    try {
      setIsExporting(true)

      const params = new URLSearchParams({
        format: 'csv',
        includeGoals: includeGoals.toString()
      })

      if (customStartDate && customEndDate) {
        params.append('startDate', customStartDate.toISOString())
        params.append('endDate', customEndDate.toISOString())
      } else {
        params.append('timeRange', timeRange)
      }

      const response = await fetch(`/api/apis/google-adwords/export?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `google-ads-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Show success message
      alert('CSV export completed successfully!')
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = () => {
    try {
      setIsExporting(true)

      // Generate PDF report
      downloadPDFReport({
        campaigns,
        totals,
        performanceScore,
        performanceStatus,
        budgetPacing: {
          monthlyBudget: budgetPacing.monthlyBudget || 5000,
          percentSpent: budgetPacing.percentSpent || 0,
          projectedSpend: budgetPacing.projectedSpend || 0,
          remainingBudget: budgetPacing.remainingBudget || 0,
          pacingStatus: budgetPacing.pacingStatus || 'on-track'
        },
        timeRange,
        generatedAt: new Date()
      })

      // Show success message
      alert('PDF report generated successfully!')
    } catch (error) {
      console.error('PDF generation error:', error)
      alert('Failed to generate PDF report. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExport = () => {
    if (exportFormat === 'csv') {
      handleExportCSV()
    } else {
      handleExportPDF()
    }
  }

  return (
    <div className="export-panel">
      {/* Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', color: 'var(--accent)' }}>
            download
          </span>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '500', color: 'var(--text-primary)' }}>
            Export & Reporting
          </h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="icon-btn"
          type="button"
        >
          <span className="material-symbols-outlined">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="panel-content">
          {/* Export Format Selection */}
          <div className="format-selection">
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
              Export Format
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setExportFormat('csv')}
                className={`format-btn ${exportFormat === 'csv' ? 'active' : ''}`}
                type="button"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                  table_chart
                </span>
                <span>CSV</span>
              </button>
              <button
                onClick={() => setExportFormat('pdf')}
                className={`format-btn ${exportFormat === 'pdf' ? 'active' : ''}`}
                type="button"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
                  description
                </span>
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Date Range Picker */}
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '500', marginBottom: '0.5rem', display: 'block' }}>
              Date Range
            </label>
            <DateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              onDateChange={handleDateChange}
            />
          </div>

          {/* Options (CSV only) */}
          {exportFormat === 'csv' && (
            <div className="export-options">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeGoals}
                  onChange={(e) => setIncludeGoals(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Include campaign goals
                </span>
              </label>
            </div>
          )}

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="export-btn"
            type="button"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1.25rem' }}>
              {isExporting ? 'hourglass_empty' : 'download'}
            </span>
            <span>
              {isExporting
                ? 'Exporting...'
                : `Export as ${exportFormat.toUpperCase()}`}
            </span>
          </button>

          {/* Info Text */}
          <div className="info-text">
            <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--accent)' }}>
              info
            </span>
            <span>
              {exportFormat === 'csv'
                ? 'CSV exports include all campaign metrics and can be opened in Excel or Google Sheets.'
                : 'PDF reports include performance summary, budget pacing, and top campaigns.'}
            </span>
          </div>
        </div>
      )}

      <style jsx>{`
        .export-panel {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          overflow: hidden;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          cursor: pointer;
        }

        .panel-header:hover {
          background: var(--background-secondary);
        }

        .panel-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .format-selection {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .format-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid var(--border-color);
          background: var(--background-secondary);
          color: var(--text-primary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .format-btn:hover {
          border-color: var(--accent);
          background: var(--card-bg);
        }

        .format-btn.active {
          border-color: var(--accent);
          background: var(--accent);
          color: white;
        }

        .format-btn span:last-child {
          font-size: 0.875rem;
          font-weight: 500;
        }

        .export-options {
          padding: 1rem;
          background: var(--background-secondary);
          border-radius: 8px;
        }

        .export-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .export-btn:hover:not(:disabled) {
          background: var(--accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .info-text {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem;
          background: var(--background-secondary);
          border-radius: 6px;
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-btn:hover {
          color: var(--accent);
        }

        @media (max-width: 768px) {
          .panel-content {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

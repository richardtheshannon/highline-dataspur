'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onDateChange: (startDate: Date | null, endDate: Date | null) => void
  presets?: Array<{
    label: string
    value: string
    days: number
  }>
}

const defaultPresets = [
  { label: '7 days', value: '7d', days: 7 },
  { label: '30 days', value: '30d', days: 30 },
  { label: '90 days', value: '90d', days: 90 },
  { label: '1 year', value: '1y', days: 365 }
]

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  presets = defaultPresets
}: DateRangePickerProps) {
  const [isCustom, setIsCustom] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState('30d')

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset)
    setIsCustom(false)

    const presetConfig = presets.find(p => p.value === preset)
    if (presetConfig) {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - presetConfig.days)
      onDateChange(start, end)
    }
  }

  const handleCustomToggle = () => {
    setIsCustom(!isCustom)
    if (!isCustom) {
      // Initialize with current dates or defaults
      const end = endDate || new Date()
      const start = startDate || (() => {
        const date = new Date()
        date.setDate(date.getDate() - 30)
        return date
      })()
      onDateChange(start, end)
    }
  }

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value ? new Date(e.target.value) : null
    onDateChange(newStart, endDate)
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value ? new Date(e.target.value) : null
    onDateChange(startDate, newEnd)
  }

  return (
    <div className="date-range-picker">
      {/* Preset Buttons */}
      <div className="preset-buttons">
        {presets.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`preset-btn ${selectedPreset === preset.value && !isCustom ? 'active' : ''}`}
            type="button"
          >
            {preset.label}
          </button>
        ))}
        <button
          onClick={handleCustomToggle}
          className={`preset-btn ${isCustom ? 'active' : ''}`}
          type="button"
        >
          Custom
        </button>
      </div>

      {/* Custom Date Inputs */}
      {isCustom && (
        <div className="custom-date-inputs">
          <div className="date-input-group">
            <label htmlFor="start-date">Start Date</label>
            <input
              id="start-date"
              type="date"
              value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              onChange={handleStartDateChange}
              max={endDate ? format(endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
              className="date-input"
            />
          </div>
          <div className="date-separator">to</div>
          <div className="date-input-group">
            <label htmlFor="end-date">End Date</label>
            <input
              id="end-date"
              type="date"
              value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
              onChange={handleEndDateChange}
              min={startDate ? format(startDate, 'yyyy-MM-dd') : undefined}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="date-input"
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .date-range-picker {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .preset-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .preset-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          background: var(--background-secondary);
          color: var(--text-primary);
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .preset-btn:hover {
          border-color: var(--accent);
          background: var(--card-bg);
        }

        .preset-btn.active {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }

        .custom-date-inputs {
          display: flex;
          align-items: flex-end;
          gap: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
        }

        .date-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .date-input-group label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .date-input {
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .date-input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .date-separator {
          padding-bottom: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .custom-date-inputs {
            flex-direction: column;
            align-items: stretch;
          }

          .date-separator {
            padding: 0;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}

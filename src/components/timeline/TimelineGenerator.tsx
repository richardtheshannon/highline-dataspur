'use client'

import React, { useState, useEffect } from 'react'
import { generateTimelineEvents, TimelineEvent, HeaderWithContent } from '@/lib/markdownParser'

interface TimelineGeneratorProps {
  headers: string[]
  headersWithContent?: HeaderWithContent[]
  onTimelineGenerated: (events: TimelineEvent[]) => void
  initialStartDate?: Date
  initialSpacing?: number
}

const SPACING_OPTIONS = [
  { value: 0, label: 'None', description: 'No calendar dates' },
  { value: 1, label: '1 Day', description: 'Daily milestones' },
  { value: 3, label: '3 Days', description: 'Every 3 days' },
  { value: 5, label: '5 Days', description: 'Work week spacing' },
  { value: 7, label: '7 Days', description: 'Weekly milestones' },
  { value: 14, label: '14 Days', description: 'Bi-weekly' },
  { value: 30, label: '30 Days', description: 'Monthly milestones' }
]

export default function TimelineGenerator({
  headers,
  headersWithContent,
  onTimelineGenerated,
  initialStartDate = new Date(),
  initialSpacing = 7
}: TimelineGeneratorProps) {
  const [startDate, setStartDate] = useState(
    initialStartDate.toISOString().split('T')[0]
  )
  const [spacingDays, setSpacingDays] = useState(initialSpacing)
  const [previewEvents, setPreviewEvents] = useState<TimelineEvent[]>([])

  // Generate timeline events whenever inputs change
  useEffect(() => {
    if (headersWithContent && headersWithContent.length > 0) {
      // Use new method with content
      const events = generateTimelineEvents(
        headersWithContent,
        new Date(startDate),
        spacingDays
      )
      setPreviewEvents(events)
      onTimelineGenerated(events)
    } else if (headers.length > 0) {
      // Fallback to legacy method for backward compatibility
      const { generateTimelineEventsFromHeaders } = require('@/lib/markdownParser')
      const events = generateTimelineEventsFromHeaders(
        headers,
        new Date(startDate),
        spacingDays
      )
      setPreviewEvents(events)
      onTimelineGenerated(events)
    }
  }, [headers, headersWithContent, startDate, spacingDays])

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value)
  }

  const handleSpacingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSpacingDays(parseInt(e.target.value))
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTotalDuration = () => {
    if (headers.length === 0) return '0 days'
    if (spacingDays === 0) return 'No dates assigned'
    const totalDays = (headers.length - 1) * spacingDays
    if (totalDays === 0) return 'Same day'
    if (totalDays < 7) return `${totalDays} days`
    if (totalDays < 30) return `${Math.round(totalDays / 7)} weeks`
    return `${Math.round(totalDays / 30)} months`
  }

  if (headers.length === 0) {
    return (
      <div className="timeline-generator timeline-generator-empty">
        <div className="empty-state">
          <span className="material-symbols-outlined">timeline</span>
          <p>Upload a markdown file with H1 headers to generate timeline</p>
        </div>
      </div>
    )
  }

  return (
    <div className="timeline-generator">
      <div className="timeline-config">
        <div className="config-row">
          <div className="form-field">
            <label htmlFor="timeline-start-date" className="form-label">
              Start Date
            </label>
            <input
              id="timeline-start-date"
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="timeline-spacing" className="form-label">
              Event Spacing
            </label>
            <select
              id="timeline-spacing"
              value={spacingDays}
              onChange={handleSpacingChange}
              className="form-input form-select"
            >
              {SPACING_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="timeline-summary">
          <div className="summary-item">
            <span className="summary-label">Timeline Events:</span>
            <span className="summary-value">{headers.length} milestones</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Duration:</span>
            <span className="summary-value">{getTotalDuration()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">End Date:</span>
            <span className="summary-value">
              {spacingDays === 0 
                ? 'No dates assigned'
                : previewEvents.length > 0 
                  ? formatDate(previewEvents[previewEvents.length - 1].date)
                  : 'N/A'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="timeline-preview-section">
        <h4 className="timeline-preview-title">
          <span className="material-symbols-outlined">visibility</span>
          Timeline Preview
        </h4>
        
        <div className="timeline-events">
          {previewEvents.slice(0, 5).map((event, index) => (
            <div key={index} className="timeline-event-item">
              <div className="event-marker">
                <span className="event-number">{index + 1}</span>
              </div>
              <div className="event-content">
                <div className="event-title">{event.title}</div>
                <div className="event-date">{spacingDays === 0 ? 'No date' : formatDate(event.date)}</div>
              </div>
            </div>
          ))}
          
          {previewEvents.length > 5 && (
            <div className="timeline-event-item timeline-more">
              <div className="event-marker">
                <span className="material-symbols-outlined">more_horiz</span>
              </div>
              <div className="event-content">
                <div className="event-title">
                  +{previewEvents.length - 5} more events
                </div>
                <div className="event-date">
                  {spacingDays === 0 ? 'No dates' : formatDate(previewEvents[previewEvents.length - 1].date)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
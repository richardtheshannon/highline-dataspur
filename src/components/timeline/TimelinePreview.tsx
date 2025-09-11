'use client'

import React, { useState } from 'react'
import { TimelineEvent } from '@/lib/markdownParser'

interface TimelinePreviewProps {
  events: TimelineEvent[]
  markdownContent?: string
  onEventsModified?: (events: TimelineEvent[]) => void
  readonly?: boolean
}

export default function TimelinePreview({ 
  events, 
  markdownContent,
  onEventsModified,
  readonly = false
}: TimelinePreviewProps) {
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null)
  const [showMarkdown, setShowMarkdown] = useState(false)

  const handleEventToggle = (index: number) => {
    setExpandedEvent(expandedEvent === index ? null : index)
  }

  const handleEventEdit = (index: number, field: keyof TimelineEvent, value: string) => {
    if (readonly || !onEventsModified) return

    const updatedEvents = [...events]
    if (field === 'date') {
      updatedEvents[index] = { ...updatedEvents[index], [field]: new Date(value) }
    } else {
      updatedEvents[index] = { ...updatedEvents[index], [field]: value }
    }
    onEventsModified(updatedEvents)
  }

  const handleEventDelete = (index: number) => {
    if (readonly || !onEventsModified) return
    
    const updatedEvents = events.filter((_, i) => i !== index)
    onEventsModified(updatedEvents)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  if (events.length === 0) {
    return (
      <div className="timeline-preview timeline-preview-empty">
        <div className="empty-state">
          <span className="material-symbols-outlined">event_note</span>
          <p>No timeline events generated yet</p>
          <p className="empty-subtext">Upload a markdown file to create timeline events</p>
        </div>
      </div>
    )
  }

  return (
    <div className="timeline-preview">
      <div className="timeline-preview-header">
        <h4 className="timeline-preview-title">
          <span className="material-symbols-outlined">timeline</span>
          Generated Timeline ({events.length} events)
        </h4>
        
        <div className="timeline-actions">
          {markdownContent && (
            <button
              type="button"
              onClick={() => setShowMarkdown(!showMarkdown)}
              className="timeline-action-btn"
            >
              <span className="material-symbols-outlined">
                {showMarkdown ? 'visibility_off' : 'visibility'}
              </span>
              {showMarkdown ? 'Hide' : 'View'} Markdown
            </button>
          )}
        </div>
      </div>

      {showMarkdown && markdownContent && (
        <div className="markdown-preview">
          <div className="markdown-preview-header">
            <h5>Source Markdown Content</h5>
            <button
              type="button"
              onClick={() => setShowMarkdown(false)}
              className="markdown-close-btn"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="markdown-content">
            <pre>{markdownContent}</pre>
          </div>
        </div>
      )}

      <div className="timeline-events-list">
        {events.map((event, index) => (
          <div key={index} className="timeline-event">
            <div className="timeline-event-main">
              <div className="event-marker">
                <div className="event-dot"></div>
                {index < events.length - 1 && <div className="event-line"></div>}
              </div>
              
              <div className="event-details">
                <div className="event-header">
                  <div className="event-info">
                    {readonly ? (
                      <h5 className="event-title-display">{event.title}</h5>
                    ) : (
                      <input
                        type="text"
                        value={event.title}
                        onChange={(e) => handleEventEdit(index, 'title', e.target.value)}
                        className="event-title-input"
                        placeholder="Event title"
                      />
                    )}
                    <div className="event-meta">
                      <span className="event-date-display">
                        <span className="material-symbols-outlined">schedule</span>
                        {formatDate(event.date)}
                      </span>
                      <span className="event-type">{event.type}</span>
                    </div>
                  </div>
                  
                  <div className="event-actions">
                    <button
                      type="button"
                      onClick={() => handleEventToggle(index)}
                      className="event-expand-btn"
                    >
                      <span className="material-symbols-outlined">
                        {expandedEvent === index ? 'expand_less' : 'expand_more'}
                      </span>
                    </button>
                    
                    {!readonly && (
                      <button
                        type="button"
                        onClick={() => handleEventDelete(index)}
                        className="event-delete-btn"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {expandedEvent === index && (
                  <div className="event-expanded">
                    <div className="expanded-field">
                      <label className="expanded-label">Date</label>
                      {readonly ? (
                        <span className="expanded-value">{formatDate(event.date)}</span>
                      ) : (
                        <input
                          type="date"
                          value={formatDateForInput(event.date)}
                          onChange={(e) => handleEventEdit(index, 'date', e.target.value)}
                          className="form-input form-input-sm"
                        />
                      )}
                    </div>
                    
                    <div className="expanded-field">
                      <label className="expanded-label">Description</label>
                      {readonly ? (
                        <div 
                          className="expanded-value timeline-html-content" 
                          dangerouslySetInnerHTML={{ __html: event.description || 'No description' }}
                        />
                      ) : (
                        <textarea
                          value={event.description || ''}
                          onChange={(e) => handleEventEdit(index, 'description', e.target.value)}
                          className="form-input form-textarea form-input-sm"
                          placeholder="Event description"
                          rows={2}
                        />
                      )}
                    </div>
                    
                    <div className="expanded-field">
                      <label className="expanded-label">Type</label>
                      {readonly ? (
                        <span className="expanded-value">{event.type}</span>
                      ) : (
                        <select
                          value={event.type}
                          onChange={(e) => handleEventEdit(index, 'type', e.target.value)}
                          className="form-input form-select form-input-sm"
                        >
                          <option value="milestone">Milestone</option>
                          <option value="task">Task</option>
                          <option value="meeting">Meeting</option>
                          <option value="deadline">Deadline</option>
                          <option value="review">Review</option>
                          <option value="launch">Launch</option>
                        </select>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {!readonly && events.length > 0 && (
        <div className="timeline-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-value">{events.length}</span>
              <span className="stat-label">Total Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.ceil((events[events.length - 1].date.getTime() - events[0].date.getTime()) / (1000 * 60 * 60 * 24))}
              </span>
              <span className="stat-label">Days Span</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
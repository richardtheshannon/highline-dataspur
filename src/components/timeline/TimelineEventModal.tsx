'use client'

import React, { useState, useEffect } from 'react'

interface TimelineEvent {
  id: string
  projectId: string
  title: string
  description: string | null
  date: string
  type: string
  createdAt: string
  updatedAt: string
}

interface TimelineEventModalProps {
  event: TimelineEvent | null
  isOpen: boolean
  onClose: () => void
  onSave: (event: TimelineEvent) => Promise<void>
  mode: 'view' | 'edit'
}

const TimelineEventModal: React.FC<TimelineEventModalProps> = ({ 
  event, 
  isOpen, 
  onClose, 
  onSave,
  mode: initialMode 
}) => {
  const [mode, setMode] = useState(initialMode)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    type: 'milestone'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to strip HTML tags for editing
  const stripHtmlTags = (html: string): string => {
    if (!html) return ''
    // Create a temporary div to parse HTML
    const temp = document.createElement('div')
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ''
  }

  useEffect(() => {
    if (event) {
      // Format date for input field (YYYY-MM-DD)
      const dateObj = new Date(event.date)
      const formattedDate = dateObj.toISOString().split('T')[0]
      
      setFormData({
        title: event.title,
        description: event.description ? stripHtmlTags(event.description) : '',
        date: formattedDate,
        type: event.type
      })
    }
    setMode(initialMode)
  }, [event, initialMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!event) return
    
    setLoading(true)
    setError(null)
    
    try {
      await onSave({
        ...event,
        title: formData.title,
        description: formData.description || null,
        date: new Date(formData.date).toISOString(),
        type: formData.type
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save timeline event')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getEventTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      'milestone': 'flag',
      'task': 'task_alt',
      'meeting': 'groups',
      'deadline': 'schedule',
      'release': 'rocket_launch',
      'default': 'event'
    }
    return iconMap[type] || iconMap.default
  }

  if (!isOpen || !event) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="material-symbols-outlined">
              {mode === 'view' ? 'visibility' : 'edit'}
            </span>
            {mode === 'view' ? 'View' : 'Edit'} Timeline Event
          </h2>
          <button onClick={onClose} className="modal-close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="create-project-error mb-4">
              <span className="material-symbols-outlined text-2xl text-red-400 mr-3">error</span>
              <p className="text-red-100">{error}</p>
            </div>
          )}

          {mode === 'view' ? (
            <div className="timeline-event-view">
              <div className="timeline-event-view-header">
                <span className={`material-symbols-outlined timeline-event-view-icon`}>
                  {getEventTypeIcon(event.type)}
                </span>
                <div>
                  <h3 className="timeline-event-view-title">{event.title}</h3>
                  <p className="timeline-event-view-date">{formatDate(event.date)}</p>
                </div>
              </div>
              
              {event.description && (
                <div className="timeline-event-view-section">
                  <h4 className="form-label">Description</h4>
                  <div 
                    className="timeline-event-view-description timeline-html-content"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                </div>
              )}
              
              <div className="timeline-event-view-section">
                <h4 className="form-label">Event Type</h4>
                <span className="timeline-event-type-badge">
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setMode('edit')}
                  className="form-btn form-btn-primary"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Edit Event
                </button>
                <button
                  onClick={onClose}
                  className="form-btn form-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="timeline-event-form">
              <div className="form-field">
                <label className="form-label" htmlFor="event-title">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="event-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="event-date">
                  Event Date *
                </label>
                <input
                  type="date"
                  id="event-date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="event-type">
                  Event Type *
                </label>
                <select
                  id="event-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="form-input form-select"
                  required
                >
                  <option value="milestone">Milestone</option>
                  <option value="task">Task</option>
                  <option value="meeting">Meeting</option>
                  <option value="deadline">Deadline</option>
                  <option value="release">Release</option>
                </select>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="event-description">
                  Description
                </label>
                <textarea
                  id="event-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="form-input form-textarea"
                  rows={3}
                  placeholder="Optional description for this event"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="form-btn form-btn-primary"
                >
                  {loading && <span className="material-symbols-outlined animate-spin">refresh</span>}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => mode === 'edit' && event ? setMode('view') : onClose()}
                  className="form-btn form-btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimelineEventModal
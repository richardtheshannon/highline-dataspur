'use client'

import React, { useState } from 'react'
import TimelineEventModal from './TimelineEventModal'

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

interface TimelineDisplayProps {
  timelineEvents: TimelineEvent[]
  onEventsUpdate?: () => void
}

const TimelineDisplay: React.FC<TimelineDisplayProps> = ({ timelineEvents, onEventsUpdate }) => {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [events, setEvents] = useState(timelineEvents)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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

  const getEventTypeColor = (type: string) => {
    const colorMap: Record<string, string> = {
      'milestone': 'bg-blue-500',
      'task': 'bg-green-500',
      'meeting': 'bg-purple-500',
      'deadline': 'bg-red-500',
      'release': 'bg-orange-500',
      'default': 'bg-gray-500'
    }
    return colorMap[type] || colorMap.default
  }

  const handleView = (event: TimelineEvent) => {
    setSelectedEvent(event)
    setModalMode('view')
    setIsModalOpen(true)
  }

  const handleEdit = (event: TimelineEvent) => {
    setSelectedEvent(event)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleDelete = async (eventId: string) => {
    if (deleteConfirm !== eventId) {
      setDeleteConfirm(eventId)
      // Auto-reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000)
      return
    }

    try {
      const response = await fetch(`/api/timeline/events/${eventId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete timeline event')
      }

      // Update local state
      setEvents(events.filter(e => e.id !== eventId))
      setDeleteConfirm(null)
      
      // Notify parent component if callback provided
      if (onEventsUpdate) {
        onEventsUpdate()
      }
    } catch (error) {
      console.error('Error deleting timeline event:', error)
      alert('Failed to delete timeline event')
    }
  }

  const handleSave = async (updatedEvent: TimelineEvent) => {
    try {
      const response = await fetch(`/api/timeline/events/${updatedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: updatedEvent.title,
          description: updatedEvent.description,
          date: updatedEvent.date,
          type: updatedEvent.type
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update timeline event')
      }

      const savedEvent = await response.json()
      
      // Update local state
      setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e))
      
      // Notify parent component if callback provided
      if (onEventsUpdate) {
        onEventsUpdate()
      }
    } catch (error) {
      console.error('Error updating timeline event:', error)
      throw error
    }
  }

  if (!events || events.length === 0) {
    return (
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="material-symbols-outlined">timeline</span>
          Project Timeline Events
        </h3>
        <div className="empty-state">
          <span className="material-symbols-outlined empty-icon">timeline</span>
          <div className="empty-text">
            No timeline events yet. Timeline events are created when you upload a markdown file during project creation.
          </div>
        </div>
      </div>
    )
  }

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <>
      <div className="form-section">
        <h3 className="form-section-title">
          <span className="material-symbols-outlined">timeline</span>
          Project Timeline Events ({events.length})
        </h3>
        
        <div className="timeline-events-container">
          {sortedEvents.map((event, index) => (
            <div key={event.id} className="timeline-event-item">
              <div className="timeline-event-connector">
                <div className={`timeline-event-dot ${getEventTypeColor(event.type)}`}>
                  <span className="material-symbols-outlined timeline-event-icon">
                    {getEventTypeIcon(event.type)}
                  </span>
                </div>
                {index < sortedEvents.length - 1 && (
                  <div className="timeline-event-line"></div>
                )}
              </div>
              
              <div className="timeline-event-content">
                <div className="timeline-event-header">
                  <h4 className="timeline-event-title">{event.title}</h4>
                  <div className="timeline-event-actions">
                    <button
                      onClick={() => handleView(event)}
                      className="timeline-action-btn timeline-action-view"
                      title="View event details"
                    >
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button
                      onClick={() => handleEdit(event)}
                      className="timeline-action-btn timeline-action-edit"
                      title="Edit event"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className={`timeline-action-btn timeline-action-delete ${deleteConfirm === event.id ? 'confirm-delete' : ''}`}
                      title={deleteConfirm === event.id ? 'Click again to confirm' : 'Delete event'}
                    >
                      <span className="material-symbols-outlined">
                        {deleteConfirm === event.id ? 'delete_forever' : 'delete'}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="timeline-event-date">
                  {formatDate(event.date)}
                </div>
                
                {event.description && (
                  <p className="timeline-event-description">
                    {event.description}
                  </p>
                )}
                
                <div className="timeline-event-meta">
                  <span className="timeline-event-type">
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                  <span className="timeline-event-created">
                    Added {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TimelineEventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedEvent(null)
        }}
        onSave={handleSave}
        mode={modalMode}
      />
    </>
  )
}

export default TimelineDisplay
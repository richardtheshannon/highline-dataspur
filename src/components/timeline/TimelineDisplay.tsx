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
  status: 'pending' | 'in_progress' | 'completed'
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
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  // Update events when parent passes new timelineEvents
  React.useEffect(() => {
    setEvents(timelineEvents)
  }, [timelineEvents])

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

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  const expandAllEvents = () => {
    setExpandedEvents(new Set(events.map(e => e.id)))
  }

  const collapseAllEvents = () => {
    setExpandedEvents(new Set())
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

  const handleDeleteAll = async () => {
    if (!events[0]?.projectId) {
      console.error('No project ID found')
      return
    }

    setDeleteAllLoading(true)
    try {
      const response = await fetch(`/api/timeline/events/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectId: events[0].projectId })
      })

      if (!response.ok) {
        throw new Error('Failed to delete all timeline events')
      }

      // Update local state
      setEvents([])
      setShowDeleteAllModal(false)
      
      // Notify parent component if callback provided
      if (onEventsUpdate) {
        onEventsUpdate()
      }
    } catch (error) {
      console.error('Error deleting all timeline events:', error)
      alert('Failed to delete all timeline events')
    } finally {
      setDeleteAllLoading(false)
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
          type: updatedEvent.type,
          status: updatedEvent.status
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

  // Quick status update handler
  const handleQuickStatusUpdate = async (eventId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    const event = events.find(e => e.id === eventId)
    if (!event) return

    setUpdatingStatus(eventId)
    try {
      const response = await fetch(`/api/timeline/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: event.title,
          description: event.description,
          date: event.date,
          type: event.type,
          status: newStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update timeline event status')
      }

      const savedEvent = await response.json()
      
      // Update local state with the response from the server
      setEvents(events.map(e => e.id === savedEvent.id ? savedEvent : e))
      
      // Don't call onEventsUpdate for quick status changes - we handle it locally
      // This prevents unnecessary page refetch
    } catch (error) {
      console.error('Error updating timeline event status:', error)
      // Revert status on error
      alert('Failed to update status. Please try again.')
    } finally {
      setUpdatingStatus(null)
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
        <div className="timeline-section-header">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">timeline</span>
            Project Timeline Events ({events.length})
          </h3>
          <div className="timeline-header-controls">
            {events.some(e => e.description) && (
              <div className="timeline-expand-controls">
                <button
                  onClick={expandAllEvents}
                  className="timeline-control-btn"
                  title="Expand all events"
                >
                  <span className="material-symbols-outlined">unfold_more</span>
                  Expand All
                </button>
                <button
                  onClick={collapseAllEvents}
                  className="timeline-control-btn"
                  title="Collapse all events"
                >
                  <span className="material-symbols-outlined">unfold_less</span>
                  Collapse All
                </button>
              </div>
            )}
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="timeline-control-btn timeline-delete-all-btn"
              title="Delete all timeline events"
            >
              <span className="material-symbols-outlined">delete_sweep</span>
              Delete All
            </button>
          </div>
        </div>
        
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
                  <div className="timeline-event-title-row">
                    {event.description && (
                      <button
                        onClick={() => toggleEventExpansion(event.id)}
                        className="timeline-expand-btn"
                        title={expandedEvents.has(event.id) ? 'Collapse' : 'Expand'}
                      >
                        <span className={`material-symbols-outlined timeline-chevron ${expandedEvents.has(event.id) ? 'expanded' : ''}`}>
                          expand_more
                        </span>
                      </button>
                    )}
                    <h4 className="timeline-event-title">{event.title}</h4>
                  </div>
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
                
                {event.description && expandedEvents.has(event.id) && (
                  <div 
                    className="timeline-event-description timeline-html-content expanded"
                    dangerouslySetInnerHTML={{ __html: event.description }}
                  />
                )}
                
                <div className="timeline-event-meta">
                  <span className="timeline-event-type">
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </span>
                  <select
                    value={event.status}
                    onChange={(e) => handleQuickStatusUpdate(event.id, e.target.value as 'pending' | 'in_progress' | 'completed')}
                    className={`timeline-status-dropdown status-${event.status}`}
                    onClick={(e) => e.stopPropagation()}
                    disabled={updatingStatus === event.id}
                    style={{ opacity: updatingStatus === event.id ? 0.6 : 1 }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
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

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="modal-backdrop" onClick={() => !deleteAllLoading && setShowDeleteAllModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="material-symbols-outlined text-red-500">warning</span>
                Delete All Timeline Events
              </h2>
              {!deleteAllLoading && (
                <button
                  onClick={() => setShowDeleteAllModal(false)}
                  className="modal-close-btn"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              )}
            </div>
            
            <div className="modal-body">
              <p className="text-gray-300 mb-4">
                Are you sure you want to delete all {events.length} timeline event{events.length !== 1 ? 's' : ''}?
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 font-semibold mb-2">
                  <span className="material-symbols-outlined align-middle mr-2">dangerous</span>
                  This action cannot be undone!
                </p>
                <p className="text-gray-400 text-sm">
                  All timeline events for this project will be permanently removed. You will need to regenerate them from a markdown file if needed.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                disabled={deleteAllLoading}
                className="form-btn form-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleteAllLoading}
                className="form-btn form-btn-danger flex items-center gap-2"
              >
                {deleteAllLoading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">refresh</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">delete_forever</span>
                    Delete All Events
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TimelineDisplay
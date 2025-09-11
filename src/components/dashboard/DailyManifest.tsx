'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TimelineEvent {
  id: string
  title: string
  description: string | null
  date: string
  type: string
  status: 'pending' | 'in_progress' | 'completed'
  project: {
    id: string
    name: string
    status: string
    priority: string
    projectType: string
  }
}

export default function DailyManifest() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTodayEvents()
  }, [])

  const fetchTodayEvents = async () => {
    try {
      const response = await fetch('/api/timeline/today')
      if (!response.ok) {
        throw new Error('Failed to fetch timeline events')
      }
      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'milestone':
        return 'flag'
      case 'task':
        return 'task_alt'
      case 'meeting':
        return 'groups'
      case 'deadline':
        return 'schedule'
      case 'release':
        return 'rocket_launch'
      default:
        return 'event'
    }
  }

  const getEventColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'milestone':
        return '#ff6b6b'
      case 'task':
        return '#4dabf7'
      case 'meeting':
        return '#69db7c'
      case 'deadline':
        return '#ffd43b'
      case 'release':
        return '#e599f7'
      default:
        return '#868e96'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case 'URGENT':
        return '#ff6b6b'
      case 'HIGH':
        return '#ffa94d'
      case 'MEDIUM':
        return '#4dabf7'
      case 'LOW':
        return '#69db7c'
      default:
        return '#868e96'
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="daily-manifest-card">
      <div className="manifest-header">
        <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>
          calendar_today
        </span>
        <h3>Daily Manifest</h3>
        <span className="manifest-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
      </div>

      <div className="manifest-content">
        {loading ? (
          <div className="manifest-loading">
            <span className="material-symbols-outlined rotating">sync</span>
            <p>Loading today's events...</p>
          </div>
        ) : error ? (
          <div className="manifest-error">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="manifest-empty">
            <span className="material-symbols-outlined">event_available</span>
            <p>No events scheduled for today</p>
            <p className="manifest-empty-subtitle">Your schedule is clear!</p>
          </div>
        ) : (
          <div className="manifest-events">
            {events.map((event) => (
              <Link 
                key={event.id}
                href={`/dashboard/projects/${event.project.id}`}
                className="manifest-event-link"
              >
                <div className="manifest-event">
                  <div className="event-time-column">
                    <span className="event-time">{formatTime(event.date)}</span>
                  </div>
                  
                  <div 
                    className="event-icon-column"
                    style={{ backgroundColor: `${getEventColor(event.type)}20` }}
                  >
                    <span 
                      className="material-symbols-outlined"
                      style={{ color: getEventColor(event.type), fontSize: '20px' }}
                    >
                      {getEventIcon(event.type)}
                    </span>
                  </div>

                  <div className="event-details-column">
                    <div className="event-title">{event.title}</div>
                    <div className="event-project">
                      <span className="project-name">{event.project.name}</span>
                      <span 
                        className="project-priority-dot"
                        style={{ backgroundColor: getPriorityColor(event.project.priority) }}
                        title={`${event.project.priority} priority`}
                      />
                    </div>
                    {event.description && (
                      <div className="event-description">{event.description}</div>
                    )}
                  </div>

                  <div className="event-arrow">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {events.length > 0 && (
        <div className="manifest-footer">
          <div className="manifest-summary">
            <span className="summary-count">{events.length}</span>
            <span className="summary-label">event{events.length !== 1 ? 's' : ''} today</span>
          </div>
        </div>
      )}
    </div>
  )
}
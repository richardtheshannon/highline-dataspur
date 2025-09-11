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

export default function TomorrowMilestones() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    fetchTomorrowEvents()
  }, [])

  const fetchTomorrowEvents = async () => {
    try {
      const response = await fetch('/api/timeline/tomorrow')
      if (!response.ok) {
        throw new Error('Failed to fetch timeline events')
      }
      const data = await response.json()
      // Filter only milestone type events for tomorrow
      const milestones = data.filter((event: TimelineEvent) => 
        event.type.toLowerCase() === 'milestone' || 
        event.type.toLowerCase() === 'deadline' ||
        event.type.toLowerCase() === 'release'
      )
      setEvents(milestones)
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
      case 'deadline':
        return '#ffd43b'
      case 'release':
        return '#e599f7'
      default:
        return '#868e96'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'IN_PROGRESS':
        return '#4dabf7'
      case 'PLANNING':
        return '#69db7c'
      case 'ON_HOLD':
        return '#ffd43b'
      case 'COMPLETED':
        return '#868e96'
      default:
        return '#495057'
    }
  }

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getTomorrowDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="tomorrow-milestones-card">
      <div className="milestones-header">
        <span className="material-symbols-outlined" style={{ color: '#ffd43b' }}>
          upcoming
        </span>
        <h3>Tomorrow's Milestones</h3>
        <span className="milestones-date">{getTomorrowDate()}</span>
        <button 
          className="milestones-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!isCollapsed && (
        <div className="milestones-content">
          {loading ? (
            <div className="milestones-loading">
              <span className="material-symbols-outlined rotating">sync</span>
              <p>Loading milestones...</p>
            </div>
          ) : error ? (
            <div className="milestones-error">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="milestones-empty">
              <span className="material-symbols-outlined">event_busy</span>
              <p>No milestones tomorrow</p>
              <p className="milestones-empty-subtitle">Clear schedule ahead</p>
            </div>
          ) : (
            <div className="milestones-list">
              {events.map((event) => (
                <Link 
                  key={event.id}
                  href={`/dashboard/projects/${event.project.id}`}
                  className="milestone-link"
                >
                  <div className="milestone-item">
                    <div 
                      className="milestone-icon"
                      style={{ 
                        backgroundColor: `${getEventColor(event.type)}20`,
                        borderLeft: `3px solid ${getEventColor(event.type)}`
                      }}
                    >
                      <span 
                        className="material-symbols-outlined"
                        style={{ color: getEventColor(event.type), fontSize: '18px' }}
                      >
                        {getEventIcon(event.type)}
                      </span>
                    </div>

                    <div className="milestone-details">
                      <div className="milestone-title">{event.title}</div>
                      <div className="milestone-meta">
                        <span className="milestone-project">{event.project.name}</span>
                        <span 
                          className="milestone-status"
                          style={{ 
                            backgroundColor: `${getStatusBadgeColor(event.project.status)}20`,
                            color: getStatusBadgeColor(event.project.status)
                          }}
                        >
                          {event.project.status.replace('_', ' ')}
                        </span>
                        <span className="milestone-time">{formatTime(event.date)}</span>
                      </div>
                      {event.description && (
                        <div className="milestone-description">{event.description}</div>
                      )}
                    </div>

                    <div className="milestone-arrow">
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!isCollapsed && events.length > 0 && (
        <div className="milestones-footer">
          <div className="milestones-summary">
            <span className="summary-icon material-symbols-outlined">flag</span>
            <span className="summary-count">{events.length}</span>
            <span className="summary-label">milestone{events.length !== 1 ? 's' : ''} tomorrow</span>
          </div>
        </div>
      )}
    </div>
  )
}
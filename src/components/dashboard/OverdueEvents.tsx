'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { overdueEventsDoc } from '@/data/helpDocumentation'
import { fetchGeneralTasks, getOverdueTasks, taskToTimelineEvent } from '@/lib/generalTasks'

interface OverdueEvent {
  id: string
  title: string
  description: string | null
  date: string
  type: string
  daysOverdue: number
  hoursOverdue: number
  overdueText: string
  project: {
    id: string
    name: string
    status: string
    priority: string
    projectType: string
  }
}

export default function OverdueEvents() {
  const [events, setEvents] = useState<OverdueEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    fetchOverdueEvents()
  }, [])

  const fetchOverdueEvents = async () => {
    try {
      const response = await fetch('/api/timeline/overdue')
      if (!response.ok) {
        throw new Error('Failed to fetch overdue events')
      }
      const timelineData = await response.json()

      // Load overdue general tasks
      const generalTasks = await fetchGeneralTasks()
      const overdueTasks = getOverdueTasks(generalTasks)
      const generalTaskEvents = overdueTasks.map(task => taskToTimelineEvent(task, true))

      // Combine and sort by days overdue (most overdue first)
      const allEvents = [...timelineData, ...generalTaskEvents].sort((a, b) => {
        return (b.daysOverdue || 0) - (a.daysOverdue || 0)
      })

      setEvents(allEvents)
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
    // All overdue events use red theme
    return '#ff6b6b'
  }

  const getPriorityUrgencyColor = (priority: string, daysOverdue: number) => {
    const baseRed = '#ff6b6b'
    if (priority.toUpperCase() === 'URGENT' || daysOverdue > 7) {
      return '#dc2626' // Dark red for urgent/very overdue
    } else if (priority.toUpperCase() === 'HIGH' || daysOverdue > 3) {
      return '#ef4444' // Medium red
    }
    return baseRed // Standard red
  }

  const getOverdueIntensity = (daysOverdue: number) => {
    if (daysOverdue > 7) return 'critical'
    if (daysOverdue > 3) return 'high'
    if (daysOverdue > 1) return 'medium'
    return 'recent'
  }

  const formatOriginalDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Show only first 3 events by default, unless showAll is true
  const displayEvents = showAll ? events : events.slice(0, 3)
  const hasMoreEvents = events.length > 3

  return (
    <div className="overdue-events-card">
      <div className="overdue-header">
        <span className="material-symbols-outlined" style={{ color: '#ff6b6b' }}>
          warning
        </span>
        <DocumentedTitle 
          title="Overdue Events"
          documentation={overdueEventsDoc}
          as="h3"
        />
        {events.length > 0 && (
          <span className="overdue-count">
            {events.length} overdue
          </span>
        )}
        <button 
          className="overdue-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? 'expand_more' : 'expand_less'}
          </span>
        </button>
      </div>

      {!isCollapsed && (
        <div className="overdue-content">
          {loading ? (
            <div className="overdue-loading">
              <span className="material-symbols-outlined rotating">sync</span>
              <p>Loading overdue events...</p>
            </div>
          ) : error ? (
            <div className="overdue-error">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
            </div>
          ) : events.length === 0 ? (
            <div className="overdue-empty">
              <span className="material-symbols-outlined">check_circle</span>
              <p>No overdue events</p>
              <p className="overdue-empty-subtitle">You're all caught up!</p>
            </div>
          ) : (
            <>
              <div className="overdue-list">
                {displayEvents.map((event) => {
                  const intensityClass = getOverdueIntensity(event.daysOverdue)
                  const urgencyColor = getPriorityUrgencyColor(event.project.priority, event.daysOverdue)
                  const isGeneralTask = event.project.id === 'general-tasks'

                  const content = (
                    <div className={`overdue-item ${intensityClass}`}>
                        <div 
                          className="overdue-icon"
                          style={{ 
                            backgroundColor: `${urgencyColor}20`,
                            borderLeft: `3px solid ${urgencyColor}`
                          }}
                        >
                          <span 
                            className="material-symbols-outlined"
                            style={{ color: urgencyColor, fontSize: '18px' }}
                          >
                            {getEventIcon(event.type)}
                          </span>
                        </div>

                        <div className="overdue-details">
                          <div className="overdue-title-row">
                            <span className="overdue-title">{event.title}</span>
                            <span 
                              className="overdue-badge"
                              style={{ backgroundColor: `${urgencyColor}15`, color: urgencyColor }}
                            >
                              {event.overdueText}
                            </span>
                          </div>
                          
                          <div className="overdue-meta">
                            <span className="overdue-project">{event.project.name}</span>
                            <span className="overdue-original-date">
                              Due: {formatOriginalDate(event.date)}
                            </span>
                          </div>
                          
                          {event.description && (
                            <div className="overdue-description">{event.description}</div>
                          )}
                        </div>

                        <div className="overdue-arrow">
                          <span className="material-symbols-outlined">chevron_right</span>
                        </div>
                      </div>
                  )

                  return isGeneralTask ? (
                    <div key={event.id} className="overdue-link">
                      {content}
                    </div>
                  ) : (
                    <Link
                      key={event.id}
                      href={`/dashboard/projects/${event.project.id}`}
                      className="overdue-link"
                    >
                      {content}
                    </Link>
                  )
                })}
              </div>

              {hasMoreEvents && (
                <div className="overdue-show-more">
                  <button 
                    className="show-more-btn"
                    onClick={() => setShowAll(!showAll)}
                  >
                    {showAll ? (
                      <>
                        <span className="material-symbols-outlined">expand_less</span>
                        Show Less
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">expand_more</span>
                        Show {events.length - 3} More
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!isCollapsed && events.length > 0 && (
        <div className="overdue-footer">
          <div className="overdue-summary">
            <span className="summary-icon material-symbols-outlined">warning</span>
            <span className="summary-text">
              {events.filter(e => e.daysOverdue > 7).length > 0 && (
                <span className="critical-count">
                  {events.filter(e => e.daysOverdue > 7).length} critical
                </span>
              )}
              {events.filter(e => e.daysOverdue > 7).length > 0 && 
               events.filter(e => e.daysOverdue <= 7).length > 0 && ' • '}
              {events.filter(e => e.daysOverdue <= 7).length > 0 && (
                <span className="recent-count">
                  {events.filter(e => e.daysOverdue <= 7).length} recent
                </span>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
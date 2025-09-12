'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useProjects } from '@/hooks/useProjects'
import TimelineDisplay from '@/components/timeline/TimelineDisplay'

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { projects, loading, error, deleteProject, updateProject, refetch } = useProjects()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  const projectId = params?.id as string
  const project = projects.find(p => p.id === projectId)

  // Calculate project metrics
  const projectMetrics = useMemo(() => {
    if (!project) return null
    
    const daysSinceStart = project.startDate 
      ? Math.floor((new Date().getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0
    
    const daysUntilEnd = project.endDate
      ? Math.floor((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    const totalDuration = project.startDate && project.endDate
      ? Math.floor((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))
      : null
    
    const progressPercent = totalDuration && daysSinceStart > 0
      ? Math.min(Math.max((daysSinceStart / totalDuration) * 100, 0), 100)
      : 0
    
    return {
      daysSinceStart: Math.max(daysSinceStart, 0),
      daysUntilEnd,
      totalDuration,
      progressPercent: Math.round(progressPercent),
      isOverdue: daysUntilEnd !== null && daysUntilEnd < 0
    }
  }, [project])

  // Status update handler
  const handleStatusUpdate = async (newStatus: string) => {
    if (!project) return
    
    try {
      setActionLoading('status')
      await updateProject(project.id, { status: newStatus as any })
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // Priority update handler  
  const handlePriorityUpdate = async (newPriority: string) => {
    if (!project) return
    
    try {
      setActionLoading('priority')
      await updateProject(project.id, { priority: newPriority as any })
    } catch (error) {
      console.error('Failed to update priority:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // Delete handler
  const handleDelete = async () => {
    if (!project) return
    
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        setActionLoading('delete')
        await deleteProject(project.id)
        router.push('/dashboard/projects')
      } catch (error) {
        console.error('Failed to delete project:', error)
        setActionLoading(null)
      }
    }
  }

  // Get status badge styling
  const getStatusBadgeStyle = (status: string) => {
    const styles = {
      'PLANNING': 'bg-gray-500 text-white',
      'IN_PROGRESS': 'bg-blue-500 text-white', 
      'ON_HOLD': 'bg-yellow-500 text-white',
      'COMPLETED': 'bg-green-500 text-white',
      'CANCELLED': 'bg-red-500 text-white'
    }
    return styles[status as keyof typeof styles] || 'bg-gray-500 text-white'
  }

  // Get priority badge styling
  const getPriorityBadgeStyle = (priority: string) => {
    const styles = {
      'LOW': 'bg-green-100 text-green-800 border-green-300',
      'MEDIUM': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'HIGH': 'bg-orange-100 text-orange-800 border-orange-300',
      'URGENT': 'bg-red-100 text-red-800 border-red-300'
    }
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  // Loading state
  if (loading) {
    return (
      <div className="safe-margin">
        <div className="create-project-container">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <span className="material-symbols-outlined animate-spin text-4xl text-blue-500 mb-4 block">refresh</span>
              <p className="text-gray-400">Loading project details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="safe-margin">
        <div className="create-project-container">
          <div className="create-project-error">
            <span className="material-symbols-outlined text-6xl text-red-400 mb-4 block">error</span>
            <h3 className="text-lg font-medium text-red-100 mb-2">Failed to load project</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  // Project not found
  if (!project) {
    return (
      <div className="safe-margin">
        <div className="create-project-container">
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">search_off</span>
            <h3 className="text-lg font-medium text-yellow-100 mb-2">Project Not Found</h3>
            <p className="empty-text">The project you're looking for doesn't exist or has been deleted.</p>
            <button 
              onClick={() => router.push('/dashboard/projects')}
              className="form-btn form-btn-secondary mt-4"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="safe-margin">
      <div className="create-project-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="action-btn action-btn-view"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="create-project-title">{project.name}</h1>
              <p className="create-project-subtitle">Project Details & Management</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="project-detail-actions">
            <button 
              onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
              className="form-btn form-btn-secondary flex items-center gap-2"
            >
              <span className="material-symbols-outlined">edit</span>
              Edit
            </button>
            <button 
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
              className="form-btn form-btn-danger flex items-center gap-2"
            >
              {actionLoading === 'delete' ? (
                <span className="material-symbols-outlined animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined">delete</span>
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-3 gap-6 items-start" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
          {/* Left Column - 1/3 */}
          <div className="main-content-left">
            {/* Project Overview */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">overview</span>
                Project Overview
              </h3>
              
              <div className="project-details-grid">
                {project.projectGoal && (
                  <div className="detail-item">
                    <h4 className="form-label">Project Goal</h4>
                    <p className="detail-value">{project.projectGoal}</p>
                  </div>
                )}
                
                <div className="detail-item">
                  <h4 className="form-label">Owner</h4>
                  <div className="owner-info">
                    <p className="detail-value">{project.owner.name || 'Unknown'}</p>
                    <p className="detail-sub-value">{project.owner.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Status & Badges */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">info</span>
                Project Status
              </h3>
              <div className="status-badges-container">
                <span className={`status-badge ${getStatusBadgeStyle(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
                <span className={`priority-badge ${getPriorityBadgeStyle(project.priority)}`}>
                  {project.priority}
                </span>
                <span className="type-badge">
                  {project.projectType.replace('_', ' ')}
                </span>
              </div>
              {project.description && (
                <div className="project-description-detail">
                  <h4 className="form-label">Description</h4>
                  <p className="project-description-text">{project.description}</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">tune</span>
                Quick Actions
              </h3>
              
              <div className="quick-actions-grid">
                <div className="form-field">
                  <label className="form-label">Status</label>
                  <select 
                    value={project.status}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={actionLoading === 'status'}
                    className="form-input form-select"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                
                <div className="form-field">
                  <label className="form-label">Priority</label>
                  <select 
                    value={project.priority}
                    onChange={(e) => handlePriorityUpdate(e.target.value)}
                    disabled={actionLoading === 'priority'}
                    className="form-input form-select"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Important Dates */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">calendar_month</span>
                Important Dates
              </h3>
              
              <div className="dates-grid">
                <div className="date-item">
                  <span className="form-label">Created</span>
                  <span className="detail-value">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="date-item">
                  <span className="form-label">Last Updated</span>
                  <span className="detail-value">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {project.startDate && (
                  <div className="date-item">
                    <span className="form-label">Start Date</span>
                    <span className="detail-value">
                      {new Date(project.startDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {project.endDate && (
                  <div className="date-item">
                    <span className="form-label">End Date</span>
                    <span className={`detail-value ${projectMetrics?.isOverdue ? 'text-red-400' : ''}`}>
                      {new Date(project.endDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Project Statistics */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">analytics</span>
                Project Statistics
              </h3>
              
              <div className="stats-grid">
                <div className="stats-card">
                  <div className="stats-value stats-value-blue">0</div>
                  <div className="stats-label">Tasks</div>
                </div>
                <div className="stats-card">
                  <div className="stats-value stats-value-green">1</div>
                  <div className="stats-label">Members</div>
                </div>
                <div className="stats-card">
                  <div className="stats-value stats-value-purple">
                    {projectMetrics?.daysSinceStart || 0}
                  </div>
                  <div className="stats-label">Days Active</div>
                </div>
                <div className="stats-card">
                  <div className="stats-value stats-value-yellow">
                    {project.updatedAt ? Math.floor((new Date().getTime() - new Date(project.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
                  </div>
                  <div className="stats-label">Days Since Update</div>
                </div>
              </div>
            </div>

            {/* Technical Information */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">code</span>
                Technical Information
              </h3>
              
              <div className="tech-info-grid">
                <div className="tech-item">
                  <span className="form-label">Project ID</span>
                  <div className="project-id">
                    {project.id}
                  </div>
                </div>
                <div className="tech-item">
                  <span className="form-label">Project Type</span>
                  <span className="detail-value">{project.projectType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 2/3 */}
          <div className="main-content-right">
            {/* Timeline Events Section */}
            <TimelineDisplay 
              timelineEvents={project.timelineEvents || []} 
              onEventsUpdate={() => {
                // Refresh the project data when timeline events change
                refetch()
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
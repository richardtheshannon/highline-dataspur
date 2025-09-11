'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProjects } from '@/hooks/useProjects'
import MarkdownUploader from '@/components/forms/MarkdownUploader'
import TimelineGenerator from '@/components/timeline/TimelineGenerator'
import TimelinePreview from '@/components/timeline/TimelinePreview'
import { MarkdownParseResult, TimelineEvent } from '@/lib/markdownParser'

export default function NewProjectPage() {
  const router = useRouter()
  const { createProject } = useProjects()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectGoal: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    projectType: 'DEVELOPMENT',
    dueDate: ''
  })
  
  // Timeline generation state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [markdownResult, setMarkdownResult] = useState<MarkdownParseResult | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [timelineError, setTimelineError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const projectData = {
        name: formData.name,
        description: formData.description || null,
        projectGoal: formData.projectGoal || null,
        status: formData.status as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED',
        priority: formData.priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
        projectType: formData.projectType as 'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'RESEARCH' | 'OTHER',
        endDate: formData.dueDate || null,
        timelineEvents: timelineEvents.length > 0 ? timelineEvents : undefined
      }
      
      await createProject(projectData)
      router.push('/dashboard/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Timeline handling functions
  const handleFileProcessed = (result: MarkdownParseResult, file: File) => {
    setMarkdownResult(result)
    setUploadedFile(file)
    setTimelineError(null)
  }

  const handleFileError = (error: string) => {
    setTimelineError(error)
    setMarkdownResult(null)
    setTimelineEvents([])
  }

  const handleFileClear = () => {
    setUploadedFile(null)
    setMarkdownResult(null)
    setTimelineEvents([])
    setTimelineError(null)
  }

  const handleTimelineGenerated = useCallback((events: TimelineEvent[]) => {
    setTimelineEvents(events)
  }, [])

  const handleEventsModified = (events: TimelineEvent[]) => {
    setTimelineEvents(events)
  }

  return (
    <div className="projects-page">
      {/* Header with Action Buttons - Full width */}
      <div className="projects-header">
        <div>
          <h1 className="create-project-title">Create New Project</h1>
          <p className="create-project-subtitle">Add a new project to your workspace</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleCancel}
            className="form-btn form-btn-secondary"
            disabled={loading}
            style={{ margin: 0 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name.trim()}
            className="form-btn form-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}
          >
            {loading && <span className="material-symbols-outlined animate-spin" style={{ fontSize: '18px' }}>refresh</span>}
            {loading ? 'Creating...' : `Create Project${timelineEvents.length > 0 ? ` (${timelineEvents.length} Events)` : ''}`}
          </button>
        </div>
      </div>
      
      <div className="create-project-container">

          {error && (
            <div className="create-project-error">
              <p>{error}</p>
            </div>
          )}

          <div className="create-project-form">
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="form-section-title">Basic Information</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="name" className="form-label">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="projectType" className="form-label">
                    Project Type
                  </label>
                  <select
                    id="projectType"
                    name="projectType"
                    value={formData.projectType}
                    onChange={handleInputChange}
                    className="form-input form-select"
                  >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="DESIGN">Design</option>
                  <option value="MARKETING">Marketing</option>
                  <option value="RESEARCH">Research</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div className="form-field">
                <label htmlFor="projectGoal" className="form-label">
                  Project Goal
                </label>
                <input
                  type="text"
                  id="projectGoal"
                  name="projectGoal"
                  value={formData.projectGoal}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="What do you want to achieve?"
                />
              </div>

              <div className="form-field form-field-full">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="form-input form-textarea"
                  placeholder="Brief project description"
                />
              </div>
            </div>
            </div>

            {/* Project Details */}
            <div className="form-section">
              <h3 className="form-section-title">Project Details</h3>
              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
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
                  <label htmlFor="priority" className="form-label">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="form-input form-select"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="dueDate" className="form-label">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Optional project deadline"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Generation */}
            <div className="form-section">
              <h3 className="form-section-title">
                <span className="material-symbols-outlined">timeline</span>
                Timeline Generation
              </h3>
              <p className="form-section-description">
                Upload a markdown file to automatically generate timeline events from H1 headers.
              </p>
              
              <div className="timeline-upload-container">
                <MarkdownUploader
                  onFileProcessed={handleFileProcessed}
                  onError={handleFileError}
                  onClear={handleFileClear}
                  currentFile={uploadedFile}
                />
                
                {timelineError && (
                  <div className="timeline-error">
                    <span className="material-symbols-outlined">error</span>
                    <p>{timelineError}</p>
                  </div>
                )}
                
                {markdownResult && markdownResult.headers.length > 0 && (
                  <div className="timeline-generation">
                    <TimelineGenerator
                      headers={markdownResult.headers}
                      onTimelineGenerated={handleTimelineGenerated}
                    />
                    
                    {timelineEvents.length > 0 && (
                      <TimelinePreview
                        events={timelineEvents}
                        markdownContent={markdownResult.content}
                        onEventsModified={handleEventsModified}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}
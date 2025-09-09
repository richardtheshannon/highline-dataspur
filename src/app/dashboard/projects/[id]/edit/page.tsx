'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useProjects } from '@/hooks/useProjects'

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const { projects, updateProject } = useProjects()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Find the project to edit
  const projectId = params?.id as string
  const project = projects.find(p => p.id === projectId)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectGoal: '',
    status: 'PLANNING',
    priority: 'MEDIUM',
    projectType: 'DEVELOPMENT',
    startDate: '',
    endDate: ''
  })

  // Load project data when component mounts
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        projectGoal: project.projectGoal || '',
        status: project.status,
        priority: project.priority,
        projectType: project.projectType,
        startDate: project.startDate || '',
        endDate: project.endDate || ''
      })
    }
  }, [project])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Project name is required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        projectGoal: formData.projectGoal || null,
        status: formData.status as any,
        priority: formData.priority as any,
        projectType: formData.projectType as any,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null
      }
      
      await updateProject(projectId, updateData)
      router.push('/dashboard/projects')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  // Show loading or not found state
  if (!project) {
    return (
      <div className="safe-margin">
        <div className="create-project-container">
          <div className="empty-state">
            <span className="material-symbols-outlined empty-icon">search_off</span>
            <h3 className="text-lg font-medium text-yellow-100 mb-2">Project Not Found</h3>
            <p className="empty-text">The project you're trying to edit could not be found.</p>
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
              onClick={handleCancel}
              className="action-btn action-btn-view"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="create-project-title">Edit Project</h1>
              <p className="create-project-subtitle">Update project &quot;{project.name}&quot;</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="create-project-error">
            <span className="material-symbols-outlined text-2xl text-red-400 mr-3">error</span>
            <p className="text-red-100">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Project Information */}
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="material-symbols-outlined">info</span>
              Project Information
            </h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="name">
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
                <label className="form-label" htmlFor="projectType">
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

              <div className="form-field form-field-full">
                <label className="form-label" htmlFor="description">
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

              <div className="form-field form-field-full">
                <label className="form-label" htmlFor="projectGoal">
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
            </div>
          </div>

          {/* Project Status & Priority */}
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="material-symbols-outlined">tune</span>
              Status & Priority
            </h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="status">
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
                <label className="form-label" htmlFor="priority">
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
            </div>
          </div>

          {/* Schedule */}
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="material-symbols-outlined">calendar_month</span>
              Project Schedule
            </h3>
            
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label" htmlFor="startDate">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="endDate">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="form-btn form-btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="form-btn form-btn-primary"
            >
              {loading && <span className="material-symbols-outlined animate-spin">refresh</span>}
              {loading ? 'Updating...' : 'Update Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
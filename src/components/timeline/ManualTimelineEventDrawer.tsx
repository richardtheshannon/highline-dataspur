'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ManualTimelineEventDrawerProps {
  isOpen: boolean
  onClose: () => void
  onEventCreated: () => void
  projectId: string
}

interface FormData {
  title: string
  description: string
  date: string
  type: string
  status: 'pending' | 'in_progress' | 'completed'
}

const ManualTimelineEventDrawer: React.FC<ManualTimelineEventDrawerProps> = ({
  isOpen,
  onClose,
  onEventCreated,
  projectId
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    date: '',
    type: 'milestone',
    status: 'pending'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Reset form when drawer opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        description: '',
        date: '',
        type: 'milestone',
        status: 'pending'
      })
      setError(null)
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.type) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/timeline/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create timeline event')
      }

      // Success
      onEventCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create timeline event')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      type: 'milestone',
      status: 'pending'
    })
    setError(null)
    onClose()
  }

  if (!mounted || !isOpen) return null

  const drawerContent = (
    <div
      className="fixed inset-0 z-[9999]"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />

      {/* Drawer */}
      <div
        className="absolute top-0 left-0 h-full bg-gray-900 border-r border-gray-700 flex flex-col shadow-2xl"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100vh',
          width: '60%',
          maxWidth: '600px',
          minWidth: '400px',
          zIndex: 10000,
          backgroundColor: '#111827',
          borderRight: '1px solid #374151',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '25px'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-yellow-100 flex items-center gap-3">
            <span className="material-symbols-outlined">add_task</span>
            Add Work Item
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && (
            <div className="create-project-error mb-6">
              <span className="material-symbols-outlined text-2xl text-red-400 mr-3">error</span>
              <p className="text-red-100">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Event Title */}
            <div className="form-field">
              <label className="form-label" htmlFor="event-title">
                Work Item Title *
              </label>
              <input
                type="text"
                id="event-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter work item title"
                required
                disabled={loading}
              />
            </div>

            {/* Event Date */}
            <div className="form-field">
              <label className="form-label" htmlFor="event-date">
                Date
              </label>
              <input
                type="date"
                id="event-date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
                disabled={loading}
              />
            </div>

            {/* Event Type */}
            <div className="form-field">
              <label className="form-label" htmlFor="event-type">
                Type *
              </label>
              <select
                id="event-type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-input form-select"
                required
                disabled={loading}
              >
                <option value="milestone">Milestone</option>
                <option value="task">Task</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
                <option value="release">Release</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-field">
              <label className="form-label" htmlFor="event-status">
                Status *
              </label>
              <select
                id="event-status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input form-select"
                required
                disabled={loading}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Description */}
            <div className="form-field" style={{ paddingBottom: '15px' }}>
              <label className="form-label" htmlFor="event-description">
                Description
              </label>
              <textarea
                id="event-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input form-textarea"
                rows={4}
                placeholder="Optional description for this work item"
                disabled={loading}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-6 pt-8 pb-6 px-6 mt-8">
              <button
                type="submit"
                disabled={loading || !formData.title.trim()}
                className="form-btn form-btn-primary flex-1"
                style={{ padding: '15px', marginRight: '16px' }}
              >
                {loading && <span className="material-symbols-outlined animate-spin">refresh</span>}
                {loading ? 'Creating...' : 'Create Work Item'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="form-btn form-btn-secondary"
                disabled={loading}
                style={{ padding: '15px', minWidth: '120px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(drawerContent, document.body)
}

export default ManualTimelineEventDrawer
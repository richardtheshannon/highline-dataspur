'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewGeneralTaskPage() {
  const router = useRouter()
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addGeneralTask = async () => {
    if (!newTaskTitle.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/general-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
          dueDate: newTaskDueDate || null
        })
      })

      if (response.ok) {
        router.push('/dashboard/projects')
      } else {
        console.error('Failed to create task')
        alert('Failed to create task. Please try again.')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Error creating task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="safe-margin">
      <div className="create-project-container">
        {/* Header */}
        <div className="projects-header">
          <div>
            <h1 className="create-project-title">New General Task</h1>
            <p className="create-project-subtitle">Create a new task to track your work</p>
          </div>
        </div>

        {/* Form */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">task_alt</span>
            Task Details
          </h3>

          <div className="form-container">
            <div className="form-group">
              <label htmlFor="taskTitle" className="form-label">
                Task Title <span className="form-required">*</span>
              </label>
              <input
                id="taskTitle"
                type="text"
                placeholder="Enter task title..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="form-input"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="taskDescription" className="form-label">
                Description
              </label>
              <textarea
                id="taskDescription"
                placeholder="Enter task description (optional)..."
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="form-input"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="taskDueDate" className="form-label">
                Due Date
              </label>
              <input
                id="taskDueDate"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="form-btn"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addGeneralTask}
                className="form-btn form-btn-primary"
                disabled={!newTaskTitle.trim() || isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
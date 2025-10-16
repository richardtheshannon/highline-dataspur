'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export interface GeneralTask {
  id: string
  title: string
  description?: string | null
  completed: boolean
  dueDate?: string | null
  createdAt: string
  updatedAt?: string
  userId?: string
}

type FilterType = 'all' | 'active' | 'completed' | 'overdue'
type SortField = 'dueDate' | 'createdAt' | 'title'
type SortDirection = 'asc' | 'desc'

export default function GeneralTasksPage() {
  const router = useRouter()

  // Data state
  const [tasks, setTasks] = useState<GeneralTask[]>([])
  const [loading, setLoading] = useState(true)

  // Filter & Sort state
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('dueDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Edit state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    dueDate: ''
  })

  // Load tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/general-tasks')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Statistics
  const statistics = useMemo(() => {
    const total = tasks.length
    const active = tasks.filter(t => !t.completed).length
    const completed = tasks.filter(t => t.completed).length

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdue = tasks.filter(t => {
      if (t.completed || !t.dueDate) return false
      const dueDate = new Date(t.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate < today
    }).length

    return { total, active, completed, overdue }
  }, [tasks])

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchesSearch) return false

      // Status filter
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      switch (filterType) {
        case 'active':
          return !task.completed
        case 'completed':
          return task.completed
        case 'overdue':
          if (task.completed || !task.dueDate) return false
          const dueDate = new Date(task.dueDate)
          dueDate.setHours(0, 0, 0, 0)
          return dueDate < today
        default:
          return true
      }
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'dueDate' || sortField === 'createdAt') {
        // Handle null dates - push to end
        if (!aValue && !bValue) return 0
        if (!aValue) return 1
        if (!bValue) return -1

        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (sortField === 'title') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [tasks, filterType, searchTerm, sortField, sortDirection])

  // Task operations
  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const response = await fetch(`/api/general-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const response = await fetch(`/api/general-tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTasks(tasks.filter(t => t.id !== taskId))
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const startEditing = (task: GeneralTask) => {
    setEditingTaskId(task.id)
    setEditForm({
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    })
  }

  const cancelEditing = () => {
    setEditingTaskId(null)
    setEditForm({ title: '', description: '', dueDate: '' })
  }

  const saveTask = async (taskId: string) => {
    if (!editForm.title.trim()) return

    try {
      const response = await fetch(`/api/general-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          dueDate: editForm.dueDate || null
        })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
        cancelEditing()
      }
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const getTaskDueStatus = (task: GeneralTask) => {
    if (!task.dueDate) return { text: 'No due date', color: 'var(--text-muted)' }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const due = new Date(task.dueDate)
    due.setHours(0, 0, 0, 0)
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`, color: '#ef4444' }
    if (diffDays === 0) return { text: 'Due Today', color: '#f59e0b' }
    if (diffDays === 1) return { text: 'Due Tomorrow', color: '#f59e0b' }
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, color: '#3b82f6' }
    return { text: `Due ${due.toLocaleDateString()}`, color: 'var(--text-muted)' }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="safe-margin">
      {/* Header */}
      <div className="projects-header">
        <div>
          <h1 className="create-project-title">General Tasks</h1>
          <p className="create-project-subtitle">Manage and track all your tasks</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/general-tasks/new')}
          className="form-btn form-btn-primary flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          New Task
        </button>
      </div>

      <div className="create-project-container">
        {/* Statistics Cards */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">analytics</span>
            Task Statistics
          </h3>
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-value">{statistics.total}</div>
              <div className="stats-label">Total Tasks</div>
            </div>
            <div className="stats-card">
              <div className="stats-value stats-value-blue">{statistics.active}</div>
              <div className="stats-label">Active</div>
            </div>
            <div className="stats-card">
              <div className="stats-value stats-value-green">{statistics.completed}</div>
              <div className="stats-label">Completed</div>
            </div>
            <div className="stats-card">
              <div className="stats-value" style={{ color: '#ef4444' }}>{statistics.overdue}</div>
              <div className="stats-label">Overdue</div>
            </div>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">filter_list</span>
            Filter & Search
          </h3>
          <div className="filter-controls">
            <div className="filter-selects-row">
              <select
                className="form-input form-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as FilterType)}
              >
                <option value="all">All Tasks</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
              <select
                className="form-input form-select"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="createdAt">Sort by Created Date</option>
                <option value="title">Sort by Title</option>
              </select>
              <button
                className="form-btn"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span className="material-symbols-outlined">
                  {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search tasks..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="form-section">
          <h3 className="form-section-title">
            <span className="material-symbols-outlined">checklist</span>
            Tasks ({filteredAndSortedTasks.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredAndSortedTasks.map(task => {
              const dueStatus = getTaskDueStatus(task)
              const isEditing = editingTaskId === task.id

              return (
                <div
                  key={task.id}
                  className="stats-card"
                  style={{
                    padding: '1rem',
                    opacity: task.completed ? 0.7 : 1
                  }}
                >
                  {isEditing ? (
                    // Edit Mode
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          autoFocus
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Description</label>
                        <textarea
                          className="form-input"
                          value={editForm.description}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          rows={2}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Due Date</label>
                        <input
                          type="date"
                          className="form-input"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={cancelEditing}
                          className="form-btn"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveTask(task.id)}
                          className="form-btn form-btn-primary"
                          style={{ padding: '0.5rem 1rem' }}
                          disabled={!editForm.title.trim()}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        style={{
                          marginTop: '0.125rem',
                          accentColor: 'var(--accent)',
                          cursor: 'pointer',
                          width: '18px',
                          height: '18px'
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: 500,
                          color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          marginBottom: '0.25rem'
                        }}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            marginBottom: '0.5rem',
                            lineHeight: '1.4'
                          }}>
                            {task.description}
                          </div>
                        )}
                        <div style={{
                          fontSize: '0.75rem',
                          color: task.completed ? '#10b981' : dueStatus.color,
                          fontWeight: 500
                        }}>
                          {task.completed ? '✓ Completed' : dueStatus.text}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'flex-start' }}>
                        <button
                          onClick={() => startEditing(task)}
                          className="action-btn action-btn-edit"
                          title="Edit task"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="action-btn action-btn-delete"
                          title="Delete task"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {filteredAndSortedTasks.length === 0 && (
              <div className="empty-state">
                <span className="material-symbols-outlined empty-icon">checklist</span>
                <div className="empty-text">
                  {searchTerm || filterType !== 'all'
                    ? 'No tasks match your filters'
                    : 'No tasks yet. Create your first task!'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useProjects, ApiProject } from '@/hooks/useProjects'
import DocumentedTitle from '@/components/help/DocumentedTitle'
import { projectStatisticsDoc, filterSearchDoc, projectsTableDoc } from '@/data/helpDocumentation'

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'on_hold' | 'planning'
  priority: 'low' | 'medium' | 'high' | 'critical'
  type: 'web_development' | 'mobile_app' | 'consulting' | 'research' | 'marketing' | 'development' | 'design'
  startDate: string
  endDate?: string
  progress: number
  budget?: number
  teamMembers: string[]
  contacts: string[]
  links: { name: string; url: string; type: 'repository' | 'documentation' | 'deployment' | 'other' }[]
}

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

type SortField = 'name' | 'status' | 'priority' | 'startDate' | 'endDate' | 'progress'
type SortDirection = 'asc' | 'desc'

export default function ProjectsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { projects: apiProjects, loading, error, deleteProject } = useProjects()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('startDate')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // General Tasks State
  const [generalTasks, setGeneralTasks] = useState<GeneralTask[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')

  // Map API projects to component projects
  const projects: Project[] = useMemo(() => {
    return apiProjects.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || '',
      status: mapApiStatus(p.status),
      priority: mapApiPriority(p.priority),
      type: mapApiType(p.projectType),
      startDate: p.startDate || new Date().toISOString(),
      endDate: p.endDate || undefined,
      progress: calculateProgress(p.status),
      budget: p.projectValue || undefined,
      teamMembers: [p.owner?.name || p.owner?.email || 'Unknown'],
      contacts: [],
      links: p.website ? [{ name: 'Website', url: p.website, type: 'other' as const }] : []
    }))
  }, [apiProjects])

  // Helper functions to map API types to component types
  function mapApiStatus(status: string): Project['status'] {
    const statusMap: Record<string, Project['status']> = {
      'PLANNING': 'planning',
      'IN_PROGRESS': 'active',
      'ON_HOLD': 'on_hold',
      'COMPLETED': 'completed',
      'CANCELLED': 'on_hold'
    }
    return statusMap[status] || 'planning'
  }

  function mapApiPriority(priority: string): Project['priority'] {
    const priorityMap: Record<string, Project['priority']> = {
      'LOW': 'low',
      'MEDIUM': 'medium',
      'HIGH': 'high',
      'URGENT': 'critical'
    }
    return priorityMap[priority] || 'medium'
  }

  function mapApiType(type: string): Project['type'] {
    const typeMap: Record<string, Project['type']> = {
      'DEVELOPMENT': 'development',
      'DESIGN': 'design',
      'MARKETING': 'marketing',
      'RESEARCH': 'research',
      'OTHER': 'consulting'
    }
    return typeMap[type] || 'development'
  }

  function calculateProgress(status: string): number {
    const progressMap: Record<string, number> = {
      'PLANNING': 10,
      'IN_PROGRESS': 50,
      'ON_HOLD': 30,
      'COMPLETED': 100,
      'CANCELLED': 0
    }
    return progressMap[status] || 0
  }

  // Load general tasks from database
  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/general-tasks')
      if (response.ok) {
        const tasks = await response.json()
        setGeneralTasks(tasks)
      }
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  // Update filters from URL params
  useEffect(() => {
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')

    if (status) setFilterStatus(status)
    if (priority) setFilterPriority(priority)
    if (type) setFilterType(type)
  }, [searchParams])

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus
      const matchesPriority = filterPriority === 'all' || project.priority === filterPriority
      const matchesType = filterType === 'all' || project.type === filterType
      
      return matchesSearch && matchesStatus && matchesPriority && matchesType
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]
      
      if (sortField === 'startDate' || sortField === 'endDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [projects, searchTerm, filterStatus, filterPriority, filterType, sortField, sortDirection])

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = projects.length
    const active = projects.filter(p => p.status === 'active').length
    const completed = projects.filter(p => p.status === 'completed').length
    const planning = projects.filter(p => p.status === 'planning').length
    const onHold = projects.filter(p => p.status === 'on_hold').length
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    
    return { total, active, completed, planning, onHold, totalBudget }
  }, [projects])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }
    
    try {
      await deleteProject(projectId)
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('Failed to delete project. Please try again.')
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // General Tasks Functions
  const addGeneralTask = async () => {
    if (!newTaskTitle.trim()) return

    try {
      const response = await fetch('/api/general-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          dueDate: newTaskDueDate || null
        })
      })

      if (response.ok) {
        const newTask = await response.json()
        setGeneralTasks([...generalTasks, newTask])
        setNewTaskTitle('')
        setNewTaskDueDate('')
        setShowAddTask(false)
      } else {
        console.error('Failed to create task')
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const toggleTaskCompletion = async (taskId: string) => {
    const task = generalTasks.find(t => t.id === taskId)
    if (!task) return

    try {
      const response = await fetch(`/api/general-tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !task.completed
        })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setGeneralTasks(generalTasks.map(t =>
          t.id === taskId ? updatedTask : t
        ))
      } else {
        console.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteGeneralTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/general-tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setGeneralTasks(generalTasks.filter(task => task.id !== taskId))
      } else {
        console.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const getTaskDueStatus = (dueDate?: string | null) => {
    if (!dueDate) return { text: '', color: 'var(--text-muted)' }

    const today = new Date()
    const due = new Date(dueDate)
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Overdue', color: '#ef4444' }
    if (diffDays === 0) return { text: 'Due Today', color: '#f59e0b' }
    if (diffDays === 1) return { text: 'Due Tomorrow', color: '#f59e0b' }
    if (diffDays <= 7) return { text: 'Due This Week', color: 'var(--text-muted)' }
    return { text: `Due ${due.toLocaleDateString()}`, color: 'var(--text-muted)' }
  }

  const getStatusBadge = (status: Project['status']) => {
    const statusStyles = {
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      planning: 'bg-gray-100 text-gray-800'
    }
    return statusStyles[status]
  }

  const getPriorityBadge = (priority: Project['priority']) => {
    const priorityStyles = {
      low: 'bg-gray-100 text-gray-600',
      medium: 'bg-blue-100 text-blue-600',
      high: 'bg-orange-100 text-orange-600',
      critical: 'bg-red-100 text-red-600'
    }
    return priorityStyles[priority]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading projects...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="safe-margin projects-page">
      {/* Header with Create Button - Full width */}
      <div className="projects-header">
        <div>
          <h1 className="create-project-title">Projects</h1>
          <p className="create-project-subtitle">Manage and track all your projects</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/projects/new')}
          className="form-btn form-btn-primary flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          New Project
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6 items-start" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', alignItems: 'start' }}>
        {/* Left Column - 1/3 */}
        <div className="main-content-left">
          {/* General Task List */}
          <div className="form-section">
            <h3 className="form-section-title">
              <span className="material-symbols-outlined">checklist</span>
              General Tasks
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {generalTasks.map(task => {
                const dueStatus = getTaskDueStatus(task.dueDate)
                return (
                  <div key={task.id} className="stats-card" style={{ display: 'flex', alignItems: 'flex-start', textAlign: 'left', padding: '0.75rem', position: 'relative' }}>
                    <input
                      type="checkbox"
                      style={{ marginRight: '0.75rem', marginTop: '0.125rem', accentColor: 'var(--accent)' }}
                      checked={task.completed}
                      onChange={() => toggleTaskCompletion(task.id)}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        marginBottom: '0.25rem'
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: task.completed ? '#10b981' : dueStatus.color }}>
                        {task.completed ? 'Completed' : dueStatus.text}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteGeneralTask(task.id)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '0.25rem',
                        opacity: '0.7'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.7'
                        e.currentTarget.style.color = 'var(--text-muted)'
                      }}
                      title="Delete task"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>close</span>
                    </button>
                  </div>
                )
              })}

              {generalTasks.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', padding: '2rem 1rem' }}>
                  No tasks yet. Add your first task below!
                </div>
              )}
            </div>

            {/* Add Task Form */}
            {showAddTask ? (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '0.75rem' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addGeneralTask()
                    if (e.key === 'Escape') setShowAddTask(false)
                  }}
                  autoFocus
                />
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="form-input"
                  style={{ marginBottom: '0.75rem' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={addGeneralTask}
                    className="form-btn form-btn-primary"
                    style={{ flex: 1 }}
                    disabled={!newTaskTitle.trim()}
                  >
                    Add Task
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTask(false)
                      setNewTaskTitle('')
                      setNewTaskDueDate('')
                    }}
                    className="form-btn"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTask(true)}
                className="form-btn"
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  background: 'var(--bg-secondary)',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Right Column - 2/3 */}
        <div className="main-content-right">
          <div className="create-project-container">

        {/* Statistics Cards */}
        <div className="form-section">
          <DocumentedTitle 
            className="form-section-title"
            icon="analytics"
            title="Project Statistics"
            documentation={projectStatisticsDoc}
          />
          <div className="stats-grid">
            <div className="stats-card">
              <div className="stats-value">{statistics.total}</div>
              <div className="stats-label">Total Projects</div>
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
              <div className="stats-value stats-value-gray">{statistics.planning}</div>
              <div className="stats-label">Planning</div>
            </div>
            <div className="stats-card">
              <div className="stats-value stats-value-yellow">{statistics.onHold}</div>
              <div className="stats-label">On Hold</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="form-section">
          <DocumentedTitle 
            className="form-section-title"
            icon="filter_list"
            title="Filter & Search"
            documentation={filterSearchDoc}
          />
          <div className="filter-controls">
            <div className="filter-selects-row">
              <select
                className="form-input form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
              <select
                className="form-input form-select"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <select
                className="form-input form-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="marketing">Marketing</option>
                <option value="research">Research</option>
                <option value="consulting">Consulting/Other</option>
                <option value="web_development">Web Development</option>
                <option value="mobile_app">Mobile App</option>
              </select>
            </div>
            <div className="filter-search">
              <input
                type="text"
                placeholder="Search projects..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="form-section">
          <DocumentedTitle 
            className="form-section-title"
            icon="folder_open"
            title="All Projects"
            documentation={projectsTableDoc}
          />
          <div className="projects-table-container">
            <div className="table-wrapper">
              <table className="projects-table">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell">
                      <button
                        className="table-header-btn"
                        onClick={() => handleSort('name')}
                      >
                        Project Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="table-cell">
                      <button
                        className="table-header-btn"
                        onClick={() => handleSort('status')}
                      >
                        Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="table-cell">
                      <button
                        className="table-header-btn"
                        onClick={() => handleSort('priority')}
                      >
                        Priority {sortField === 'priority' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="table-cell">
                      Type
                    </th>
                    <th className="table-cell">
                      <button
                        className="table-header-btn"
                        onClick={() => handleSort('startDate')}
                      >
                        Start Date {sortField === 'startDate' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="table-cell">
                      <button
                        className="table-header-btn"
                        onClick={() => handleSort('progress')}
                      >
                        Progress {sortField === 'progress' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="table-cell">
                      Team
                    </th>
                    <th className="table-cell">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredAndSortedProjects.map(project => (
                    <tr key={project.id} className="table-row">
                      <td className="table-cell">
                        <div>
                          <div className="project-name">{project.name}</div>
                          <div className="project-description">{project.description}</div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`status-badge ${getStatusBadge(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`priority-badge ${getPriorityBadge(project.priority)}`}>
                          {project.priority}
                        </span>
                      </td>
                      <td className="table-cell table-text">
                        {project.type.replace('_', ' ')}
                      </td>
                      <td className="table-cell table-text">
                        {formatDate(project.startDate)}
                      </td>
                      <td className="table-cell">
                        <div className="progress-container">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="progress-text">{project.progress}%</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="team-members">
                          {project.teamMembers.slice(0, 3).map((member, index) => (
                            <div
                              key={index}
                              className="team-avatar"
                              title={member}
                            >
                              <span className="team-initial">
                                {member.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          ))}
                          {project.teamMembers.length > 3 && (
                            <div className="team-avatar team-avatar-more">
                              <span className="team-initial">
                                +{project.teamMembers.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="action-buttons">
                          <button 
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                            className="action-btn action-btn-view"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button 
                            onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}
                            className="action-btn action-btn-edit"
                            title="Edit"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteProject(project.id)}
                            className="action-btn action-btn-delete"
                            title="Delete"
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAndSortedProjects.length === 0 && (
                <div className="empty-state">
                  <span className="material-symbols-outlined empty-icon">folder_open</span>
                  <div className="empty-text">
                    {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || filterType !== 'all' 
                      ? 'No projects match your filters' 
                      : 'No projects yet. Create your first project!'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  )
}
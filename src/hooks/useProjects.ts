import { useState, useEffect } from 'react'
import { TimelineEvent } from '@/lib/markdownParser'

export interface ApiTimelineEvent {
  id: string
  projectId: string
  title: string
  description: string | null
  date: string
  type: string
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: string
  updatedAt: string
}

export interface ApiProject {
  id: string
  name: string
  description: string | null
  projectGoal: string | null
  projectValue: number | null
  website: string | null
  status: string
  priority: string
  projectType: string
  startDate: string | null
  endDate: string | null
  budget?: number | null
  createdAt: string
  updatedAt: string
  ownerId: string
  owner: {
    id: string
    name: string | null
    email: string | null
  }
  timelineEvents?: ApiTimelineEvent[]
}

export interface CreateProjectData extends Omit<Partial<ApiProject>, 'timelineEvents'> {
  timelineEvents?: TimelineEvent[]
}

export interface UpdateProjectData extends Omit<Partial<ApiProject>, 'timelineEvents'> {
  timelineEvents?: TimelineEvent[]
}

// Note: Mock data removed - now using real database API

export function useProjects() {
  const [projects, setProjects] = useState<ApiProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`)
      }
      
      const projects = await response.json()
      setProjects(projects)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
      console.error('Error fetching projects:', err)
      setProjects([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: CreateProjectData) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.status}`)
      }

      const newProject = await response.json()
      setProjects(prev => [newProject, ...prev])
      return newProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    }
  }

  const updateProject = async (projectId: string, projectData: UpdateProjectData) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.status}`)
      }

      const updatedProject = await response.json()
      setProjects(prev => prev.map(project => 
        project.id === projectId ? updatedProject : project
      ))
      return updatedProject
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.status}`)
      }
      
      // Update local state after successful API call
      setProjects(prev => prev.filter(project => project.id !== projectId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject
  }
}
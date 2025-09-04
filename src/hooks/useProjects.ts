import { useState, useEffect } from 'react'

export interface ApiProject {
  id: string
  name: string
  description: string | null
  projectGoal: string | null
  projectValue: number | null
  website: string | null
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  projectType: 'DEVELOPMENT' | 'DESIGN' | 'MARKETING' | 'RESEARCH' | 'OTHER'
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
  // Phase 1: Count fields removed due to simplified relations
  // _count: {
  //   tasks: number
  //   members: number
  // }
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

  const createProject = async (projectData: Partial<ApiProject>) => {
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

  const updateProject = async (projectId: string, projectData: Partial<ApiProject>) => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProjects(prev => prev.map(project => 
        project.id === projectId 
          ? { ...project, ...projectData, updatedAt: new Date().toISOString() }
          : project
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 500))
      
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
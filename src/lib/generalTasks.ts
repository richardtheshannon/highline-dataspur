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

// API functions for database operations
export const fetchGeneralTasks = async (): Promise<GeneralTask[]> => {
  try {
    const response = await fetch('/api/general-tasks')
    if (!response.ok) {
      throw new Error('Failed to fetch general tasks')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching general tasks:', error)
    return []
  }
}

export const createGeneralTask = async (task: {
  title: string
  description?: string
  dueDate?: string
}): Promise<GeneralTask | null> => {
  try {
    const response = await fetch('/api/general-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task)
    })

    if (!response.ok) {
      throw new Error('Failed to create general task')
    }

    return await response.json()
  } catch (error) {
    console.error('Error creating general task:', error)
    return null
  }
}

export const updateGeneralTask = async (
  id: string,
  updates: Partial<GeneralTask>
): Promise<GeneralTask | null> => {
  try {
    const response = await fetch(`/api/general-tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new Error('Failed to update general task')
    }

    return await response.json()
  } catch (error) {
    console.error('Error updating general task:', error)
    return null
  }
}

export const deleteGeneralTask = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/general-tasks/${id}`, {
      method: 'DELETE'
    })

    return response.ok
  } catch (error) {
    console.error('Error deleting general task:', error)
    return false
  }
}

export const migrateLocalStorageTasks = async (): Promise<{ migrated: number; message: string } | null> => {
  try {
    // Get tasks from localStorage
    const savedTasks = localStorage.getItem('dataspur-general-tasks')
    if (!savedTasks) return { migrated: 0, message: 'No localStorage tasks found' }

    const tasks = JSON.parse(savedTasks)
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return { migrated: 0, message: 'No valid tasks in localStorage' }
    }

    const response = await fetch('/api/general-tasks/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks })
    })

    if (!response.ok) {
      throw new Error('Failed to migrate tasks')
    }

    const result = await response.json()

    // Clear localStorage after successful migration
    if (result.migrated > 0) {
      localStorage.removeItem('dataspur-general-tasks')
    }

    return result
  } catch (error) {
    console.error('Error migrating localStorage tasks:', error)
    return null
  }
}

// Legacy localStorage functions (for backward compatibility and migration)
export const loadGeneralTasks = (): GeneralTask[] => {
  if (typeof window === 'undefined') return []

  try {
    const savedTasks = localStorage.getItem('dataspur-general-tasks')
    return savedTasks ? JSON.parse(savedTasks) : []
  } catch (error) {
    console.error('Error loading general tasks:', error)
    return []
  }
}

export const getTasksForToday = (tasks: GeneralTask[]) => {
  // Use local date comparison to avoid timezone issues
  const today = new Date()
  const todayDateString = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')

  return tasks.filter(task => {
    if (!task.dueDate || task.completed) return false

    // Extract date part from the dueDate string to avoid timezone issues
    let dueDateString: string
    if (typeof task.dueDate === 'string') {
      // If it's a UTC datetime string like "2025-09-22T00:00:00.000Z"
      if (task.dueDate.includes('T')) {
        dueDateString = task.dueDate.split('T')[0] // Just take the date part (YYYY-MM-DD)
      } else {
        dueDateString = task.dueDate // Already in YYYY-MM-DD format
      }
    } else {
      // If it's a Date object, extract the UTC date to avoid timezone conversion
      const date = new Date(task.dueDate)
      dueDateString = date.toISOString().split('T')[0]
    }


    return dueDateString === todayDateString
  })
}

export const getTasksForTomorrow = (tasks: GeneralTask[]) => {
  // Use local date comparison to avoid timezone issues
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowDateString = tomorrow.getFullYear() + '-' +
    String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
    String(tomorrow.getDate()).padStart(2, '0')

  return tasks.filter(task => {
    if (!task.dueDate || task.completed) return false

    // Extract date part from the dueDate string to avoid timezone issues
    let dueDateString: string
    if (typeof task.dueDate === 'string') {
      // If it's a UTC datetime string like "2025-09-22T00:00:00.000Z"
      if (task.dueDate.includes('T')) {
        dueDateString = task.dueDate.split('T')[0] // Just take the date part (YYYY-MM-DD)
      } else {
        dueDateString = task.dueDate // Already in YYYY-MM-DD format
      }
    } else {
      // If it's a Date object, extract the UTC date to avoid timezone conversion
      const date = new Date(task.dueDate)
      dueDateString = date.toISOString().split('T')[0]
    }

    return dueDateString === tomorrowDateString
  })
}

export const getOverdueTasks = (tasks: GeneralTask[]) => {
  // Use local date comparison to avoid timezone issues
  const today = new Date()
  const todayDateString = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0')

  return tasks.filter(task => {
    if (!task.dueDate || task.completed) return false

    // Extract date part from the dueDate string to avoid timezone issues
    let dueDateString: string
    if (typeof task.dueDate === 'string') {
      // If it's a UTC datetime string like "2025-09-22T00:00:00.000Z"
      if (task.dueDate.includes('T')) {
        dueDateString = task.dueDate.split('T')[0] // Just take the date part (YYYY-MM-DD)
      } else {
        dueDateString = task.dueDate // Already in YYYY-MM-DD format
      }
    } else {
      // If it's a Date object, extract the UTC date to avoid timezone conversion
      const date = new Date(task.dueDate)
      dueDateString = date.toISOString().split('T')[0]
    }

    return dueDateString < todayDateString
  }).map(task => {
    // Handle both string and Date formats for calculations
    let dueDate: Date
    if (typeof task.dueDate === 'string') {
      dueDate = new Date(task.dueDate + 'T00:00:00')
    } else {
      dueDate = new Date(task.dueDate!)
    }

    const today = new Date()
    const diffTime = today.getTime() - dueDate.getTime()
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const hoursOverdue = Math.ceil(diffTime / (1000 * 60 * 60))

    let overdueText = ''
    if (daysOverdue === 1) {
      overdueText = '1 day overdue'
    } else if (daysOverdue > 1) {
      overdueText = `${daysOverdue} days overdue`
    } else if (hoursOverdue === 1) {
      overdueText = '1 hour overdue'
    } else {
      overdueText = `${hoursOverdue} hours overdue`
    }

    return {
      ...task,
      daysOverdue,
      hoursOverdue,
      overdueText
    }
  })
}

// Convert general task to timeline event format for consistency
export const taskToTimelineEvent = (task: GeneralTask, isOverdue = false) => {
  const baseEvent = {
    id: `general-task-${task.id}`,
    title: task.title,
    description: task.description || null,
    date: task.dueDate || task.createdAt,
    type: 'task',
    status: 'pending' as const,
    project: {
      id: 'general-tasks',
      name: 'General Tasks',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      projectType: 'OTHER'
    }
  }

  if (isOverdue) {
    const overdueTask = task as GeneralTask & { daysOverdue: number; hoursOverdue: number; overdueText: string }
    return {
      ...baseEvent,
      daysOverdue: overdueTask.daysOverdue,
      hoursOverdue: overdueTask.hoursOverdue,
      overdueText: overdueTask.overdueText
    }
  }

  return baseEvent
}
"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LayoutGrid, List, ArrowUpDown } from "lucide-react"
import { ViewPreferenceProvider, useViewPreference } from "@/lib/hooks/use-view-preference"

// The Project interface remains the same
interface Project {
  id: string
  name: string
  description: string | null
  status: string
  priority: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    tasks: number
    members: number
  }
}

type SortKey = keyof Omit<Project, '_count' | 'owner'> | 'tasks' | 'members' | 'endDate' | 'priority';

// The main component is now a wrapper for the provider
export default function ProjectsPage() {
  return (
    <ViewPreferenceProvider>
      <ProjectsPageContent />
    </ViewPreferenceProvider>
  )
}

// All the original page logic is moved into this new component
function ProjectsPageContent() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // State for view mode is now managed by our custom hook
  const { preference, setPreference } = useViewPreference();
  const [searchTerm, setSearchTerm] = useState('')

  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');


  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }
      const data = await response.json()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // The color utility functions remain the same
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      ON_HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
      MEDIUM: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      URGENT: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    }
    return colors[priority] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
  }
  
  // The filtering logic remains the same
  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowercasedTerm) ||
      (project.description && project.description.toLowerCase().includes(lowercasedTerm)) ||
      project.status.toLowerCase().includes(lowercasedTerm) ||
      project.priority.toLowerCase().includes(lowercasedTerm)
    );
  }, [projects, searchTerm]);

  // The sorting logic has been updated to handle priority correctly
  const sortedAndFilteredProjects = useMemo(() => {
    // Define the custom order for priorities
    const priorityOrder: Record<string, number> = {
        URGENT: 4,
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1
    };

    const sorted = [...filteredProjects].sort((a, b) => {
        let valA: any;
        let valB: any;

        switch(sortKey) {
            case 'tasks':
                valA = a._count.tasks;
                valB = b._count.tasks;
                break;
            case 'members':
                valA = a._count.members;
                valB = b._count.members;
                break;
            case 'endDate':
                valA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
                valB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
                break;
            // Add a specific case for sorting by priority
            case 'priority':
                valA = priorityOrder[a.priority] || 0;
                valB = priorityOrder[b.priority] || 0;
                break;
            default:
                valA = a[sortKey as keyof Project];
                valB = b[sortKey as keyof Project];
        }

        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });

    if (sortOrder === 'desc') {
        return sorted.reverse();
    }

    return sorted;
  }, [filteredProjects, sortKey, sortOrder]);


  // The highlighting function remains the same
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return <span>{text}</span>;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
      <span>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-300 dark:bg-yellow-500 rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };


  // The loading and error states remain the same
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg">Loading projects...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-600 dark:text-red-400">
          <div className="text-lg">Error: {error}</div>
          <Button onClick={fetchProjects} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    )
  }
  
  // The Card View remains the same
  const ProjectsCardView = ({ projects }: { projects: Project[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/projects/${project.id}`)}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg text-foreground">{highlightText(project.name, searchTerm)}</CardTitle>
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority}
              </Badge>
            </div>
            <CardDescription className="line-clamp-2">
              {project.description ? highlightText(project.description, searchTerm) : "No description"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium text-foreground">{project._count.tasks}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Members</span>
                <span className="font-medium text-foreground">{project._count.members}</span>
              </div>
              {project.endDate && (
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Due: {new Date(project.endDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // The Table View remains the same
  const ProjectsTableView = ({ projects }: { projects: Project[] }) => {
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('asc');
        }
    };

    const SortableHeader = ({ tkey, label }: { tkey: SortKey, label: string }) => (
        <TableHead onClick={() => handleSort(tkey)} className="cursor-pointer hover:bg-muted/50">
            <div className="flex items-center gap-2">
                {label}
                {sortKey === tkey && <ArrowUpDown className="h-4 w-4" />}
            </div>
        </TableHead>
    );

    return (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader tkey="name" label="Project Name" />
                <SortableHeader tkey="status" label="Status" />
                <SortableHeader tkey="priority" label="Priority" />
                <SortableHeader tkey="endDate" label="Due Date" />
                <SortableHeader tkey="tasks" label="Tasks" />
                <SortableHeader tkey="members" label="Members" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} onClick={() => router.push(`/dashboard/projects/${project.id}`)} className="cursor-pointer">
                  <TableCell className="font-medium">{highlightText(project.name, searchTerm)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(project.status)} variant="outline">
                      {project.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(project.priority)} variant="outline">
                      {project.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">{project._count.tasks}</TableCell>
                  <TableCell className="text-center">{project._count.members}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header is updated to use the context state */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Projects</h2>
          <p className="text-muted-foreground">Manage and track all your projects</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Input 
            placeholder="Search projects..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
          <Button variant={preference === 'card' ? 'secondary' : 'ghost'} size="icon" onClick={() => setPreference('card')}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={preference === 'table' ? 'secondary' : 'ghost'} size="icon" onClick={() => setPreference('table')}>
            <List className="h-4 w-4" />
          </Button>
          <Link href="/dashboard/projects/new">
            <Button>Create New Project</Button>
          </Link>
        </div>
      </div>

      {/* Conditional Rendering now uses the context state */}
      {sortedAndFilteredProjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">{searchTerm ? "No projects match your search." : "No projects yet."}</p>
            { !searchTerm && 
                <Link href="/dashboard/projects/new">
                  <Button>Create Your First Project</Button>
                </Link>
            }
          </CardContent>
        </Card>
      ) : (
        <div>
          {preference === 'card' ? (
            <ProjectsCardView projects={sortedAndFilteredProjects} />
          ) : (
            <ProjectsTableView projects={sortedAndFilteredProjects} />
          )}
        </div>
      )}
    </div>
  )
}

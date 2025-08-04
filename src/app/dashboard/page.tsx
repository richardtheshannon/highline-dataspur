import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import FeatureRequests from "./FeatureRequests"
import { FolderKanban, CheckCircle2 } from 'lucide-react';

export default async function Dashboard() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user || !session.user.id) {
    redirect('/api/auth/signin');
  }

  const userId = session.user.id;

  // Fetch stats
  const projectCount = await prisma.project.count({ where: { ownerId: userId } });
  const activeTaskCount = await prisma.task.count({ where: { project: { ownerId: userId }, status: { not: 'COMPLETED' } } });
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const completedThisWeekCount = await prisma.task.count({ where: { project: { ownerId: userId }, status: 'COMPLETED', updatedAt: { gte: oneWeekAgo } } });

  // Fetch recent activity
  const recentProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, name: true, createdAt: true },
  });

  const recentTasks = await prisma.task.findMany({
    where: { project: { ownerId: userId } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, title: true, createdAt: true },
  });

  // Combine and sort recent activity
  const recentActivity = [
    ...recentProjects.map(p => ({ ...p, type: 'Project', title: p.name, date: p.createdAt })),
    ...recentTasks.map(t => ({ ...t, type: 'Task', title: t.title, date: t.createdAt })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <p className="text-muted-foreground mt-2 mb-8">
        Welcome back! Here's what's happening with your projects.
      </p>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">
              Projects owned by you.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTaskCount}</div>
            <p className="text-xs text-muted-foreground">
              Not yet completed.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedThisWeekCount}</div>
            <p className="text-xs text-muted-foreground">
              Completed in the last 7 days.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Button asChild>
                <Link href="/dashboard/projects/create">
                  Create New Project
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/tasks/create">
                  Add Task
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/dashboard/projects">
                  View All Projects
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
                <ul className="space-y-4">
                  {recentActivity.map((activity) => (
                    <li key={`${activity.type}-${activity.id}`} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'Project' ? (
                          <FolderKanban className="h-5 w-5 text-blue-500" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {activity.type === 'Project' ? 'New Project:' : 'New Task:'} {activity.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.date.toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No recent activity</p>
                  <p className="text-sm">Start by creating your first project!</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      <div className="px-4 py-6 sm:px-0">
        <FeatureRequests />
      </div>
    </>
  )
}

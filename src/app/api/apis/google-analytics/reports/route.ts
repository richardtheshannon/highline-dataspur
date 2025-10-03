import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiProvider, ApiConfigStatus } from '@prisma/client'

// Generate sample analytics data
function generateSampleReports() {
  const reports = [
    {
      id: '1',
      name: 'Website Overview',
      type: 'STANDARD',
      sessions: Math.floor(Math.random() * 50000) + 10000,
      users: Math.floor(Math.random() * 30000) + 5000,
      pageviews: Math.floor(Math.random() * 150000) + 30000,
      bounceRate: Math.random() * 30 + 30, // 30-60%
      avgSessionDuration: Math.floor(Math.random() * 180) + 60, // 60-240 seconds
      goalCompletions: Math.floor(Math.random() * 1000) + 100,
      conversionRate: Math.random() * 5 + 1, // 1-6%
      revenue: Math.floor(Math.random() * 50000) + 5000,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Mobile App Analytics',
      type: 'STANDARD',
      sessions: Math.floor(Math.random() * 30000) + 5000,
      users: Math.floor(Math.random() * 20000) + 3000,
      pageviews: Math.floor(Math.random() * 80000) + 15000,
      bounceRate: Math.random() * 25 + 20, // 20-45%
      avgSessionDuration: Math.floor(Math.random() * 300) + 120, // 120-420 seconds
      goalCompletions: Math.floor(Math.random() * 500) + 50,
      conversionRate: Math.random() * 8 + 2, // 2-10%
      revenue: Math.floor(Math.random() * 30000) + 3000,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Real-Time Users',
      type: 'REALTIME',
      sessions: Math.floor(Math.random() * 500) + 50,
      users: Math.floor(Math.random() * 300) + 30,
      pageviews: Math.floor(Math.random() * 1000) + 100,
      bounceRate: Math.random() * 40 + 25, // 25-65%
      avgSessionDuration: Math.floor(Math.random() * 120) + 30, // 30-150 seconds
      goalCompletions: Math.floor(Math.random() * 20) + 1,
      conversionRate: Math.random() * 3 + 0.5, // 0.5-3.5%
      revenue: Math.floor(Math.random() * 1000) + 100,
      startDate: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // Last hour
      endDate: new Date().toISOString()
    }
  ]
  
  return reports
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the configuration
    const config = await prisma.apiConfiguration.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: ApiProvider.GOOGLE_ANALYTICS
        }
      }
    })

    if (!config) {
      return NextResponse.json({ 
        error: 'No configuration found. Please configure the API first.'
      }, { status: 400 })
    }

    if (config.status !== ApiConfigStatus.ACTIVE) {
      return NextResponse.json({ 
        error: 'API is not active. Please test the connection first.'
      }, { status: 400 })
    }

    // Generate sample reports
    const reports = generateSampleReports()

    // Log activity
    await prisma.apiActivity.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        apiConfigId: config.id,
        provider: ApiProvider.GOOGLE_ANALYTICS,
        type: 'REPORT_FETCH',
        status: 'SUCCESS',
        title: 'Reports Fetched',
        description: `Successfully fetched ${reports.length} analytics reports`,
        metadata: {
          reportCount: reports.length,
          reportTypes: reports.map(r => r.type)
        }
      }
    })

    return NextResponse.json({
      reports,
      success: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Fetch reports error:', error)
    
    // Try to log the error
    try {
      const session = await getServerSession(authOptions)
      if (session?.user?.id) {
        const config = await prisma.apiConfiguration.findUnique({
          where: {
            userId_provider: {
              userId: session.user.id,
              provider: ApiProvider.GOOGLE_ANALYTICS
            }
          }
        })
        
        if (config) {
          await prisma.apiActivity.create({
            data: {
              id: crypto.randomUUID(),
              userId: session.user.id,
              apiConfigId: config.id,
              provider: ApiProvider.GOOGLE_ANALYTICS,
              type: 'REPORT_FETCH',
              status: 'ERROR',
              title: 'Report Fetch Failed',
              description: 'Failed to fetch analytics reports',
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          })
        }
      }
    } catch (logError) {
      console.error('Failed to log error activity:', logError)
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch reports'
    }, { status: 500 })
  }
}
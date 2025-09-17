import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ApiProvider, ApiConfigStatus } from '@prisma/client'

// Simple encryption for demo (in production, use proper encryption)
function encrypt(text: string): string {
  return Buffer.from(text).toString('base64')
}

function decrypt(text: string): string {
  return Buffer.from(text, 'base64').toString()
}

// GET - Fetch current configuration
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        configured: false, 
        status: 'not_configured' 
      })
    }

    // Return config with sensitive data masked
    return NextResponse.json({
      id: config.id,
      configured: true,
      status: config.status.toLowerCase(),
      name: config.name,
      measurementId: config.clientId ? `${config.clientId.slice(0, 3)}xxxxx${config.clientId.slice(-2)}` : undefined,
      hasApiSecret: !!config.clientSecret,
      propertyId: config.developerToken || undefined,
      viewId: config.apiKey || undefined,
      tokenExpiry: config.tokenExpiry?.toISOString(),
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch GA configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Save/Update configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { measurementId, apiSecret, propertyId, viewId } = await request.json()

    if (!measurementId || !apiSecret) {
      return NextResponse.json({ 
        error: 'Measurement ID and API Secret are required' 
      }, { status: 400 })
    }

    // Check if config exists
    const existingConfig = await prisma.apiConfiguration.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: ApiProvider.GOOGLE_ANALYTICS
        }
      }
    })

    let config
    
    if (existingConfig) {
      // Update existing config
      config = await prisma.apiConfiguration.update({
        where: { id: existingConfig.id },
        data: {
          name: 'Google Analytics',
          clientId: measurementId,
          clientSecret: encrypt(apiSecret),
          developerToken: propertyId || null,
          apiKey: viewId || null,
          status: ApiConfigStatus.INACTIVE,
          updatedAt: new Date()
        }
      })
    } else {
      // Create new config
      config = await prisma.apiConfiguration.create({
        data: {
          userId: session.user.id,
          provider: ApiProvider.GOOGLE_ANALYTICS,
          name: 'Google Analytics',
          clientId: measurementId,
          clientSecret: encrypt(apiSecret),
          developerToken: propertyId || null,
          apiKey: viewId || null,
          status: ApiConfigStatus.INACTIVE
        }
      })
    }

    // Log activity
    await prisma.apiActivity.create({
      data: {
        userId: session.user.id,
        apiConfigId: config.id,
        provider: ApiProvider.GOOGLE_ANALYTICS,
        type: 'DATA_SYNC',
        status: 'SUCCESS',
        title: 'Configuration Saved',
        description: `Google Analytics configuration ${existingConfig ? 'updated' : 'created'} successfully`,
        metadata: {
          measurementId: measurementId.slice(0, 3) + 'xxxxx'
        }
      }
    })

    return NextResponse.json({
      id: config.id,
      configured: true,
      status: config.status.toLowerCase(),
      name: config.name,
      measurementId: `${measurementId.slice(0, 3)}xxxxx${measurementId.slice(-2)}`,
      hasApiSecret: true,
      propertyId: propertyId || undefined,
      viewId: viewId || undefined,
      updatedAt: config.updatedAt.toISOString()
    })
  } catch (error) {
    console.error('Failed to save GA configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove configuration
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await prisma.apiConfiguration.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: ApiProvider.GOOGLE_ANALYTICS
        }
      }
    })

    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 })
    }

    // Delete all related activities first (if not cascading)
    await prisma.apiActivity.deleteMany({
      where: {
        apiConfigId: config.id
      }
    })

    // Delete the configuration
    await prisma.apiConfiguration.delete({
      where: { id: config.id }
    })

    return NextResponse.json({ 
      message: 'Configuration deleted successfully',
      configured: false,
      status: 'not_configured'
    })
  } catch (error) {
    console.error('Failed to delete GA configuration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, ApiProvider, ApiConfigStatus } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { encryptString, decryptString } from '@/lib/encryption'

const prisma = new PrismaClient()

// GET /api/apis/google-adwords - Get Google AdWords configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    // For development, allow access without session
    // Use the real user ID that has the working Google AdWords config
    const userId = session?.user?.id || 'cmfegx5kh0000uai1jn1e8skq'
    
    const config = await prisma.apiConfiguration.findFirst({
      where: {
        userId: userId,
        provider: ApiProvider.GOOGLE_ADWORDS
      }
    })
    
    if (!config) {
      return NextResponse.json({
        configured: false,
        status: 'not_configured'
      })
    }
    
    // Return configuration without sensitive data
    const safeConfig = {
      id: config.id,
      configured: true,
      status: config.status.toLowerCase(),
      name: config.name,
      clientId: config.clientId ? '****' + config.clientId.slice(-4) : null,
      hasClientSecret: !!config.clientSecret,
      hasDeveloperToken: !!config.developerToken,
      hasApiKey: !!config.apiKey,
      tokenExpiry: config.tokenExpiry,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }
    
    return NextResponse.json(safeConfig)
  } catch (error) {
    console.error('Google AdWords GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

// POST /api/apis/google-adwords - Create or update Google AdWords configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const body = await request.json()
    
    const userId = session?.user?.id || 'user_test_1'
    const { clientId, clientSecret, developerToken, refreshToken, customerId, apiKey, name = 'Google AdWords API' } = body
    
    if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
      return NextResponse.json(
        { error: 'Client ID, Client Secret, Developer Token, Refresh Token, and Customer ID are required for live API access' },
        { status: 400 }
      )
    }
    
    // Encrypt sensitive data
    const encryptedData = {
      clientSecret: encryptString(clientSecret),
      developerToken: encryptString(developerToken),
      refreshToken: encryptString(refreshToken),
      apiKey: customerId // Store customer ID in apiKey field
    }
    
    // Upsert configuration
    const config = await prisma.apiConfiguration.upsert({
      where: {
        userId_provider: {
          userId: userId,
          provider: ApiProvider.GOOGLE_ADWORDS
        }
      },
      update: {
        name,
        clientId,
        clientSecret: encryptedData.clientSecret,
        developerToken: encryptedData.developerToken,
        refreshToken: encryptedData.refreshToken,
        apiKey: encryptedData.apiKey,
        status: ApiConfigStatus.INACTIVE,
        updatedAt: new Date()
      },
      create: {
        userId,
        provider: ApiProvider.GOOGLE_ADWORDS,
        name,
        clientId,
        clientSecret: encryptedData.clientSecret,
        developerToken: encryptedData.developerToken,
        refreshToken: encryptedData.refreshToken,
        apiKey: encryptedData.apiKey,
        status: ApiConfigStatus.INACTIVE
      }
    })
    
    // Return safe configuration data
    const safeConfig = {
      id: config.id,
      configured: true,
      status: config.status.toLowerCase(),
      name: config.name,
      clientId: config.clientId ? '****' + config.clientId.slice(-4) : null,
      hasClientSecret: !!config.clientSecret,
      hasDeveloperToken: !!config.developerToken,
      hasApiKey: !!config.apiKey,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }
    
    return NextResponse.json(safeConfig, { status: 201 })
  } catch (error) {
    console.error('Google AdWords POST error:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

// DELETE /api/apis/google-adwords - Delete Google AdWords configuration
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.user?.id || 'user_test_1'
    
    await prisma.apiConfiguration.deleteMany({
      where: {
        userId: userId,
        provider: ApiProvider.GOOGLE_ADWORDS
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Google AdWords DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete configuration' },
      { status: 500 }
    )
  }
}
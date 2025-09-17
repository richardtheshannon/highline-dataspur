import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, ApiProvider } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { decryptString } from '@/lib/encryption'
import { logApiActivity, createApiActivity } from '@/lib/apiActivity'
import { GoogleAdsService } from '@/lib/googleAdsService'

const prisma = new PrismaClient()

// POST /api/apis/google-adwords/test-connection - Test Google AdWords API connection
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const userId = session?.user?.id || 'user_test_1'
    
    const config = await prisma.apiConfiguration.findFirst({
      where: {
        userId: userId,
        provider: ApiProvider.GOOGLE_ADWORDS
      }
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'No Google AdWords configuration found' },
        { status: 404 }
      )
    }
    
    // Decrypt credentials for testing
    const clientSecret = decryptString(config.clientSecret)
    const developerToken = decryptString(config.developerToken || '')
    const refreshToken = config.refreshToken ? decryptString(config.refreshToken) : undefined
    const customerId = config.apiKey || undefined // Customer ID stored in apiKey field
    
    // Test real Google Ads API connection
    const googleAdsService = new GoogleAdsService({
      client_id: config.clientId,
      client_secret: clientSecret,
      developer_token: developerToken,
      refresh_token: refreshToken,
      customer_id: customerId
    })
    
    const testResult = await googleAdsService.testConnection()
    
    // Update configuration status based on test result
    await prisma.apiConfiguration.update({
      where: { id: config.id },
      data: {
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        updatedAt: new Date()
      }
    })

    // Log the connection test activity
    await logApiActivity(createApiActivity.connectionTest(
      userId,
      config.id,
      ApiProvider.GOOGLE_ADWORDS,
      testResult.success,
      testResult.details
    ))
    
    return NextResponse.json({
      success: testResult.success,
      details: testResult.details,
      data: testResult.data
    })
  } catch (error: any) {
    console.error('Google AdWords test connection error:', error)
    
    // Try to log the error activity
    try {
      const session = await getSession()
      const userId = session?.user?.id || 'user_test_1'
      
      const config = await prisma.apiConfiguration.findFirst({
        where: {
          userId: userId,
          provider: ApiProvider.GOOGLE_ADWORDS
        }
      })
      
      if (config) {
        await logApiActivity(createApiActivity.connectionTest(
          userId,
          config.id,
          ApiProvider.GOOGLE_ADWORDS,
          false,
          `Connection test failed: ${error.message}`
        ))
      }
    } catch (logError) {
      console.error('Failed to log error activity:', logError)
    }
    
    return NextResponse.json(
      { 
        success: false,
        details: error.message || 'Failed to test connection'
      },
      { status: 500 }
    )
  }
}
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedApiActivity() {
  try {
    console.log('🌱 Seeding API activity data...')

    // Find or create a test user
    let user = await prisma.user.findFirst({
      where: { email: 'test@example.com' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'user_test_1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER'
        }
      })
      console.log('✅ Created test user:', user.email)
    }

    // Find or create Google AdWords API configuration
    let apiConfig = await prisma.apiConfiguration.findFirst({
      where: {
        userId: user.id,
        provider: 'GOOGLE_ADWORDS'
      }
    })

    if (!apiConfig) {
      // Create a dummy encrypted value for testing
      const dummyEncrypted = 'encrypted_dummy_value'
      
      apiConfig = await prisma.apiConfiguration.create({
        data: {
          userId: user.id,
          provider: 'GOOGLE_ADWORDS',
          name: 'Google AdWords API',
          clientId: 'test_client_id',
          clientSecret: dummyEncrypted,
          developerToken: dummyEncrypted,
          status: 'ACTIVE'
        }
      })
      console.log('✅ Created Google AdWords API configuration')
    }

    // Create sample activity data
    const activities = [
      {
        userId: user.id,
        apiConfigId: apiConfig.id,
        provider: 'GOOGLE_ADWORDS',
        type: 'CAMPAIGN_FETCH',
        status: 'SUCCESS',
        title: 'Campaign data synced',
        description: 'Successfully synced 15 campaigns',
        metadata: { campaignCount: 15 },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        userId: user.id,
        apiConfigId: apiConfig.id,
        provider: 'GOOGLE_ADWORDS',
        type: 'CONNECTION_TEST',
        status: 'SUCCESS',
        title: 'Connection test successful',
        description: 'Successfully connected to Google Ads API. Ready to fetch campaigns and data.',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      },
      {
        userId: user.id,
        apiConfigId: apiConfig.id,
        provider: 'GOOGLE_ADWORDS',
        type: 'KEYWORD_UPDATE',
        status: 'SUCCESS',
        title: 'Keywords updated',
        description: 'Updated 250 keyword bids',
        metadata: { keywordCount: 250 },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        userId: user.id,
        apiConfigId: apiConfig.id,
        provider: 'GOOGLE_ADWORDS',
        type: 'RATE_LIMIT_WARNING',
        status: 'WARNING',
        title: 'Rate limit warning',
        description: 'Approaching daily API limit (14,500/15,000)',
        metadata: { currentUsage: 14500, limit: 15000 },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        userId: user.id,
        apiConfigId: apiConfig.id,
        provider: 'GOOGLE_ADWORDS',
        type: 'DATA_SYNC',
        status: 'SUCCESS',
        title: 'Data sync completed',
        description: 'Successfully synced 125 items',
        metadata: { syncCount: 125 },
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000) // 1.5 days ago
      }
    ]

    // Delete existing activities for this user/config to avoid duplicates
    await prisma.apiActivity.deleteMany({
      where: {
        userId: user.id,
        apiConfigId: apiConfig.id
      }
    })

    // Insert sample activities
    for (const activity of activities) {
      await prisma.apiActivity.create({
        data: activity
      })
    }

    console.log(`✅ Created ${activities.length} sample API activities`)
    console.log('🎉 API activity seeding completed!')

  } catch (error) {
    console.error('❌ Error seeding API activity:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedApiActivity()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkApiStatus() {
  try {
    console.log('🔍 Checking Google AdWords API configuration status...\n')

    // Check all configurations
    const allConfigs = await prisma.apiConfiguration.findMany({
      where: {
        provider: 'GOOGLE_ADWORDS'
      }
    })

    console.log(`Found ${allConfigs.length} Google AdWords configurations:\n`)

    allConfigs.forEach((config, index) => {
      console.log(`Configuration ${index + 1}:`)
      console.log(`   ID: ${config.id}`)
      console.log(`   User ID: ${config.userId}`)
      console.log(`   Status: ${config.status}`)
      console.log(`   Name: ${config.name}`)
      console.log(`   Has Client Secret: ${!!config.clientSecret}`)
      console.log(`   Has Developer Token: ${!!config.developerToken}`)
      console.log(`   Has API Key: ${!!config.apiKey}`)
      console.log(`   Created: ${config.createdAt}`)
      console.log(`   Updated: ${config.updatedAt}`)
      console.log('')
    })

    // Test what the API would find with 'user_test_1'
    console.log('🔍 Testing API query with "user_test_1":')
    const apiTestConfig = await prisma.apiConfiguration.findFirst({
      where: {
        userId: 'user_test_1',
        provider: 'GOOGLE_ADWORDS'
      }
    })

    if (apiTestConfig) {
      console.log(`✅ API would find config: ${apiTestConfig.id} with status: ${apiTestConfig.status}`)
    } else {
      console.log('❌ API would NOT find any config with user_test_1')
    }

  } catch (error) {
    console.error('❌ Error checking status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkApiStatus()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const userCount = await prisma.user.count()
    console.log(`✅ Database connected successfully. Total users: ${userCount}`)
    
    // Test finding the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@dataspur.com' }
    })
    
    if (adminUser) {
      console.log('✅ Admin user found:')
      console.log('  📧 Email:', adminUser.email)
      console.log('  👤 Name:', adminUser.name)
      console.log('  🔐 Role:', adminUser.role)
      console.log('  🆔 ID:', adminUser.id)
      console.log('  🔑 Has Password:', !!adminUser.password)
    } else {
      console.log('❌ Admin user not found')
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🚀 Creating admin user for production...')
    
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@dataspur.com' }
    })
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      return
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('DataSpur2025!', 10)
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@dataspur.com',
        name: 'Administrator',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })
    
    console.log('✅ Admin user created successfully!')
    console.log('📧 Email: admin@dataspur.com')
    console.log('🔑 Password: DataSpur2025!')
    console.log('👤 User ID:', adminUser.id)
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
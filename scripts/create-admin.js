const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email)
      return
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        name: 'Administrator',
        email: 'admin@dataspur.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('🚀 Admin user created successfully!')
    console.log('📧 Email:', adminUser.email)
    console.log('🔑 Password: admin123')
    console.log('👤 Role:', adminUser.role)
    console.log('🆔 ID:', adminUser.id)
    console.log('\n⚠️  IMPORTANT: Please change the password after first login!')

  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
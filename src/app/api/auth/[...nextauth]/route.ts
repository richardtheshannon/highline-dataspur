import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing credentials')
          return null
        }

        try {
          console.log('Attempting to find user:', credentials.email)
          
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          console.log('User found:', !!user, user ? { id: user.id, email: user.email, hasPassword: !!user.password } : 'No user')

          if (!user || !user.password) {
            console.log('User not found or no password')
            return null
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          console.log('Password valid:', isPasswordValid)
          
          if (!isPasswordValid) {
            console.log('Invalid password')
            return null
          }

          console.log('Authentication successful for user:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
          }
        } catch (error) {
          console.error('Auth error details:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub || token.id as string
        session.user.role = token.role
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
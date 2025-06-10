import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
        email: { label: 'Email', type: 'email' },
        username: { label: 'Username', type: 'text' },
        inviteCode: { label: 'Invite Code', type: 'text' },
        mode: { label: 'Mode', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.password) return null

        try {
          // Handle registration
          if (credentials.mode === 'register') {
            if (credentials.inviteCode !== 'SHRIJI') {
              throw new Error('Invalid invite code!')
            }

            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: credentials.email },
                  ...(credentials.username ? [{ username: credentials.username }] : [])
                ]
              }
            })

            if (existingUser) {
              throw new Error('User already exists!')
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(credentials.password, 12)

            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: credentials.email,
                username: credentials.username || null,
                password: hashedPassword,
                role: 'investor'
              }
            })

            return {
              id: newUser.id,
              email: newUser.email,
              username: newUser.username,
              role: newUser.role
            }
          }

          // Handle login
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.identifier },
                { username: credentials.identifier }
              ]
            }
          })

          if (!user) {
            throw new Error('Invalid credentials!')
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(credentials.password, user.password)
          
          if (!isValidPassword) {
            throw new Error('Invalid credentials!')
          }

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
          }

        } catch (error) {
            console.error('Authorization error:', error)
          throw error
        }
      }
    })
  ],
  pages: {
  signIn: '/',
  error: '/auth/error'
},
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      session.user.username = token.username
      session.user.id = token.sub
      return session
    }
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
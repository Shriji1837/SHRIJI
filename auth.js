import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import { PrismaClient } from './src/generated/prisma/index.js'

// Initialize Prisma
const globalForPrisma = globalThis
const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
        email: { label: "Email", type: "email" },
        username: { label: "Username", type: "text" },
        inviteCode: { label: "Invite Code", type: "text" },
        mode: { label: "Mode", type: "text" }
      },
      async authorize(credentials) {
        try {
          const { identifier, password, email, username, inviteCode, mode } = credentials

          if (mode === 'register') {
            // Registration logic
            if (!email || !password || !inviteCode) {
              throw new Error("Missing required fields for registration")
            }

            // Validate invite code
            const validInviteCodes = ['SHRIJI2024', 'ADMIN123', 'INVESTOR2024']
            if (!validInviteCodes.includes(inviteCode)) {
              throw new Error("Invalid invite code")
            }

            // Check if user already exists
            const existingUser = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: email },
                  ...(username ? [{ username: username }] : [])
                ]
              }
            })

            if (existingUser) {
              throw new Error("User already exists with this email or username")
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12)

            // Create new user
            const newUser = await prisma.user.create({
              data: {
                email: email,
                username: username || null,
                password: hashedPassword,
                role: inviteCode === 'ADMIN123' ? 'admin' : 'investor'
              }
            })

            return {
              id: newUser.id,
              email: newUser.email,
              username: newUser.username,
              role: newUser.role
            }
          } else {
            // Login logic
            if (!identifier || !password) {
              throw new Error("Missing email/username or password")
            }

            // Find user by email or username
            const user = await prisma.user.findFirst({
              where: {
                OR: [
                  { email: identifier },
                  { username: identifier }
                ]
              }
            })

            if (!user) {
              throw new Error("No user found with this email or username")
            }

            // Check password
            const isPasswordValid = await bcrypt.compare(password, user.password)
            if (!isPasswordValid) {
              throw new Error("Invalid password")
            }

            return {
              id: user.id,
              email: user.email,
              username: user.username,
              role: user.role
            }
          }
        } catch (error) {
          console.error('Auth error:', error)
          throw new Error(error.message)
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.username = token.username
      }
      return session
    }
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})
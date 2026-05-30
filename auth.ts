import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    // Pass through the authorized callback from config
    ...authConfig.callbacks,
    session({ session, user }) {
      // Attach the database user id to the session for use in API routes
      session.user.id = user.id
      return session
    },
  },
})

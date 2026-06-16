import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig } from '@/auth.config'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Resend is added here (not in auth.config.ts) because the email provider
  // requires a database adapter to store verification tokens.
  providers: [
    ...authConfig.providers,
    // apiKey must be passed explicitly: the Auth.js Resend provider defaults
    // to reading AUTH_RESEND_KEY, but this project stores it as RESEND_API_KEY.
    // Without this, every magic-link send fails ("Could not send login link").
    Resend({ apiKey: process.env.RESEND_API_KEY!, from: process.env.EMAIL_FROM! }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    ...authConfig.callbacks,
    session({ session, user }) {
      session.user.id = user.id
      return session
    },
  },
})

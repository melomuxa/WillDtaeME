import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Resend from 'next-auth/providers/resend'

/**
 * Edge-safe auth config — no Prisma/Node.js imports.
 * Used by middleware.ts which runs in the Edge Runtime.
 *
 * The full config (with PrismaAdapter) lives in auth.ts.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Resend({
      from: process.env.EMAIL_FROM!,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard')
      if (isOnDashboard) return isLoggedIn
      return true
    },
  },
}

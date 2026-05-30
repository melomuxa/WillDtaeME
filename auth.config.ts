import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'

/**
 * Edge-safe auth config — no Prisma/Node.js imports, no email provider.
 * Used by proxy.ts which runs in the Edge Runtime.
 *
 * Resend email provider is intentionally excluded here because it requires
 * a database adapter to store verification tokens. It is added in auth.ts
 * which runs in the Node.js runtime with PrismaAdapter.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

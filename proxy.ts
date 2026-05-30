import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

/**
 * Edge-compatible proxy using the base auth config (no Prisma/Node.js imports).
 * Redirects unauthenticated users away from /dashboard routes.
 *
 * NOTE: Next.js 16 renamed middleware.ts → proxy.ts. Named export must be
 * called "proxy" to match the new convention.
 */
const { auth } = NextAuth(authConfig)

export const proxy = auth

export const config = {
  matcher: ['/dashboard/:path*'],
}

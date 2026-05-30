import { PrismaClient } from '@/app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// DECISION: Use a module-level singleton to reuse the Prisma client across
// hot-reloads in development. Without this, each HMR cycle creates a new
// client and exhausts the database connection pool.
//
// Prisma 7 requires a driver adapter — we use @prisma/adapter-pg which works
// with any standard PostgreSQL connection string (Neon, Supabase, local, etc.).
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

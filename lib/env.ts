/**
 * Validates required environment variables at module load time.
 * Throws in development if any are missing — prevents mysterious
 * runtime failures from incomplete configuration.
 */

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'NEXT_PUBLIC_APP_URL',
] as const

if (process.env.NODE_ENV !== 'test') {
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      throw new Error(
        `Missing required environment variable: ${key}\n` +
        `Copy .env.local.example to .env.local and fill in the values.`
      )
    }
  }
}

// Re-export with proper types so consumers don't need to null-check
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  RESEND_API_KEY: process.env.RESEND_API_KEY!,
  EMAIL_FROM: process.env.EMAIL_FROM!,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
} as const

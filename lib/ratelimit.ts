import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { RATE_LIMIT_MAX_ATTEMPTS, RATE_LIMIT_WINDOW_SECONDS } from '@/lib/constants'

// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter
// ─────────────────────────────────────────────────────────────────────────────

// DECISION: We use a fixed-window limiter keyed by shortId (not IP) because:
// 1. A single invite link is the resource we're protecting
// 2. IP-based limiting breaks behind shared NATs/proxies
// 3. The receiver is the only person who should submit, and only once
// Upstash Redis is optional — if env vars are absent, rate limiting is skipped
// (useful in development without a Redis instance).

let _ratelimit: Ratelimit | null = null

function getRateLimiter(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  if (!_ratelimit) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(RATE_LIMIT_MAX_ATTEMPTS, `${RATE_LIMIT_WINDOW_SECONDS}s`),
      prefix: 'dateme:accept',
    })
  }

  return _ratelimit
}

interface RateLimitResult {
  success: boolean
  remaining: number
}

/**
 * Checks whether the given key (invitation shortId) has exceeded the acceptance
 * rate limit. Returns success=true if the request should proceed.
 *
 * If Redis credentials are not configured, always returns success=true so
 * local development works without an Upstash account.
 */
export async function rateLimit(key: string): Promise<RateLimitResult> {
  const limiter = getRateLimiter()

  if (!limiter) {
    return { success: true, remaining: RATE_LIMIT_MAX_ATTEMPTS }
  }

  const result = await limiter.limit(key)
  return { success: result.success, remaining: result.remaining }
}

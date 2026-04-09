import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  redis = Redis.fromEnv()
  return redis
}

function getLimiter(scope: string, limit: number, windowMs: number): Ratelimit | null {
  const client = getRedis()
  if (!client) return null

  const key = `${scope}:${limit}:${windowMs}`
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        prefix: `rl:${scope}`,
      })
    )
  }
  return limiters.get(key)!
}

function getClientIp(request: Request): string {
  // Prefer platform-injected headers that clients cannot spoof.
  // x-forwarded-for is checked last because any client can set it.
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  )
}

export async function rateLimitRequest(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
): Promise<
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number }
> {
  const limiter = getLimiter(scope, limit, windowMs)

  if (!limiter) {
    // Upstash not configured — fall back to in-memory bucket.
    // Adequate for single-instance dev/staging; not suitable for multi-instance production.
    return inMemoryLimit(request, scope, limit, windowMs)
  }

  const ip = getClientIp(request)
  const { success, reset, remaining } = await limiter.limit(ip)

  if (!success) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    }
  }

  return { ok: true, remaining }
}

// ---------------------------------------------------------------------------
// In-memory fallback (dev / unconfigured environments only)
// ---------------------------------------------------------------------------

type RateLimitState = { count: number; resetAt: number }
const buckets = new Map<string, RateLimitState>()

function inMemoryLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number
): { ok: true; remaining: number } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now()
  const key = `${scope}:${getClientIp(request)}`
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  buckets.set(key, current)
  return { ok: true, remaining: Math.max(0, limit - current.count) }
}

export function cleanupRateLimitBuckets(maxAgeMs: number) {
  const now = Date.now()
  for (const [key, state] of buckets.entries()) {
    if (state.resetAt + maxAgeMs < now) {
      buckets.delete(key)
    }
  }
}

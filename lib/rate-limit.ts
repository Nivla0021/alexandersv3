// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

declare global {
  var _redis: Redis | undefined;
  var _signupLimiter: Ratelimit | undefined;
}

export const redis =
  globalThis._redis ??
  Redis.fromEnv();

if (process.env.NODE_ENV !== 'production') {
  globalThis._redis = redis;
}

export const signupRateLimit =
  globalThis._signupLimiter ??
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '15 m'),
    analytics: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._signupLimiter = signupRateLimit;
}

export async function checkSignupRateLimit(key: string) {
  const { success, remaining, reset } = await signupRateLimit.limit(key);
  return { success, remaining, reset };
}

/**
 * Reset rate limit by deleting Redis keys
 * Works with RegionRatelimit
 */
export async function resetRateLimit(key: string) {
  try {
    /**
     * Upstash ratelimit stores data using:
     * ratelimit:{identifier}
     * ratelimit:{identifier}:*
     */
    const prefix = `ratelimit:${key}`;

    const keys = await redis.keys(`${prefix}*`);

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // best-effort reset, ignore errors
  }
}

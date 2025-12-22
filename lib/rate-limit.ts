import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined;
  var _signupLimiter: Ratelimit | undefined;
}

export const redis =
  globalThis._redis ??
  Redis.fromEnv();

if (process.env.NODE_ENV !== 'production') {
  globalThis._redis = redis;
}

/**
 * Strict limiter for auth-related routes
 * 1 request per minute per IP (for testing)
 */
export const signupRateLimit =
  globalThis._signupLimiter ??
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, '1 m'),
    analytics: true,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis._signupLimiter = signupRateLimit;
}

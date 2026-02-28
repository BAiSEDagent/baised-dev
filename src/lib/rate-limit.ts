/**
 * Simple in-memory rate limiter for Edge functions
 * IP-based, sliding window, 10 requests per minute
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number | null;
}

const cache = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 10;

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = cache.get(identifier);

  // Clean up expired entries
  if (entry && now > entry.resetAt) {
    cache.delete(identifier);
  }

  const current = cache.get(identifier);

  if (!current) {
    cache.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfterSeconds: null };
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfterMs = current.resetAt - now;
    const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  current.count++;
  cache.set(identifier, current);
  return { allowed: true, remaining: MAX_REQUESTS - current.count, retryAfterSeconds: null };
}

// Backward compatibility alias
export const rateLimit = checkRateLimit;

export function getRateLimitIdentifier(req: Request): string {
  // Use x-forwarded-for if behind proxy, fallback to x-real-ip
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

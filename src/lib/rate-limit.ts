// SECURITY: In-memory sliding window rate limiter.
// On Vercel serverless, each cold start resets the window.
// This is acceptable for low-traffic protection. For high-traffic,
// swap to Upstash Redis (@upstash/ratelimit).

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;
const CLEANUP_INTERVAL_MS = 120_000; // 2 minutes

// Periodic cleanup to prevent memory leaks on long-running instances
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - WINDOW_MS;
  store.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number | null;
}

export function checkRateLimit(ip: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + WINDOW_MS - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.timestamps.length,
    retryAfterSeconds: null,
  };
}

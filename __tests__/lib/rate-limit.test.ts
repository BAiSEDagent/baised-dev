import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from '@/lib/rate-limit';

describe('rate-limit', () => {
  beforeEach(() => {
    // Reset module state between tests by reimporting
    vi.resetModules();
  });

  it('allows the first request', async () => {
    const { checkRateLimit: rl } = await import('@/lib/rate-limit');
    const result = rl('test-ip-1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.retryAfterSeconds).toBeNull();
  });

  it('allows up to 10 requests in a window', async () => {
    const { checkRateLimit: rl } = await import('@/lib/rate-limit');
    const ip = 'test-ip-2';
    for (let i = 0; i < 10; i++) {
      const result = rl(ip);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9 - i);
    }
  });

  it('blocks the 11th request with retryAfterSeconds', async () => {
    const { checkRateLimit: rl } = await import('@/lib/rate-limit');
    const ip = 'test-ip-3';
    for (let i = 0; i < 10; i++) {
      rl(ip);
    }
    const blocked = rl(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeTypeOf('number');
    expect(blocked.retryAfterSeconds!).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds!).toBeLessThanOrEqual(60);
  });

  it('tracks IPs independently', async () => {
    const { checkRateLimit: rl } = await import('@/lib/rate-limit');
    // Exhaust IP A
    for (let i = 0; i < 10; i++) rl('ip-a');
    expect(rl('ip-a').allowed).toBe(false);

    // IP B should still be allowed
    expect(rl('ip-b').allowed).toBe(true);
  });
});

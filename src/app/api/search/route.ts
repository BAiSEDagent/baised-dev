import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=<query>&limit=<n>
 * Full-text search over intel posts. Rate-limited. Premium bodies redacted.
 */
export async function GET(request: NextRequest) {
  // SECURITY: Rate limit search to prevent enumeration/DoS
  const ip =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limited' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds || 60) },
      }
    );
  }

  const q = request.nextUrl.searchParams.get('q')?.trim();
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get('limit') || '20', 10),
    50
  );

  if (!q || q.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  if (q.length > 200) {
    return NextResponse.json(
      { error: 'Query too long' },
      { status: 400 }
    );
  }

  // SECURITY: Sanitize query — strip control characters
  const sanitized = q.replace(/[\x00-\x1f\x7f]/g, '');
  if (sanitized.length < 2) {
    return NextResponse.json(
      { error: 'Invalid query' },
      { status: 400 }
    );
  }

  try {
    const posts = await prisma.intelPost.findMany({
      where: {
        status: 'published',
        OR: [
          { category: { contains: sanitized, mode: 'insensitive' } },
          { intelPayload: { path: ['title'], string_contains: sanitized } },
          { intelPayload: { path: ['body'], string_contains: sanitized } },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      query: sanitized,
      count: posts.length,
      results: posts.map((p) => {
        const payload = p.intelPayload as Record<string, unknown>;
        return {
          id: p.id,
          timestamp: p.timestamp,
          category: p.category,
          title: payload?.title || null,
          // SECURITY: Redact premium post bodies — they're behind x402 paywall
          body: p.isPremium ? null : (payload?.body || null),
          isPremium: p.isPremium,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

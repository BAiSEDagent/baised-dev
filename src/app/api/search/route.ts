import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/search?q=<query>&limit=<n>
 * Full-text search over intel posts. Case-insensitive substring match.
 */
export async function GET(request: NextRequest) {
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

  try {
    // Prisma string filter — case-insensitive contains
    const posts = await prisma.intelPost.findMany({
      where: {
        status: 'published',
        OR: [
          { category: { contains: q, mode: 'insensitive' } },
          { intelPayload: { path: ['title'], string_contains: q } },
          { intelPayload: { path: ['body'], string_contains: q } },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      query: q,
      count: posts.length,
      results: posts.map((p) => ({
        id: p.id,
        timestamp: p.timestamp,
        category: p.category,
        title: (p.intelPayload as Record<string, unknown>)?.title || null,
        body: (p.intelPayload as Record<string, unknown>)?.body || null,
        isPremium: p.isPremium,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

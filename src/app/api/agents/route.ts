import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateAgentSubmission } from '@/lib/agents';

export const dynamic = 'force-dynamic';

/**
 * OPTIONS /api/agents
 * CORS preflight for browser-based submissions.
 */
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET /api/agents?category=<cat>
 * Public listing of approved agents.
 */
export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get('category');

  try {
    const where: Record<string, unknown> = { status: 'approved' };
    if (category) where.category = category;

    const agents = await prisma.agent.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        capabilities: true,
        walletAddress: true,
        website: true,
        twitter: true,
        github: true,
        cdpTools: true,
        builder: true,
        featured: true,
      },
    });

    return NextResponse.json({ count: agents.length, agents }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

/**
 * POST /api/agents
 * Submit a new agent for review. Rate limited. Requires validation.
 */
export async function POST(request: NextRequest) {
  // SECURITY: Rate limit submissions
  const ip =
    request.headers.get('x-vercel-forwarded-for') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limited. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds || 60) } }
    );
  }

  // SECURITY: Size limit
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > 5000) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { valid, errors, sanitized } = validateAgentSubmission(body);
  if (!valid || !sanitized) {
    return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
  }

  try {
    // Check for duplicate name
    const existing = await prisma.agent.findFirst({
      where: { name: { equals: sanitized.name, mode: 'insensitive' } },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'An agent with this name already exists' },
        { status: 409 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name: sanitized.name,
        description: sanitized.description,
        category: sanitized.category,
        capabilities: sanitized.capabilities,
        walletAddress: sanitized.walletAddress || null,
        website: sanitized.website || null,
        twitter: sanitized.twitter || null,
        github: sanitized.github || null,
        cdpTools: sanitized.cdpTools,
        builder: sanitized.builder || null,
        status: 'pending', // SECURITY: All submissions require manual approval
        submitterIp: ip,
      },
    });

    return NextResponse.json(
      { message: 'Agent submitted for review', id: agent.id },
      {
        status: 201,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}

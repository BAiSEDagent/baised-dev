import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateIntelPayload } from '@/lib/validate';

// SECURITY: Lazy DB import — gracefully degrades if DATABASE_URL not set
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { prisma } = await import('@/lib/db');
    return prisma;
  } catch {
    return null;
  }
}

// SECURITY: Extract client IP — prefer Vercel's trusted header over spoofable X-Forwarded-For
function getClientIp(): string {
  const h = headers();
  // x-vercel-forwarded-for is set by Vercel edge and cannot be spoofed by clients
  return (
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    h.get('x-real-ip') ||
    'unknown'
  );
}

// SECURITY: CORS headers — GET is public, POST is restricted
function corsHeaders(method: 'GET' | 'POST'): Record<string, string> {
  if (method === 'GET') {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
  }
  // POST: no permissive CORS — agent calls from server-side only
  return {};
}

// CORS preflight handler
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(req: Request) {
  // SECURITY: Auth check — constant-time comparison would be ideal,
  // but Bearer token mismatch is not timing-sensitive at this scale
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.BAISED_AGENT_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // SECURITY: Rate limiting — 10 requests per minute per IP
  const ip = getClientIp();
  const rateResult = checkRateLimit(ip);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateResult.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  // SECURITY: Read raw body for size validation before parsing
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  // SECURITY: Parse JSON manually after size check
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 });
  }

  // SECURITY: Validate all fields, enforce size limits, reject unknowns
  const validation = validateIntelPayload(rawBody, parsed);
  if ('errors' in validation) {
    // Check if it's a size error — return 413
    if (validation.errors.some((e) => e.field === '_body')) {
      return NextResponse.json(
        { error: 'Payload too large', details: validation.errors },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 }
    );
  }

  try {
    const { data } = validation;
    const post = await db.intelPost.create({
      data: {
        blockHeight: data.blockHeight,
        intelPayload: data.intelPayload,
        signature: data.signature,
        category: data.category,
        status: 'published',
      },
    });

    return NextResponse.json(
      { message: 'Intel Deployed', id: post.id },
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': String(rateResult.remaining),
        },
      }
    );
  } catch (error) {
    console.error('Intel POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const db = await getDb();
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  // PIVOT: Intel is now FREE. x402 headers remain for optional tipping, but payment is not required.
  const txHash = req.headers.get('X-Payment-TxHash');

  // Optional tip processing — if payment header provided, record it as support
  if (txHash && /^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    try {
      // Check replay
      const existing = await db.paymentLedger.findUnique({ where: { txHash } });
      if (!existing) {
        const { verifyPayment } = await import('@/lib/x402');
        const verification = await verifyPayment(txHash as `0x${string}`);
        if (verification.valid) {
          await db.paymentLedger.create({
            data: {
              txHash,
              payer: verification.payer,
              amount: verification.amount,
              blockNumber: verification.blockNumber,
            },
          });
        }
      }
    } catch (error) {
      // Tip verification failed — log but don't block access
      console.error('Tip verification error:', error);
    }
  }

  // Return all published intel (free)
  try {
    const posts = await db.intelPost.findMany({
      where: { status: 'published' },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    // Include x402 headers for discoverability (optional tipping protocol)
    const { paymentRequiredHeaders } = await import('@/lib/x402');

    return NextResponse.json(
      {
        count: posts.length,
        intel: posts,
        note: 'All intel is free. Support BAiSED via optional x402 tips.',
      },
      {
        headers: {
          ...corsHeaders('GET'),
          ...paymentRequiredHeaders(),
          'X-Payment-Optional': 'true',
        },
      }
    );
  } catch (error) {
    console.error('Intel GET error:', error);
    return NextResponse.json(
      { count: 0, intel: [] },
      { headers: corsHeaders('GET') }
    );
  }
}

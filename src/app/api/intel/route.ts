import { NextResponse } from 'next/server';

// Dynamic DB import — gracefully degrades if DATABASE_URL not set
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { prisma } = await import('@/lib/db');
    return prisma;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.BAISED_AGENT_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    try {
        const body = await req.json();

        if (!body.blockHeight || !body.intelPayload || !body.signature) {
            return NextResponse.json(
                { error: 'Missing required fields: blockHeight, intelPayload, signature' },
                { status: 400 }
            );
        }

        const post = await db.intelPost.create({
            data: {
                blockHeight: body.blockHeight,
                intelPayload: JSON.stringify(body.intelPayload),
                signature: body.signature,
                category: body.category || 'general',
                status: body.status || 'published',
            },
        });

        return NextResponse.json({ message: 'Intel Deployed', id: post.id }, { status: 201 });
    } catch (error) {
        console.error('Intel POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
    const db = await getDb();
    if (!db) {
        return NextResponse.json({ count: 0, intel: [] });
    }

    try {
        const posts = await db.intelPost.findMany({
            where: { status: 'published' },
            orderBy: { timestamp: 'desc' },
            take: 20,
        });

        return NextResponse.json({
            count: posts.length,
            intel: posts.map(p => ({
                ...p,
                intelPayload: JSON.parse(p.intelPayload),
            })),
        });
    } catch (error) {
        console.error('Intel GET error:', error);
        return NextResponse.json({ count: 0, intel: [] });
    }
}

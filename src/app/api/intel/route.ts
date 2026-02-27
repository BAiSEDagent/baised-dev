import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
    // SECURITY: Bearer token auth
    if (req.headers.get('Authorization') !== `Bearer ${process.env.BAISED_AGENT_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();

        // Validate required fields
        if (!body.blockHeight || !body.intelPayload || !body.signature) {
            return NextResponse.json(
                { error: 'Missing required fields: blockHeight, intelPayload, signature' },
                { status: 400 }
            );
        }

        const post = await prisma.intelPost.create({
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
    try {
        const posts = await prisma.intelPost.findMany({
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
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

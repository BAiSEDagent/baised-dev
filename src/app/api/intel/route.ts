import { NextResponse } from 'next/server';
export async function POST(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.BAISED_AGENT_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Logic to save to DB goes here
    return NextResponse.json({ message: 'Intel Deployed' }, { status: 201 });
}

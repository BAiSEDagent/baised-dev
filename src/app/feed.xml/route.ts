import { prisma } from '@/lib/db';

export const revalidate = 300; // 5 min

export async function GET() {
  let posts: Array<{
    id: string;
    timestamp: Date;
    category: string;
    isPremium: boolean;
    intelPayload: unknown;
  }> = [];

  try {
    posts = await prisma.intelPost.findMany({
      where: { status: 'published' },
      orderBy: { timestamp: 'desc' },
      take: 20,
      select: {
        id: true,
        timestamp: true,
        category: true,
        isPremium: true,
        intelPayload: true,
      },
    });
  } catch {
    // DB unavailable — return empty feed
  }

  const items = posts
    .map((post) => {
      const payload = post.intelPayload as { title?: string; body?: string };
      const title = payload?.title || 'Intel Update';
      // Premium posts: show title only, body is gated
      const description = post.isPremium
        ? '[PREMIUM] Payload encrypted — requires x402 micro-tx verification.'
        : payload?.body || '';

      return `    <item>
      <title><![CDATA[${title}]]></title>
      <description><![CDATA[${description}]]></description>
      <link>https://baised.dev</link>
      <guid isPermaLink="false">${post.id}</guid>
      <category>${post.category}</category>
      <pubDate>${new Date(post.timestamp).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BAiSED — Base Ecosystem Intel</title>
    <link>https://baised.dev</link>
    <description>Live ecosystem intelligence for the Base L2 network. No hype. No speculation. Just signal.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://baised.dev/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

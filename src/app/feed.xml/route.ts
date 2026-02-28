import { prisma } from '@/lib/db';
import { generateWeeklyDigest } from '@/lib/weekly-digest';

export const revalidate = 300; // 5 min

// SECURITY: Escape CDATA-breaking sequences and XML entities
function safeCdata(s: string): string {
  return s.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let posts: Array<{
    id: string;
    timestamp: Date;
    category: string;
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
        intelPayload: true,
      },
    });
  } catch {
    // DB unavailable — return empty feed
  }

  // Weekly digest as first item
  let digestItem = '';
  try {
    const digest = await generateWeeklyDigest();
    const protocols = digest.topProtocols
      .map((p) => `${p.name}: ${p.tvl} (${p.change24h})`)
      .join(', ');
    digestItem = `    <item>
      <title><![CDATA[${safeCdata(`Weekly Digest — ${digest.weekOf}`)}]]></title>
      <description><![CDATA[${safeCdata(`${digest.summary}\n\nTop Protocols: ${protocols}`)}]]></description>
      <link>https://baised.dev/digest</link>
      <guid isPermaLink="false">digest-${escapeXml(digest.weekOf.replace(/\s+/g, '-'))}</guid>
      <category>digest</category>
      <pubDate>${new Date(digest.generatedAt).toUTCString()}</pubDate>
    </item>`;
  } catch {
    // Digest generation failed — skip
  }

  const items = posts
    .map((post) => {
      const payload = post.intelPayload as { title?: string; body?: string };
      const title = payload?.title || 'Intel Update';
      const description = payload?.body || '';

      return `    <item>
      <title><![CDATA[${safeCdata(title)}]]></title>
      <description><![CDATA[${safeCdata(description)}]]></description>
      <link>https://baised.dev</link>
      <guid isPermaLink="false">${escapeXml(post.id)}</guid>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${new Date(post.timestamp).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const allItems = [digestItem, items].filter(Boolean).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BAiSED — Base Ecosystem Intel</title>
    <link>https://baised.dev</link>
    <description>Live ecosystem intelligence for the Base L2 network. No hype. No speculation. Just signal.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://baised.dev/feed.xml" rel="self" type="application/rss+xml"/>
${allItems}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}

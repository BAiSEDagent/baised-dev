/**
 * Base Engineering Blog — RSS feed parser
 * Source: https://blog.base.dev (Paragraph)
 */

export interface BlogPost {
  title: string;
  url: string;
  date: string; // formatted display date
  description: string;
}

/**
 * Fetch latest posts from the Base Engineering Blog RSS feed.
 * Returns up to `limit` posts, cached at 15min ISR.
 */
export async function fetchBaseBlog(limit = 4): Promise<BlogPost[]> {
  try {
    const res = await fetch(
      'https://api.paragraph.com/blogs/rss/@base-engineering-blog',
      { next: { revalidate: 900 } }
    );
    if (!res.ok) return [];

    const xml = await res.text();
    return parseRssItems(xml).slice(0, limit);
  } catch {
    return [];
  }
}

function parseRssItems(xml: string): BlogPost[] {
  const items: BlogPost[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    const pubDate = extractTag(block, 'pubDate');
    const description = extractTag(block, 'description');

    if (title && link) {
      items.push({
        title: cleanCdata(title),
        url: link.startsWith('http') ? link : `https://blog.base.dev${link}`,
        date: pubDate ? formatDate(pubDate) : '',
        description: truncate(cleanCdata(description || ''), 120),
      });
    }
  }

  return items;
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = regex.exec(xml);
  return m ? m[1].trim() : null;
}

function cleanCdata(s: string): string {
  return s.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

/**
 * Base Ecosystem Changelog — pulls top protocol data from DeFiLlama
 * and formats as ecosystem activity feed.
 */

export interface ChangelogEntry {
  protocol: string;
  slug: string;
  category: string;
  tvl: string;
  change24h: string;
  changeDirection: 'up' | 'down' | 'flat';
  url: string;
  sparkline: number[]; // 7 normalized values (0-1) for SVG sparkline
}

/**
 * Fetch top Base-native protocols with 24h TVL changes.
 * Cached at 15min ISR — protocol data doesn't change fast.
 */
export async function fetchBaseChangelog(): Promise<ChangelogEntry[]> {
  try {
    const res = await fetch('https://api.llama.fi/protocols', {
      next: { revalidate: 900 }, // 15 min cache
    });

    if (!res.ok) return [];

    const protocols: Array<{
      name: string;
      chains?: string[];
      tvl?: number;
      change_1d?: number;
      category?: string;
      url?: string;
    }> = await res.json();

    // Filter: on Base, >$1M TVL, not CEX/Chain
    const EXCLUDE_CATEGORIES = new Set(['CEX', 'Chain']);

    const baseProtocols = protocols
      .filter(
        (p) =>
          (p.chains || []).includes('Base') &&
          (p.tvl || 0) > 1_000_000 &&
          !EXCLUDE_CATEGORIES.has(p.category || '')
      )
      .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
      .slice(0, 8);

    // Fetch sparklines in parallel for top protocols
    const entries = await Promise.all(
      baseProtocols.map(async (p) => {
        const change = p.change_1d || 0;
        const slug = (p as Record<string, unknown>).slug as string || p.name.toLowerCase().replace(/\s+/g, '-');
        const sparkline = await fetchProtocolSparkline(slug);
        return {
          protocol: p.name,
          slug,
          category: p.category || 'Unknown',
          tvl: formatCompact(p.tvl || 0),
          change24h: change === 0 ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
          changeDirection: (change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'flat') as 'up' | 'down' | 'flat',
          url: p.url || '#',
          sparkline,
        };
      })
    );

    return entries;
  } catch {
    return [];
  }
}

/**
 * Fetch 7-day Base TVL history for a protocol, normalized to 0-1 for sparkline.
 */
async function fetchProtocolSparkline(slug: string): Promise<number[]> {
  try {
    const res = await fetch(`https://api.llama.fi/protocol/${slug}`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];

    const data = await res.json();
    const baseTvl: Array<{ date: number; totalLiquidityUSD: number }> =
      data?.chainTvls?.Base?.tvl || [];

    if (baseTvl.length < 7) return [];

    // Last 7 data points
    const last7 = baseTvl.slice(-7).map((d) => d.totalLiquidityUSD);
    const min = Math.min(...last7);
    const max = Math.max(...last7);
    const range = max - min || 1;

    return last7.map((v) => (v - min) / range);
  } catch {
    return [];
  }
}

function formatCompact(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}

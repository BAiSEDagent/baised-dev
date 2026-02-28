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

    // Fetch Base-specific TVL + sparklines in parallel
    const entries = (await Promise.all(
      baseProtocols.map(async (p) => {
        const slug = (p as Record<string, unknown>).slug as string || p.name.toLowerCase().replace(/\s+/g, '-');
        const { baseTvl, change24h, sparkline } = await fetchProtocolBaseData(slug);

        // Skip if no Base TVL data
        if (baseTvl === 0) return null;

        return {
          protocol: p.name,
          slug,
          category: p.category || 'Unknown',
          tvl: formatCompact(baseTvl),
          change24h: change24h === 0 ? '—' : `${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}%`,
          changeDirection: (change24h > 0.1 ? 'up' : change24h < -0.1 ? 'down' : 'flat') as 'up' | 'down' | 'flat',
          url: p.url || '#',
          sparkline,
        };
      })
    )).filter((e): e is ChangelogEntry => e !== null)
      .sort((a, b) => parseCompact(b.tvl) - parseCompact(a.tvl))
      .slice(0, 8);

    return entries;
  } catch {
    return [];
  }
}

/**
 * Fetch Base-specific TVL, 24h change, and 7-day sparkline for a protocol.
 */
async function fetchProtocolBaseData(slug: string): Promise<{
  baseTvl: number;
  change24h: number;
  sparkline: number[];
}> {
  const empty = { baseTvl: 0, change24h: 0, sparkline: [] };
  try {
    const res = await fetch(`https://api.llama.fi/protocol/${slug}`, {
      next: { revalidate: 900 },
    });
    if (!res.ok) return empty;

    const data = await res.json();
    const baseTvlHistory: Array<{ date: number; totalLiquidityUSD: number }> =
      data?.chainTvls?.Base?.tvl || [];

    if (baseTvlHistory.length < 2) return empty;

    // Current Base TVL = last data point
    const current = baseTvlHistory[baseTvlHistory.length - 1].totalLiquidityUSD;

    // 24h change: compare last vs second-to-last (daily granularity)
    const prev = baseTvlHistory[baseTvlHistory.length - 2].totalLiquidityUSD;
    const change24h = prev > 0 ? ((current - prev) / prev) * 100 : 0;

    // Sparkline: last 7 data points normalized to 0-1
    let sparkline: number[] = [];
    if (baseTvlHistory.length >= 7) {
      const last7 = baseTvlHistory.slice(-7).map((d) => d.totalLiquidityUSD);
      const min = Math.min(...last7);
      const max = Math.max(...last7);
      const range = max - min || 1;
      sparkline = last7.map((v) => (v - min) / range);
    }

    return { baseTvl: current, change24h, sparkline };
  } catch {
    return empty;
  }
}

function parseCompact(s: string): number {
  const n = parseFloat(s.replace(/[$,]/g, ''));
  if (s.endsWith('B')) return n * 1e9;
  if (s.endsWith('M')) return n * 1e6;
  if (s.endsWith('K')) return n * 1e3;
  return n;
}

function formatCompact(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}

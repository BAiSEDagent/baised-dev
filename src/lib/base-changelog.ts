/**
 * Base Ecosystem Changelog — pulls top protocol data from DeFiLlama
 * and formats as ecosystem activity feed.
 */

export interface ChangelogEntry {
  protocol: string;
  category: string;
  tvl: string;
  change24h: string;
  changeDirection: 'up' | 'down' | 'flat';
  url: string;
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

    return baseProtocols.map((p) => {
      const change = p.change_1d || 0;
      return {
        protocol: p.name,
        category: p.category || 'Unknown',
        tvl: formatCompact(p.tvl || 0),
        change24h: change === 0 ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        changeDirection: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'flat',
        url: p.url || '#',
      };
    });
  } catch {
    return [];
  }
}

function formatCompact(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${(value / 1e3).toFixed(0)}K`;
}

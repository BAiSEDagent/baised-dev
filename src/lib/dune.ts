const DUNE_API_KEY = "ounvRuHOyojtSpSEpXTANvZwtSBHdHZN";
const BASE_URL = "https://api.dune.com/api/v1/query";

async function fetchDuneQuery<T>(queryId: number): Promise<T[] | null> {
  try {
    const signal = AbortSignal.timeout(10_000);
    const res = await fetch(
      `${BASE_URL}/${queryId}/results?limit=200`,
      {
        headers: { "X-DUNE-API-KEY": DUNE_API_KEY },
        signal,
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.result?.rows ?? null;
  } catch {
    return null;
  }
}

export interface PulseCounters {
  dau_24h: number;
  dau_7d: number;
  tx_24h: number;
  tx_7d: number;
}

export interface DexCounters {
  dex_vol_24h: number;
  dex_vol_7d: number;
  traders_7d: number;
}

export interface WalletsRow {
  day: string;
  active_wallets: number;
  ma_7d_wallets: number;
}

export interface MarketShareRow {
  project: string;
  volume_7d: number;
  market_share_pct: number;
  traders_7d?: number;
}

export async function fetchPulseCounters(): Promise<PulseCounters | null> {
  const rows = await fetchDuneQuery<PulseCounters>(6767640);
  return rows?.[0] ?? null;
}

export async function fetchDexCounters(): Promise<DexCounters | null> {
  const rows = await fetchDuneQuery<DexCounters>(6767641);
  return rows?.[0] ?? null;
}

export async function fetchWalletsSeries(): Promise<WalletsRow[] | null> {
  return fetchDuneQuery<WalletsRow>(6767642);
}

export async function fetchDexMarketShare(): Promise<MarketShareRow[] | null> {
  return fetchDuneQuery<MarketShareRow>(6767643);
}

export function formatCompact(
  n: number | null | undefined,
  prefix = ""
): string {
  if (n == null) return "—";
  if (n >= 1e9) return `${prefix}${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${prefix}${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${prefix}${Math.round(n / 1000)}k`;
  return `${prefix}${n.toLocaleString()}`;
}

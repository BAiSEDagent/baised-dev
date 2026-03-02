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

export interface CrossChainDexRow {
  day: string;
  blockchain: string;
  volume_usd: number;
}

export interface CrossChainDexData {
  base: CrossChainDexRow[];
  ethereum: CrossChainDexRow[];
  arbitrum: CrossChainDexRow[];
  optimism: CrossChainDexRow[];
}

export async function fetchCrossChainDex(): Promise<CrossChainDexData | null> {
  try {
    const signal = AbortSignal.timeout(10_000);
    const res = await fetch(
      `${BASE_URL}/6767495/results?limit=500`,
      {
        headers: { "X-DUNE-API-KEY": DUNE_API_KEY },
        signal,
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const rows: CrossChainDexRow[] = json?.result?.rows ?? [];

    const grouped: CrossChainDexData = { base: [], ethereum: [], arbitrum: [], optimism: [] };
    for (const row of rows) {
      const chain = row.blockchain?.toLowerCase();
      if (chain === "base") grouped.base.push(row);
      else if (chain === "ethereum") grouped.ethereum.push(row);
      else if (chain === "arbitrum") grouped.arbitrum.push(row);
      else if (chain === "optimism") grouped.optimism.push(row);
    }
    return grouped;
  } catch {
    return null;
  }
}

export interface ContractDeploymentRow {
  day: string;
  contracts_deployed: number;
  unique_deployers: number;
}

export async function fetchContractDeployments(): Promise<ContractDeploymentRow[] | null> {
  try {
    const signal = AbortSignal.timeout(10_000);
    const res = await fetch(
      `${BASE_URL}/6767494/results?limit=200`,
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

// ── Agent Activity Queries ──────────────────────────────────────────────────

export interface ERC8004Row {
  day: string;
  new_registrations: number;
  cumulative_agents: number;
}

export interface VirtualDexRow {
  day: string;
  volume_usd: number;
  trades: number;
  unique_traders: number;
}

export interface AgentLeaderboardRow {
  project: string;
  category: string;
  dex_trades_30d: number;
  unique_traders_30d: number;
  volume_30d_usd: number;
  dex_trades_7d: number;
  unique_traders_7d: number;
  wow_vol_pct: number;
  activity_score: number;
}

export interface AgenticPulseRow {
  day: string;
  daily_trades: number;
  daily_traders: number;
  daily_volume_usd: number;
  ma_7d_trades: number;
  ma_7d_traders: number;
  cumulative_trades: number;
}

export async function fetchERC8004Registrations(): Promise<ERC8004Row[] | null> {
  return fetchDuneQuery<ERC8004Row>(6767957);
}

export async function fetchVirtualDexActivity(): Promise<VirtualDexRow[] | null> {
  return fetchDuneQuery<VirtualDexRow>(6767958);
}

export async function fetchAgentLeaderboard(): Promise<AgentLeaderboardRow[] | null> {
  return fetchDuneQuery<AgentLeaderboardRow>(6768006);
}

export async function fetchAgenticPulse(): Promise<AgenticPulseRow[] | null> {
  return fetchDuneQuery<AgenticPulseRow>(6768008);
}

/**
 * Base Network Status — pulls from status.base.org (Atlassian Statuspage API).
 * Free, public, no API key required.
 */

export interface NetworkStatus {
  overall: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  description: string;
  components: Array<{
    name: string;
    status: string;
    group: string;
  }>;
  activeIncidents: Array<{
    name: string;
    status: string;
    impact: string;
    updatedAt: string;
  }>;
}

const STATUS_MAP: Record<string, NetworkStatus['overall']> = {
  none: 'operational',
  minor: 'degraded',
  major: 'partial_outage',
  critical: 'major_outage',
};

// Components we care about (skip duplicates, focus on mainnet)
const MAINNET_COMPONENTS = new Set([
  'Public RPC API',
  'Block production',
  'Transaction pool',
  'Deposits',
  'Withdrawals',
  'Batch submission',
  'Flashblocks',
]);

export async function fetchBaseStatus(): Promise<NetworkStatus> {
  try {
    const res = await fetch('https://status.base.org/api/v2/summary.json', {
      next: { revalidate: 60 }, // 1 min cache — status matters
    });

    if (!res.ok) {
      return fallback();
    }

    const data = await res.json();

    const overall = STATUS_MAP[data.status?.indicator] || 'operational';
    const description = data.status?.description || 'Unknown';

    // Parse mainnet components (dedupe by taking first match)
    const seen = new Set<string>();
    const components = (data.components || [])
      .filter((c: { name: string; group_id: string | null }) => {
        if (!MAINNET_COMPONENTS.has(c.name)) return false;
        if (seen.has(c.name)) return false;
        seen.add(c.name);
        return true;
      })
      .map((c: { name: string; status: string; group_id: string | null }) => ({
        name: c.name,
        status: c.status.replace('_', ' '),
        group: 'Mainnet',
      }));

    // Active incidents
    const activeIncidents = (data.incidents || [])
      .slice(0, 3)
      .map((i: { name: string; status: string; impact: string; updated_at: string }) => ({
        name: i.name,
        status: i.status,
        impact: i.impact,
        updatedAt: i.updated_at,
      }));

    return { overall, description, components, activeIncidents };
  } catch {
    return fallback();
  }
}

function fallback(): NetworkStatus {
  return {
    overall: 'operational',
    description: 'Status unavailable',
    components: [],
    activeIncidents: [],
  };
}

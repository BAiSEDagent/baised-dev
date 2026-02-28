import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 min cache

/**
 * GET /api/stats — Public Base ecosystem stats endpoint.
 * No auth required. Machine-readable JSON for agents and builders.
 * Data sourced from DeFiLlama + status.base.org (free, no API key).
 */
export async function GET() {
  const [chains, dex, fees, block, status] = await Promise.allSettled([
    fetch('https://api.llama.fi/v2/chains').then((r) => r.json()),
    fetch('https://api.llama.fi/overview/dexs/Base').then((r) => r.json()),
    fetch('https://api.llama.fi/overview/fees/Base').then((r) => r.json()),
    fetch(process.env.BASE_RPC_URL || 'https://mainnet.base.org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    }).then((r) => r.json()),
    fetch('https://status.base.org/api/v2/status.json').then((r) => r.json()),
  ]);

  // Parse network status
  let networkStatus = 'unknown';
  if (status.status === 'fulfilled') {
    const indicator = (status.value as { status?: { indicator?: string } })?.status?.indicator;
    networkStatus = indicator === 'none' ? 'operational' : indicator || 'unknown';
  }

  // Parse TVL
  let tvl = null;
  if (chains.status === 'fulfilled') {
    const base = (chains.value as Array<{ name: string; tvl: number }>).find(
      (c) => c.name === 'Base'
    );
    tvl = base?.tvl || null;
  }

  // Parse DEX volume
  let dexVolume24h = null;
  let dexVolume7d = null;
  if (dex.status === 'fulfilled') {
    const d = dex.value as { total24h?: number; total7d?: number };
    dexVolume24h = d.total24h || null;
    dexVolume7d = d.total7d || null;
  }

  // Parse fees
  let fees24h = null;
  if (fees.status === 'fulfilled') {
    fees24h = (fees.value as { total24h?: number }).total24h || null;
  }

  // Parse block
  let latestBlock = null;
  if (block.status === 'fulfilled') {
    latestBlock = parseInt((block.value as { result: string }).result, 16);
  }

  return NextResponse.json(
    {
      chain: 'base',
      chainId: 8453,
      timestamp: new Date().toISOString(),
      networkStatus,
      tvl,
      dexVolume24h,
      dexVolume7d,
      fees24h,
      latestBlock,
      sources: {
        tvl: 'defillama/v2/chains',
        dex: 'defillama/overview/dexs/Base',
        fees: 'defillama/overview/fees/Base',
        block: 'base-mainnet-rpc',
      },
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    }
  );
}

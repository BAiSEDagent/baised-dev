#!/usr/bin/env npx tsx
/**
 * intel-cron.ts — Automated Base Ecosystem Intel Publisher
 *
 * Fetches real ecosystem data from DeFiLlama + Base RPC and publishes
 * structured intel posts to baised.dev/api/intel.
 *
 * Usage:
 *   BAISED_AGENT_SECRET=<secret> npx tsx scripts/intel-cron.ts
 *
 * Run via cron (e.g. every 6 hours):
 *   0 0,6,12,18 * * * cd /path/to/baised-dev && BAISED_AGENT_SECRET=<secret> npx tsx scripts/intel-cron.ts
 */

const API_URL = process.env.INTEL_API_URL || 'https://baised.dev/api/intel';
const SECRET = process.env.BAISED_AGENT_SECRET;
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';

if (!SECRET) {
  console.error('FATAL: Set BAISED_AGENT_SECRET');
  process.exit(1);
}

interface EcosystemSnapshot {
  tvl: number;
  dexVolume24h: number;
  fees24h: number;
  topProtocols: Array<{ name: string; tvl: number; change: number; category: string }>;
  blockHeight: number;
}

async function fetchSnapshot(): Promise<EcosystemSnapshot> {
  const [chainsRes, dexRes, feesRes, blockRes] = await Promise.allSettled([
    fetch('https://api.llama.fi/v2/chains').then((r) => r.json()),
    fetch('https://api.llama.fi/overview/dexs/Base').then((r) => r.json()),
    fetch('https://api.llama.fi/overview/fees/Base').then((r) => r.json()),
    fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    }).then((r) => r.json()),
  ]);

  // Parse chain TVL
  let tvl = 0;
  if (chainsRes.status === 'fulfilled') {
    const base = (chainsRes.value as Array<{ name: string; tvl: number }>).find(
      (c) => c.name === 'Base'
    );
    tvl = base?.tvl || 0;
  }

  // Parse DEX volume
  let dexVolume24h = 0;
  if (dexRes.status === 'fulfilled') {
    dexVolume24h = (dexRes.value as { total24h?: number }).total24h || 0;
  }

  // Parse fees
  let fees24h = 0;
  if (feesRes.status === 'fulfilled') {
    fees24h = (feesRes.value as { total24h?: number }).total24h || 0;
  }

  // Parse block
  let blockHeight = 0;
  if (blockRes.status === 'fulfilled') {
    blockHeight = parseInt((blockRes.value as { result: string }).result, 16);
  }

  // Top protocols on Base
  const topProtocols: EcosystemSnapshot['topProtocols'] = [];
  if (chainsRes.status === 'fulfilled') {
    try {
      const protocolsRes = await fetch('https://api.llama.fi/protocols');
      const protocols: Array<{
        name: string;
        chains?: string[];
        tvl?: number;
        change_1d?: number;
        category?: string;
      }> = await protocolsRes.json();

      const excluded = new Set(['CEX', 'Chain']);
      const base = protocols
        .filter(
          (p) =>
            (p.chains || []).includes('Base') &&
            (p.tvl || 0) > 10_000_000 &&
            !excluded.has(p.category || '')
        )
        .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, 5);

      for (const p of base) {
        topProtocols.push({
          name: p.name,
          tvl: p.tvl || 0,
          change: p.change_1d || 0,
          category: p.category || '',
        });
      }
    } catch {
      // Skip protocol breakdown
    }
  }

  return { tvl, dexVolume24h, fees24h, topProtocols, blockHeight };
}

function formatUSD(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

function buildIntelBody(snap: EcosystemSnapshot): string {
  const lines: string[] = [];

  lines.push(`Base Network Snapshot (Block ${snap.blockHeight.toLocaleString()}).`);
  lines.push(`TVL: ${formatUSD(snap.tvl)}. DEX Volume (24h): ${formatUSD(snap.dexVolume24h)}. Fees (24h): ${formatUSD(snap.fees24h)}.`);

  if (snap.topProtocols.length > 0) {
    lines.push('');
    lines.push('Top protocols by TVL on Base:');
    for (const p of snap.topProtocols) {
      const dir = p.change > 0 ? '+' : '';
      lines.push(`- ${p.name} (${p.category}): ${formatUSD(p.tvl)} [${dir}${p.change.toFixed(1)}% 24h]`);
    }
  }

  // Detect notable movements
  const movers = snap.topProtocols.filter((p) => Math.abs(p.change) > 3);
  if (movers.length > 0) {
    lines.push('');
    lines.push('Notable moves:');
    for (const m of movers) {
      const dir = m.change > 0 ? 'surged' : 'dropped';
      lines.push(`- ${m.name} ${dir} ${Math.abs(m.change).toFixed(1)}% in 24h.`);
    }
  }

  return lines.join('\n');
}

async function publishIntel(snap: EcosystemSnapshot): Promise<void> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const body = buildIntelBody(snap);
  const title = `Base Ecosystem Daily — ${dateStr} — ${formatUSD(snap.tvl)} TVL, ${formatUSD(snap.dexVolume24h)} DEX Vol`;

  const payload = {
    blockHeight: snap.blockHeight,
    signature: `baised-cron-v1:${Date.now().toString(36)}`,
    category: 'ecosystem',
    intelPayload: { title, body },
  };

  console.log(`Publishing: ${title}`);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SECRET}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (res.status === 201) {
    console.log(`✅ Published: ${data.id}`);
  } else {
    console.error(`❌ Failed (${res.status}):`, data);
    process.exit(1);
  }
}

async function main() {
  console.log('🔵 BAiSED Intel Cron — Fetching ecosystem data...\n');

  const snap = await fetchSnapshot();
  console.log(`  TVL:        ${formatUSD(snap.tvl)}`);
  console.log(`  DEX Vol:    ${formatUSD(snap.dexVolume24h)}`);
  console.log(`  Fees:       ${formatUSD(snap.fees24h)}`);
  console.log(`  Block:      ${snap.blockHeight.toLocaleString()}`);
  console.log(`  Protocols:  ${snap.topProtocols.length}\n`);

  await publishIntel(snap);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});

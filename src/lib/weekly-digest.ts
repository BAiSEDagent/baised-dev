/**
 * Weekly Ecosystem Digest — aggregates Base chain data into a shareable summary.
 * Pulls from: DeFiLlama (TVL, DEX vol, fees, protocols), CDP RPC (gas, block), RSS (blog).
 */

import { fetchBaseChainData } from './base-intel';
import { fetchBaseChangelog } from './base-changelog';
import { fetchBaseBlog } from './base-blog';

export interface WeeklyDigest {
  generatedAt: string;
  weekOf: string;
  chain: {
    tvl: string;
    dexVolume24h: string;
    fees24h: string;
    gasPrice: string;
    latestBlock: number | string;
  };
  topProtocols: Array<{
    name: string;
    category: string;
    tvl: string;
    change24h: string;
    direction: 'up' | 'down' | 'flat';
  }>;
  engineeringPosts: Array<{
    title: string;
    url: string;
    date: string;
  }>;
  summary: string;
}

export async function generateWeeklyDigest(): Promise<WeeklyDigest> {
  const [chainData, protocols, blogPosts] = await Promise.all([
    fetchBaseChainData(),
    fetchBaseChangelog(),
    fetchBaseBlog(5),
  ]);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  const weekOf = weekStart.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const topProtocols = protocols.slice(0, 5).map((p) => ({
    name: p.protocol,
    category: p.category,
    tvl: p.tvl,
    change24h: p.change24h,
    direction: p.changeDirection,
  }));

  const engineeringPosts = blogPosts.map((p) => ({
    title: p.title,
    url: p.url,
    date: p.date,
  }));

  // Auto-generate summary
  const topProto = topProtocols[0];
  const summary = [
    `Base TVL stands at ${chainData.tvl} with ${chainData.dexVolume24h} in 24h DEX volume.`,
    topProto
      ? `${topProto.name} leads Base protocols at ${topProto.tvl} TVL (${topProto.change24h} 24h).`
      : '',
    `Current gas: ${chainData.gasPrice}. Network fees: ${chainData.fees24h}/24h.`,
    engineeringPosts.length > 0
      ? `Latest from Base Engineering: "${engineeringPosts[0].title}".`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    generatedAt: now.toISOString(),
    weekOf,
    chain: {
      tvl: chainData.tvl,
      dexVolume24h: chainData.dexVolume24h,
      fees24h: chainData.fees24h,
      gasPrice: chainData.gasPrice,
      latestBlock: chainData.latestBlock,
    },
    topProtocols,
    engineeringPosts,
    summary,
  };
}

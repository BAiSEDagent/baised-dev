import { generateWeeklyDigest } from '@/lib/weekly-digest';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 3600; // 1 hour cache

export const metadata: Metadata = {
  title: 'Weekly Digest — BAiSED',
  description: 'Weekly Base ecosystem intelligence digest. TVL, protocols, gas, and engineering updates.',
};

export default async function DigestPage() {
  const digest = await generateWeeklyDigest();

  return (
    <div className="min-h-screen bg-[#050508] flex items-start justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[700px] bg-[#0a0c12] border border-[#1a2a3a] mt-4 sm:mt-8">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#1a1f2e]">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
            >
              ← COMMAND_DECK
            </Link>
            <span className="font-mono text-[10px] text-[#444]">
              {new Date(digest.generatedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <h1 className="font-mono text-lg sm:text-xl font-bold text-[#ededed] tracking-wide mt-4">
            WEEKLY_DIGEST
          </h1>
          <p className="font-mono text-xs text-[#787878] mt-1">
            Week of {digest.weekOf}
          </p>
        </div>

        {/* Summary */}
        <div className="p-5 sm:p-6 border-b border-[#1a1f2e]">
          <p className="font-mono text-sm text-[#c8c8c8] leading-relaxed">
            {digest.summary}
          </p>
        </div>

        {/* Chain Stats */}
        <div className="p-5 sm:p-6 border-b border-[#1a1f2e]">
          <h2 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
            CHAIN_METRICS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'TVL', value: digest.chain.tvl },
              { label: 'DEX VOL 24H', value: digest.chain.dexVolume24h },
              { label: 'FEES 24H', value: digest.chain.fees24h },
              { label: 'GAS', value: digest.chain.gasPrice },
              { label: 'BLOCK', value: typeof digest.chain.latestBlock === 'number' ? digest.chain.latestBlock.toLocaleString() : digest.chain.latestBlock },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-[10px] text-[#555]">{stat.label}</p>
                <p className="font-mono text-sm text-[#ededed] font-bold mt-0.5">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Protocols */}
        {digest.topProtocols.length > 0 && (
          <div className="p-5 sm:p-6 border-b border-[#1a1f2e]">
            <h2 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
              TOP_PROTOCOLS
            </h2>
            <div className="space-y-2">
              {digest.topProtocols.map((p, i) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between font-mono text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#555] w-4">{i + 1}.</span>
                    <span className="text-[#c8c8c8]">{p.name}</span>
                    <span className="text-[#555]">{p.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#ededed] tabular-nums">{p.tvl}</span>
                    <span
                      className={`tabular-nums w-16 text-right ${
                        p.direction === 'up'
                          ? 'text-[#00C853]'
                          : p.direction === 'down'
                            ? 'text-[#FF3B30]'
                            : 'text-[#787878]'
                      }`}
                    >
                      {p.change24h}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engineering Blog */}
        {digest.engineeringPosts.length > 0 && (
          <div className="p-5 sm:p-6 border-b border-[#1a1f2e]">
            <h2 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
              BASE_ENGINEERING
            </h2>
            <div className="space-y-2">
              {digest.engineeringPosts.map((post) => (
                <a
                  key={post.url}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group"
                >
                  <p className="font-mono text-xs text-[#c8c8c8] group-hover:text-[#0052FF] transition-colors">
                    {post.title}
                  </p>
                  <p className="font-mono text-[10px] text-[#444] mt-0.5">
                    {post.date}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-5 sm:p-6">
          <p className="font-mono text-[10px] text-[#444]">
            Auto-generated by BAiSED · Data: DeFiLlama, Coinbase CDP, Base Status, blog.base.dev
          </p>
          <p className="font-mono text-[10px] text-[#444] mt-1">
            Not financial advice. Data may be delayed.
          </p>
        </div>
      </div>
    </div>
  );
}

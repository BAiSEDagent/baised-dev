import {
  fetchPulseCounters,
  fetchDexCounters,
  fetchWalletsSeries,
  fetchDexMarketShare,
  fetchCrossChainDex,
  fetchContractDeployments,
  formatCompact,
} from "@/lib/dune";
import { WalletsChart } from "@/components/wallets-chart";
import { CrossChainChart } from "@/components/crosschain-chart";
import { ContractsChart } from "@/components/contracts-chart";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = {
  title: "Base Chain Analytics — BAiSED",
  description:
    "Deep on-chain analytics for Base L2: daily active wallets, transactions, DEX volume breakdown, cross-chain comparison, and builder activity. Powered by Dune Analytics SQL.",
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="border border-[#1a2a3a] bg-[#0a0c12] p-4">
      <p className="font-mono text-[10px] text-[#787878] uppercase tracking-wider">
        {label}
      </p>
      <p className="font-mono text-xl sm:text-2xl text-[#ededed] font-bold mt-1 tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="font-mono text-[10px] text-[#787878] mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="border-t border-[#1a2a3a] mb-6 pt-1">
      <p className="font-mono text-[10px] text-[#787878] uppercase tracking-widest">
        {label}
      </p>
    </div>
  );
}

function protocolColor(project: string): string {
  const name = project.toLowerCase();
  if (name.includes("aerodrome")) return "#FF007A";
  if (name.includes("uniswap")) return "#0052FF";
  if (name.includes("pancake")) return "#00C853";
  return "#787878";
}

export default async function AnalyticsPage() {
  const [pulse, dex, wallets, marketShare, crossChain, deployments] =
    await Promise.all([
      fetchPulseCounters(),
      fetchDexCounters(),
      fetchWalletsSeries(),
      fetchDexMarketShare(),
      fetchCrossChainDex(),
      fetchContractDeployments(),
    ]);

  const updatedAt = new Date().toUTCString();

  return (
    <div className="min-h-screen bg-[#050508] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1100px]">

        {/* Nav */}
        <nav className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-sm font-bold text-[#ededed] tracking-wide">
            BASE_ANALYTICS
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
            >
              Dashboard →
            </Link>
            <Link
              href="/"
              className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
            >
              ← Command Deck
            </Link>
          </div>
        </nav>

        {/* Timestamp */}
        <p className="font-mono text-[10px] text-[#444] mb-6 tabular-nums">
          Updated: {updatedAt}
        </p>

        {/* ── CHAIN ACTIVITY ── */}
        <SectionDivider label="CHAIN ACTIVITY" />

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Active Wallets (24h)"
            value={formatCompact(pulse?.dau_24h)}
            sub="Unique wallets on Base"
          />
          <StatCard
            label="Transactions (24h)"
            value={formatCompact(pulse?.tx_24h)}
            sub="On-chain txs"
          />
          <StatCard
            label="DEX Volume (24h)"
            value={formatCompact(dex?.dex_vol_24h, "$")}
            sub="Across all DEXs"
          />
          <StatCard
            label="DEX Traders (7d)"
            value={formatCompact(dex?.traders_7d)}
            sub="Unique traders"
          />
        </div>

        {/* Hero: Wallets Chart */}
        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-4 uppercase">
            ACTIVE_WALLETS_90D
          </h2>
          {wallets && wallets.length > 0 ? (
            <WalletsChart data={wallets} />
          ) : (
            <p className="font-mono text-sm text-[#787878] py-8 text-center">
              Data unavailable
            </p>
          )}
          <p className="font-mono text-[10px] text-[#444] mt-3">
            Source: Dune Analytics · base.transactions Spellbook · Updated hourly
          </p>
        </div>

        {/* ── DEX MARKETS ── */}
        <SectionDivider label="DEX MARKETS" />

        {/* DEX Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Left: Market Share Bars */}
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5">
            <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-4 uppercase">
              DEX_MARKET_SHARE_7D
            </h2>
            {marketShare && marketShare.length > 0 ? (
              <div className="space-y-3.5">
                {marketShare.map((row) => {
                  const pct = Number(row.market_share_pct ?? 0);
                  return (
                    <div key={row.project}>
                      <div className="flex items-center justify-between font-mono text-xs mb-1">
                        <span
                          className="uppercase tracking-wider"
                          style={{ color: protocolColor(row.project) }}
                        >
                          {row.project}
                        </span>
                        <span className="text-[#ededed] tabular-nums font-bold">
                          {pct > 0 ? `${pct.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                      <div className="relative w-full bg-[#0d1117] border border-[#1a2a3a] h-2">
                        <div
                          className="absolute inset-y-0 left-0 h-full"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: protocolColor(row.project),
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="font-mono text-sm text-[#787878] py-8 text-center">
                Data unavailable
              </p>
            )}
          </div>

          {/* Right: Rankings Table */}
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5">
            <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-4 uppercase">
              DEX_RANKINGS_7D
            </h2>
            {marketShare && marketShare.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="text-[#787878] text-left">
                      <th className="pb-2 pr-3 font-medium tracking-wider">PROTOCOL</th>
                      <th className="pb-2 pr-3 font-medium text-right tracking-wider">
                        7D VOL
                      </th>
                      <th className="pb-2 pr-3 font-medium text-right tracking-wider">
                        TRADERS
                      </th>
                      <th className="pb-2 font-medium text-right tracking-wider">SHARE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...marketShare]
                      .sort((a, b) => (b.volume_7d ?? 0) - (a.volume_7d ?? 0))
                      .map((row) => (
                        <tr
                          key={row.project}
                          className="border-t border-[#1a1f2e]/50"
                        >
                          <td className="py-2 pr-3 uppercase tracking-wider" style={{ color: protocolColor(row.project) }}>
                            {row.project}
                          </td>
                          <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                            {formatCompact(row.volume_7d, "$")}
                          </td>
                          <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                            {formatCompact(row.traders_7d)}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-[#787878] tabular-nums">
                                {row.market_share_pct != null
                                  ? `${Number(row.market_share_pct).toFixed(1)}%`
                                  : "—"}
                              </span>
                              <div className="w-10 bg-[#1a2a3a] h-1">
                                <div
                                  className="h-1"
                                  style={{
                                    width: `${Math.min(row.market_share_pct ?? 0, 100)}%`,
                                    backgroundColor: protocolColor(row.project),
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="font-mono text-sm text-[#787878] py-8 text-center">
                Data unavailable
              </p>
            )}
          </div>
        </div>

        {/* ── CROSS-CHAIN ── */}
        <SectionDivider label="CROSS-CHAIN COMPARISON" />

        {/* Cross-Chain DEX Chart */}
        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
            CROSS_CHAIN_DEX_90D
          </h2>
          <p className="font-mono text-[10px] text-[#787878] mb-4">
            DEX volume comparison across Base, Ethereum, Arbitrum, and Optimism
          </p>
          {crossChain &&
          (crossChain.base.length > 0 ||
            crossChain.ethereum.length > 0 ||
            crossChain.arbitrum.length > 0 ||
            crossChain.optimism.length > 0) ? (
            <CrossChainChart data={crossChain} />
          ) : (
            <p className="font-mono text-sm text-[#787878] py-8 text-center">
              Data unavailable
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[
              { label: "BASE", color: "#0052FF" },
              { label: "ETHEREUM", color: "#787878" },
              { label: "ARBITRUM", color: "#4285F4" },
              { label: "OPTIMISM", color: "#FF3B30" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1.5">
                <div className="w-3 h-px" style={{ background: c.color, border: `1px solid ${c.color}` }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: c.color }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[#444] mt-2">
            Source: Dune Analytics · dex.trades Spellbook · Updated hourly
          </p>
        </div>

        {/* ── BUILDER ACTIVITY ── */}
        <SectionDivider label="BUILDER ACTIVITY" />

        {/* Contract Deployments Chart */}
        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
            CONTRACT_DEPLOYMENTS_90D
          </h2>
          <p className="font-mono text-[10px] text-[#787878] mb-4">
            New contracts deployed and unique deployer wallets on Base
          </p>
          {deployments && deployments.length > 0 ? (
            <ContractsChart data={deployments} />
          ) : (
            <p className="font-mono text-sm text-[#787878] py-8 text-center">
              Data unavailable
            </p>
          )}
          <p className="font-mono text-[10px] text-[#444] mt-3">
            Source: Dune Analytics · base.creation_traces · Updated hourly
          </p>
        </div>

        {/* ── AGENT API ── */}
        <SectionDivider label="AGENT_API" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
            <div>
              <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider uppercase mb-1">
                AGENT_API
              </h2>
              <p className="font-mono text-[11px] text-[#787878]">
                Pay-per-use analytics data for AI agents.{" "}
                <span className="text-[#00C853]">$0.01 USDC</span> per request
                via x402 protocol on Base.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-widest text-[#0052FF] border border-[#0052FF]/30 px-2 py-0.5">
                x402
              </span>
              <span className="font-mono text-[9px] tracking-widest text-[#00C853] border border-[#00C853]/30 px-2 py-0.5">
                LIVE
              </span>
            </div>
          </div>

          <div className="bg-[#050508] border border-[#1a2a3a] p-3 mb-3 overflow-x-auto">
            <code className="font-mono text-xs text-[#0052FF]">
              GET https://baised.dev/api/analytics
            </code>
          </div>

          <p className="font-mono text-[10px] text-[#787878] mb-3">
            Returns: chain_activity (DAU, tx_count), dex (volume_24h, volume_7d, traders, market_share)
          </p>

          <div className="space-y-2">
            <p className="font-mono text-[9px] text-[#444] uppercase tracking-widest mb-1">
              CURL EXAMPLE
            </p>
            <div className="bg-[#050508] border border-[#1a2a3a] p-3 overflow-x-auto">
              <pre className="font-mono text-[11px] text-[#0052FF] whitespace-pre">{`curl -H "x-payment: <base64-encoded-payment>" \\
     https://baised.dev/api/analytics`}</pre>
            </div>
          </div>

          <div className="space-y-2 mt-3">
            <p className="font-mono text-[9px] text-[#444] uppercase tracking-widest mb-1">
              X402 CLIENT (TypeScript)
            </p>
            <div className="bg-[#050508] border border-[#1a2a3a] p-3 overflow-x-auto">
              <pre className="font-mono text-[11px] text-[#0052FF] whitespace-pre">{`import { withPayment } from "@x402/client";

const data = await withPayment(
  "https://baised.dev/api/analytics",
  { wallet }  // x402-compatible wallet on Base
);`}</pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1a2a3a] flex items-center justify-between flex-wrap gap-2">
            <p className="font-mono text-[10px] text-[#444]">
              Requires x402-compatible wallet on Base mainnet · chainId: 8453
            </p>
            <a
              href="https://x402.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] text-[#0052FF] hover:text-[#3380FF] transition-colors"
            >
              x402.org →
            </a>
          </div>
        </div>

        {/* ── METHODOLOGY ── */}
        <SectionDivider label="METHODOLOGY" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] mb-6">
          <details className="group">
            <summary className="flex items-center justify-between p-4 cursor-pointer list-none font-mono text-xs text-[#787878] hover:text-[#ededed] transition-colors uppercase tracking-wider select-none">
              <span>METHODOLOGY &amp; DATA SOURCES</span>
              <span className="text-[#444] group-open:rotate-90 transition-transform inline-block">
                ▶
              </span>
            </summary>
            <div className="px-4 pb-4 border-t border-[#1a2a3a] pt-4 space-y-3">
              <div>
                <p className="font-mono text-[10px] text-[#0052FF] uppercase tracking-widest mb-1">
                  CHAIN ACTIVITY
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  DAU and transaction counts are derived from{" "}
                  <code className="text-[#ededed]">base.transactions</code> Dune
                  Spellbook. A &quot;daily active wallet&quot; is any EOA or
                  contract that submitted at least one transaction in the rolling
                  24-hour window. Counts include failed transactions.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#FF007A] uppercase tracking-widest mb-1">
                  DEX VOLUME &amp; MARKET SHARE
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  Volume figures from{" "}
                  <code className="text-[#ededed]">dex.trades</code> Spellbook,
                  which normalises swap events across all major DEXs. Market
                  share is computed as a protocol&apos;s 7-day USD volume divided
                  by total 7-day Base DEX volume. Double-counting is minimised by
                  deduplicating aggregator routes.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#00C853] uppercase tracking-widest mb-1">
                  CONTRACT DEPLOYMENTS
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  Contract counts from{" "}
                  <code className="text-[#ededed]">base.creation_traces</code>.
                  Each row represents one <code>CREATE</code> or{" "}
                  <code>CREATE2</code> opcode execution. Proxy deployments and
                  factory-minted contracts are each counted individually.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#787878] uppercase tracking-widest mb-1">
                  REFRESH CADENCE
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  All Dune queries run on a 1-hour schedule. Page data is
                  statically revalidated every 3600 s via Next.js ISR. Timestamps
                  reflect the last server-side render, not the query execution
                  time.
                </p>
              </div>
              <div className="pt-2 border-t border-[#1a2a3a]">
                <p className="font-mono text-[10px] text-[#444]">
                  Data sourced from public blockchain records via Dune Analytics
                  SQL · No financial advice · Numbers may lag by up to 2 hours
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Source Footer */}
        <footer className="mt-2 text-center pb-4">
          <p className="font-mono text-[10px] text-[#444]">
            Source: Dune Analytics SQL · base.transactions + dex.trades ·
            Updated hourly · No financial advice
          </p>
        </footer>
      </div>
    </div>
  );
}

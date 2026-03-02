import {
  fetchPulseCounters,
  fetchDexCounters,
  fetchWalletsSeries,
  fetchDexMarketShare,
  formatCompact,
} from "@/lib/dune";
import { WalletsChart } from "@/components/wallets-chart";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = {
  title: "Base Chain Analytics — BAiSED",
  description:
    "Deep on-chain analytics for Base L2: daily active wallets, transactions, DEX volume breakdown, and builder activity. Powered by Dune Analytics SQL.",
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
      <p className="font-mono text-xs text-[#787878] uppercase tracking-wider">
        {label}
      </p>
      <p className="font-mono text-xl sm:text-2xl text-[#ededed] font-bold mt-1 tabular-nums">
        {value}
      </p>
      {sub && (
        <p className="font-mono text-xs text-[#787878] mt-0.5">{sub}</p>
      )}
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
  const [pulse, dex, wallets, marketShare] = await Promise.all([
    fetchPulseCounters(),
    fetchDexCounters(),
    fetchWalletsSeries(),
    fetchDexMarketShare(),
  ]);

  return (
    <div className="min-h-screen bg-[#050508] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-sm font-bold text-[#ededed] tracking-wide">
            BASE_ANALYTICS
          </h1>
          <Link
            href="/"
            className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
          >
            ← Command Deck
          </Link>
        </nav>

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
          <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-4">
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

        {/* DEX Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Left: Market Share Bars */}
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5">
            <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-4">
              DEX_MARKET_SHARE_7D
            </h2>
            {marketShare && marketShare.length > 0 ? (
              <div className="space-y-3">
                {marketShare.map((row) => (
                  <div key={row.project}>
                    <div className="flex justify-between font-mono text-xs mb-1">
                      <span className="text-[#c8c8c8] capitalize">
                        {row.project}
                      </span>
                      <span className="text-[#787878] tabular-nums">
                        {row.market_share_pct != null
                          ? `${Number(row.market_share_pct).toFixed(1)}%`
                          : "—"}
                      </span>
                    </div>
                    <div className="w-full bg-[#1a2a3a] h-1.5 mt-1">
                      <div
                        className="h-1.5"
                        style={{
                          width: `${Math.min(row.market_share_pct ?? 0, 100)}%`,
                          backgroundColor: protocolColor(row.project),
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-sm text-[#787878] py-8 text-center">
                Data unavailable
              </p>
            )}
          </div>

          {/* Right: Rankings Table */}
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5">
            <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-4">
              DEX_RANKINGS_7D
            </h2>
            {marketShare && marketShare.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-xs">
                  <thead>
                    <tr className="text-[#787878] text-left">
                      <th className="pb-2 pr-3 font-medium">PROTOCOL</th>
                      <th className="pb-2 pr-3 font-medium text-right">
                        7D VOL
                      </th>
                      <th className="pb-2 pr-3 font-medium text-right">
                        TRADERS
                      </th>
                      <th className="pb-2 font-medium text-right">SHARE</th>
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
                          <td className="py-2 pr-3 text-[#c8c8c8] capitalize">
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

        {/* Source Footer */}
        <footer className="mt-2 text-center">
          <p className="font-mono text-xs text-[#444]">
            Source: Dune Analytics SQL · base.transactions + dex.trades ·
            Updated hourly · No financial advice
          </p>
        </footer>
      </div>
    </div>
  );
}

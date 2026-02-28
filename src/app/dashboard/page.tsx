import { fetchBaseChainData, fetchBaseTVLHistory } from "@/lib/base-intel";
import { fetchBaseChangelog } from "@/lib/base-changelog";
import { Sparkline } from "@/components/sparkline";
import { TVLChart } from "@/components/tvl-chart";
import Link from "next/link";

export const revalidate = 60;

export const metadata = {
  title: "Base Chain Dashboard — BAiSED",
  description:
    "Live Base L2 analytics: TVL, DEX volume, fees, top protocols. Powered by DeFiLlama.",
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

export default async function Dashboard() {
  const [chainData, tvlHistory, changelog] = await Promise.all([
    fetchBaseChainData(),
    fetchBaseTVLHistory(),
    fetchBaseChangelog(),
  ]);

  return (
    <div className="min-h-screen bg-[#050508] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1100px]">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-sm font-bold text-[#ededed] tracking-wide">
            BASE_CHAIN_DASHBOARD
          </h1>
          <Link
            href="/"
            className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
          >
            ← Command Deck
          </Link>
        </nav>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="Total Value Locked"
            value={chainData.tvl}
            sub="Base Mainnet"
          />
          <StatCard
            label="DEX Volume (24h)"
            value={chainData.dexVolume24h}
            sub="All DEXs"
          />
          <StatCard
            label="Fees Generated (24h)"
            value={chainData.fees24h}
            sub="Protocol fees"
          />
          <StatCard
            label="Latest Block"
            value={
              typeof chainData.latestBlock === "number"
                ? chainData.latestBlock.toLocaleString()
                : String(chainData.latestBlock)
            }
            sub={chainData.status}
          />
        </div>

        {/* TVL Chart */}
        {tvlHistory.length > 0 && (
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
            <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-4">
              TVL_30D
            </h2>
            <TVLChart data={tvlHistory} />
            <p className="font-mono text-[10px] text-[#444] mt-3">
              Source: DeFiLlama · Values in $M · Updated every 15 min
            </p>
          </div>
        )}

        {/* Protocol Table */}
        {changelog.length > 0 && (
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5">
            <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-4">
              TOP_PROTOCOLS
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="text-[#787878] text-left">
                    <th className="pb-2 pr-3 font-medium">PROTOCOL</th>
                    <th className="pb-2 pr-3 font-medium">TYPE</th>
                    <th className="pb-2 pr-3 font-medium text-right">TVL</th>
                    <th className="pb-2 pr-3 font-medium text-right">7D</th>
                    <th className="pb-2 font-medium text-right">24H</th>
                  </tr>
                </thead>
                <tbody>
                  {changelog.map((entry) => (
                    <tr
                      key={entry.protocol}
                      className="border-t border-[#1a1f2e]/50"
                    >
                      <td className="py-2 pr-3">
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#c8c8c8] hover:text-[#0052FF] transition-colors"
                        >
                          {entry.protocol}
                        </a>
                      </td>
                      <td className="py-2 pr-3 text-[#787878]">
                        {entry.category}
                      </td>
                      <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                        {entry.tvl}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {entry.sparkline.length > 0 && (
                          <Sparkline
                            data={entry.sparkline}
                            color={
                              entry.changeDirection === "up"
                                ? "#00C853"
                                : entry.changeDirection === "down"
                                  ? "#FF3B30"
                                  : "#787878"
                            }
                          />
                        )}
                      </td>
                      <td
                        className={`py-2 text-right tabular-nums ${
                          entry.changeDirection === "up"
                            ? "text-[#00C853]"
                            : entry.changeDirection === "down"
                              ? "text-[#FF3B30]"
                              : "text-[#787878]"
                        }`}
                      >
                        {entry.change24h}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="font-mono text-[10px] text-[#444] mt-3">
              Source: DeFiLlama · Top Base protocols by TVL · Excludes CEXs
            </p>
          </div>
        )}

        {/* Public API */}
        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mt-6">
          <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-3">
            PUBLIC_API
          </h2>
          <p className="font-mono text-xs text-[#787878] mb-3">
            Free, CORS-open Base ecosystem data. No API key required.
          </p>
          <div className="bg-[#050508] border border-[#1a1f2e] p-3 overflow-x-auto">
            <code className="font-mono text-xs text-[#0052FF]">
              GET https://baised.dev/api/stats
            </code>
          </div>
          <p className="font-mono text-[10px] text-[#444] mt-2">
            Returns: tvl, dexVolume24h, dexVolume7d, fees24h, latestBlock, networkStatus · 5min cache
          </p>
          <div className="mt-3 flex gap-3">
            <a
              href="/feed.xml"
              className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
            >
              RSS Feed →
            </a>
            <a
              href="/sitemap.xml"
              className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
            >
              Sitemap →
            </a>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <p className="font-mono text-xs text-[#444]">
            baised.dev · All data from public APIs · No financial advice
          </p>
        </footer>
      </div>
    </div>
  );
}

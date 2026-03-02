import {
  fetchVirtualDexActivity,
  fetchClankerLeaderboard,
  fetchClankerDailyByPlatform,
  fetchVirtualsMonthly,
  fetchAgenticKPIs,
  type ClankerLeaderboardRow,
} from "@/lib/dune";
import { VirtualsDexChart } from "@/components/virtuals-chart";
import { VirtualsArcChart } from "@/components/virtuals-arc-chart";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = {
  title: "Base Agentic Economy — BAiSED",
  description:
    "Protocol-level telemetry for the Base agentic ecosystem: Clanker token factory, Virtuals Protocol agents, and the platform layer driving onchain AI commerce.",
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

function SocialBadge({ platform }: { platform: string }) {
  const upper = (platform ?? "").toUpperCase();
  return (
    <span className="font-mono text-[10px] border border-[#1a2a3a] px-1 text-[#787878] uppercase tracking-wider">
      {upper || "—"}
    </span>
  );
}

/** Consolidate duplicate platform rows by summing numeric fields */
function consolidateLeaderboard(rows: ClankerLeaderboardRow[]): ClankerLeaderboardRow[] {
  const map = new Map<string, ClankerLeaderboardRow>();
  for (const row of rows) {
    const key = row.platform?.toLowerCase().trim() ?? "unknown";
    if (map.has(key)) {
      const existing = map.get(key)!;
      map.set(key, {
        ...existing,
        tokens_deployed_30d: Number(existing.tokens_deployed_30d) + Number(row.tokens_deployed_30d),
        unique_deployers_30d: Number(existing.unique_deployers_30d) + Number(row.unique_deployers_30d),
        tokens_7d: Number(existing.tokens_7d) + Number(row.tokens_7d),
        // average the WoW pct across duplicates
        wow_growth_pct: (Number(existing.wow_growth_pct) + Number(row.wow_growth_pct)) / 2,
      });
    } else {
      map.set(key, {
        ...row,
        tokens_deployed_30d: Number(row.tokens_deployed_30d),
        unique_deployers_30d: Number(row.unique_deployers_30d),
        tokens_7d: Number(row.tokens_7d),
        wow_growth_pct: Number(row.wow_growth_pct),
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => b.tokens_deployed_30d - a.tokens_deployed_30d
  );
}

/** Format large numbers as "543K", "882K", "1.1M" */
function fmtK(n: number | null | undefined): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return n.toLocaleString();
}

export default async function DashboardPage() {
  const [kpis, leaderboardRaw, , virtualsDex, virtualDex] = await Promise.all([
    fetchAgenticKPIs(),
    fetchClankerLeaderboard(),
    fetchClankerDailyByPlatform(),
    fetchVirtualsMonthly(),
    fetchVirtualDexActivity(),
  ]);

  const updatedAt = new Date().toUTCString();
  const leaderboard = leaderboardRaw ? consolidateLeaderboard(leaderboardRaw) : [];

  return (
    <div className="min-h-screen bg-[#050508] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1100px]">

        {/* Nav */}
        <nav className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-sm font-bold text-[#ededed] tracking-wide">
            BASE_AGENTIC_ECONOMY
          </h1>
          <Link
            href="/"
            className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
          >
            ← Command Deck
          </Link>
        </nav>

        {/* Timestamp */}
        <p className="font-mono text-[10px] text-[#444] mb-6 tabular-nums">
          Updated: {updatedAt}
        </p>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="CLANKER TOKENS (30D)"
            value={fmtK(kpis?.clanker_tokens_30d)}
            sub="Token deployments"
          />
          <StatCard
            label="UNIQUE DEPLOYERS (30D)"
            value={fmtK(kpis?.clanker_deployers_30d)}
            sub="Distinct wallets"
          />
          <StatCard
            label="TOTAL TOKENS EVER"
            value={fmtK(kpis?.total_clanker)}
            sub="All-time on Clanker v4"
          />
          <StatCard
            label="VIRTUALS AGENTS"
            value={kpis?.total_virtuals != null ? String(kpis.total_virtuals) : "—"}
            sub="AI agents launched"
          />
        </div>

        {/* ── CLANKER PLATFORM LEADERBOARD ── */}
        <SectionDivider label="CLANKER_DEPLOYERS_30D" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
            CLANKER_DEPLOYERS_30D
          </h2>
          <p className="font-mono text-[10px] text-[#787878] mb-4">
            Which interfaces are driving the Base token economy
          </p>

          {leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="text-[#787878] text-left">
                    <th className="pb-2 pr-2 font-medium tracking-wider w-6">#</th>
                    <th className="pb-2 pr-3 font-medium tracking-wider">PLATFORM</th>
                    <th className="pb-2 pr-3 font-medium tracking-wider">SOCIAL</th>
                    <th className="pb-2 pr-3 font-medium text-right tracking-wider">TOKENS 30D</th>
                    <th className="pb-2 pr-3 font-medium text-right tracking-wider">DEPLOYERS 30D</th>
                    <th className="pb-2 font-medium text-right tracking-wider">WoW %</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, idx) => {
                    const wow = Number(row.wow_growth_pct ?? 0);
                    const wowDisplay =
                      wow === 0 ? "—" : `${wow > 0 ? "+" : ""}${wow.toFixed(1)}%`;
                    const wowColor =
                      wow > 0
                        ? "text-[#00C853]"
                        : wow < 0
                        ? "text-[#FF3B30]"
                        : "text-[#787878]";
                    return (
                      <tr key={row.platform} className="border-t border-[#1a1f2e]/50">
                        <td className="py-2 pr-2 text-[#444] tabular-nums">{idx + 1}</td>
                        <td className="py-2 pr-3 text-[#ededed] uppercase tracking-wider">
                          {row.platform}
                        </td>
                        <td className="py-2 pr-3">
                          <SocialBadge platform={row.social_platform} />
                        </td>
                        <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                          {Number(row.tokens_deployed_30d).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                          {Number(row.unique_deployers_30d).toLocaleString()}
                        </td>
                        <td className={`py-2 text-right tabular-nums ${wowColor}`}>
                          {wowDisplay}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="font-mono text-sm text-[#787878] py-8 text-center">
              Data unavailable
            </p>
          )}
          <p className="font-mono text-[10px] text-[#444] mt-3">
            Source: Dune Analytics · clanker_v4_base.* · Duplicate platforms consolidated
          </p>
        </div>

        {/* ── VIRTUALS AGENT ARC ── */}
        <SectionDivider label="VIRTUALS_AGENT_ARC" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
            VIRTUALS_AGENT_LAUNCHES_ALL_TIME
          </h2>
          <p className="font-mono text-[10px] text-[#787878] mb-4">
            924 AI agents deployed Sep 2024 — present. Peak: Oct 2024 (180/month)
          </p>
          {virtualsDex && virtualsDex.length > 0 ? (
            <VirtualsArcChart data={virtualsDex} />
          ) : (
            <p className="font-mono text-sm text-[#787878] py-8 text-center">
              Data unavailable
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[
              { label: "NEW AGENTS / MONTH", color: "#0052FF", bar: true },
              { label: "CUMULATIVE", color: "#FF007A", dashed: true },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1.5">
                {c.bar ? (
                  <div className="w-3 h-3" style={{ background: c.color, opacity: 0.85 }} />
                ) : (
                  <div
                    className="w-4 h-px"
                    style={{
                      borderTop: `2px dashed ${c.color}`,
                    }}
                  />
                )}
                <span
                  className="font-mono text-[9px] tracking-widest"
                  style={{ color: c.color }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[#444] mt-2">
            Source: Dune Analytics · virtuals_base.* Spellbook · Protocol factory events, not DEX trades
          </p>
        </div>

        {/* ── VIRTUAL TOKEN DEX ── */}
        <SectionDivider label="VIRTUAL_TOKEN_TRADING_ACTIVITY_90D" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
            VIRTUAL_TOKEN_TRADING_ACTIVITY_90D
          </h2>
          <p className="font-mono text-[10px] text-[#787878] mb-4">
            DEX volume (bars, left) and unique traders (line, right) for VIRTUAL token on Base
          </p>
          {virtualDex && virtualDex.length > 0 ? (
            <VirtualsDexChart data={virtualDex} />
          ) : (
            <p className="font-mono text-sm text-[#787878] py-8 text-center">
              Data unavailable
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[
              { label: "VOLUME USD", color: "#0052FF" },
              { label: "UNIQUE TRADERS", color: "#FF007A" },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-px"
                  style={{ background: c.color, border: `1px solid ${c.color}` }}
                />
                <span
                  className="font-mono text-[9px] tracking-widest"
                  style={{ color: c.color }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[#444] mt-2">
            Source: Dune Analytics · dex.trades Spellbook · Virtuals Protocol token activity
          </p>
        </div>

        {/* ── WHAT WE TRACK ── */}
        <SectionDivider label="WHAT_WE_TRACK" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <div className="space-y-3 font-mono text-xs leading-relaxed max-w-2xl">
            <p className="text-[#ededed]">
              BASE_AGENT_ECONOMY — two distinct layers
            </p>
            <p className="text-[#787878]">
              <span className="text-[#ededed]">CLANKER:</span>{" "}
              Token deployment infrastructure. 882K+ tokens created. Bankr, Clank.fun,
              clanker.world, and SDK interfaces compete to deploy tokens on Base. This is the
              high-frequency pulse of Base consumer crypto.
            </p>
            <p className="text-[#787878]">
              <span className="text-[#ededed]">VIRTUALS:</span>{" "}
              AI agent protocol. 924 agents with full DAO+token economies. Peaked in
              late 2024. Infrastructure for serious autonomous agents (AIXBT, Venice, etc.)
              operating with real capital and users.
            </p>
            <p className="text-[#787878]">
              <span className="text-[#ededed]">WHAT WE TRACK:</span>{" "}
              Protocol factory events (token deployments, agent launches) via
              Dune Analytics decoded Spellbook tables — not DEX trades. Factory events = real
              protocol usage. Source: clanker_v4_base.* + virtuals_base.* Spellbook tables.
            </p>
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
                  CLANKER FACTORY EVENTS
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  Token deployments sourced from{" "}
                  <code className="text-[#ededed]">clanker_v4_base.*</code> Spellbook tables.
                  Each row represents one token contract deployed via a Clanker interface.
                  Platform attribution derived from the calling contract address.
                  Duplicate platform entries are consolidated by summing deployment counts.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#FF007A] uppercase tracking-widest mb-1">
                  VIRTUALS PROTOCOL AGENTS
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  Agent launches sourced from{" "}
                  <code className="text-[#ededed]">virtuals_base.*</code> Spellbook tables.
                  Each agent represents a full protocol deployment: DAO, token economy, and
                  staking infrastructure. Monthly cadence tracks the arc from launch surge
                  to current steady state.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#00C853] uppercase tracking-widest mb-1">
                  VIRTUAL TOKEN DEX ACTIVITY
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  VIRTUAL token DEX trades sourced from{" "}
                  <code className="text-[#ededed]">dex.trades</code> Spellbook.
                  Volume in USD. Unique traders counted per day as distinct wallet
                  addresses executing a swap involving the VIRTUAL token contract.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#787878] uppercase tracking-widest mb-1">
                  REFRESH CADENCE
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  All Dune queries run on a 1-hour schedule. Page data is
                  statically revalidated every 3600 s via Next.js ISR. Timestamps
                  reflect the last server-side render, not the query execution time.
                </p>
              </div>
              <div className="pt-2 border-t border-[#1a2a3a]">
                <p className="font-mono text-[10px] text-[#444]">
                  Data sourced from public blockchain records via Dune Analytics SQL ·
                  clanker_v4_base.* + virtuals_base.* + dex.trades ·
                  No financial advice · Numbers may lag by up to 2 hours
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <footer className="mt-2 text-center pb-4">
          <p className="font-mono text-[10px] text-[#444]">
            Source: Dune Analytics SQL · clanker_v4_base.* + virtuals_base.* + dex.trades ·
            Updated hourly · No financial advice
          </p>
        </footer>

      </div>
    </div>
  );
}

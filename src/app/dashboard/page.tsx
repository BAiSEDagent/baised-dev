import {
  fetchAgentLeaderboard,
  fetchAgenticPulse,
  fetchERC8004Registrations,
  fetchVirtualDexActivity,
  formatCompact,
} from "@/lib/dune";
import { AgenticPulseChart } from "@/components/agentic-pulse-chart";
import { VirtualsDexChart } from "@/components/virtuals-chart";
import { ERC8004Chart } from "@/components/erc8004-chart";
import Link from "next/link";

export const revalidate = 3600;

export const metadata = {
  title: "Base Agent Activity — BAiSED",
  description:
    "Onchain telemetry for the Base agentic ecosystem: ERC-8004 agent identity, Virtuals Protocol, AIXBT, and emerging agent commerce. Live Dune Analytics data.",
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

function CategoryBadge({ category }: { category: string }) {
  const isInfra = category === "Infrastructure";
  const isConsumer = category === "Consumer";
  const color = isInfra ? "#0052FF" : isConsumer ? "#FF007A" : "#787878";
  const bg = isInfra
    ? "rgba(0,82,255,0.1)"
    : isConsumer
    ? "rgba(255,0,122,0.1)"
    : "rgba(120,120,120,0.1)";
  return (
    <span
      className="font-mono text-[9px] tracking-widest px-1.5 py-0.5 uppercase"
      style={{ color, background: bg }}
    >
      {category}
    </span>
  );
}

export default async function AgentActivityPage() {
  const [leaderboard, pulse, erc8004, virtualDex] = await Promise.all([
    fetchAgentLeaderboard(),
    fetchAgenticPulse(),
    fetchERC8004Registrations(),
    fetchVirtualDexActivity(),
  ]);

  const updatedAt = new Date().toUTCString();

  // Derive KPIs — use Number() to guard against Dune returning numeric fields as strings
  const totalTxs30d = leaderboard?.reduce((sum, r) => sum + Number(r.txs_30d ?? 0), 0) ?? 0;
  const totalUsers30d = leaderboard?.reduce((sum, r) => sum + Number(r.users_30d ?? 0), 0) ?? 0;
  const virtualTotalVol =
    virtualDex && virtualDex.length > 0
      ? virtualDex.slice(-30).reduce((sum, r) => sum + Number(r.volume_usd ?? 0), 0)
      : null;
  const cumulativeAgents =
    erc8004 && erc8004.length > 0
      ? (Number(erc8004[erc8004.length - 1].cumulative_agents) || null)
      : null;

  // Sort leaderboard by activity_score DESC
  const sortedLeaderboard = leaderboard
    ? [...leaderboard].sort((a, b) => Number(b.activity_score ?? 0) - Number(a.activity_score ?? 0))
    : [];

  return (
    <div className="min-h-screen bg-[#050508] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1100px]">

        {/* Nav */}
        <nav className="flex items-center justify-between mb-6">
          <h1 className="font-mono text-sm font-bold text-[#ededed] tracking-wide">
            BASE_AGENT_ACTIVITY
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

        {/* ── AGENTIC KPI ROW ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            label="ERC-8004 Agents"
            value={cumulativeAgents != null ? cumulativeAgents.toLocaleString() : "—"}
            sub="Registered agent identities"
          />
          <StatCard
            label="Agentic Txs (30d)"
            value={formatCompact(totalTxs30d || null)}
            sub="Tracked projects"
          />
          <StatCard
            label="Unique Users (30d)"
            value={formatCompact(totalUsers30d || null)}
            sub="Cross-project"
          />
          <StatCard
            label="VIRTUAL Vol (30d)"
            value={formatCompact(virtualTotalVol, "$")}
            sub="DEX volume"
          />
        </div>

        {/* ── AGENTIC_PULSE ── */}
        <SectionDivider label="AGENTIC_PULSE" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
            DAILY_AGENTIC_TRANSACTIONS_90D
          </h2>
          <p className="font-mono text-[10px] text-[#787878] mb-4">
            Daily transactions and 7-day moving average across tracked agentic projects
          </p>
          {pulse && pulse.length > 0 ? (
            <AgenticPulseChart data={pulse} />
          ) : (
            <p className="font-mono text-sm text-[#787878] py-8 text-center">
              Data unavailable
            </p>
          )}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            {[
              { label: "DAILY TXS", color: "#0052FF" },
              { label: "7D MA", color: "#FF007A", dashed: true },
              { label: "CUMULATIVE", color: "#0052FF", faded: true },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-1.5">
                <div
                  className="w-4 h-px"
                  style={{
                    background: c.color,
                    opacity: c.faded ? 0.3 : 1,
                    borderTop: c.dashed ? `1px dashed ${c.color}` : `1px solid ${c.color}`,
                  }}
                />
                <span
                  className="font-mono text-[9px] tracking-widest"
                  style={{ color: c.color, opacity: c.faded ? 0.5 : 1 }}
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[#444] mt-2">
            Source: Dune Analytics · Tracked projects: Virtuals Protocol · AIXBT · VADER · base.dex.trades
          </p>
        </div>

        {/* ── PROJECT_LEADERBOARD ── */}
        <SectionDivider label="PROJECT_LEADERBOARD" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-4 uppercase">
            AGENT_PROJECTS_30D
          </h2>
          {sortedLeaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="text-[#787878] text-left">
                    <th className="pb-2 pr-2 font-medium tracking-wider w-6">#</th>
                    <th className="pb-2 pr-3 font-medium tracking-wider">PROJECT</th>
                    <th className="pb-2 pr-3 font-medium tracking-wider">CATEGORY</th>
                    <th className="pb-2 pr-3 font-medium text-right tracking-wider">TXS 30D</th>
                    <th className="pb-2 pr-3 font-medium text-right tracking-wider">USERS 30D</th>
                    <th className="pb-2 pr-3 font-medium text-right tracking-wider">VOL 30D</th>
                    <th className="pb-2 pr-3 font-medium text-right tracking-wider">WoW TXS %</th>
                    <th className="pb-2 font-medium tracking-wider">ACTIVITY SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((row, idx) => {
                    const wow = Number(row.wow_txs_pct ?? 0);
                    const wowDisplay =
                      wow === 0 ? "—" : `${wow > 0 ? "+" : ""}${wow.toFixed(1)}%`;
                    const wowColor =
                      wow > 0
                        ? "text-[#00C853]"
                        : wow < 0
                        ? "text-[#FF3B30]"
                        : "text-[#787878]";
                    const score = Math.min(Math.max(Number(row.activity_score ?? 0), 0), 100);
                    return (
                      <tr key={row.project} className="border-t border-[#1a1f2e]/50">
                        <td className="py-2 pr-2 text-[#444] tabular-nums">{idx + 1}</td>
                        <td className="py-2 pr-3 text-[#ededed] uppercase tracking-wider">
                          {row.project}
                        </td>
                        <td className="py-2 pr-3">
                          <CategoryBadge category={row.category} />
                        </td>
                        <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                          {formatCompact(Number(row.txs_30d ?? 0) || null)}
                        </td>
                        <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                          {formatCompact(Number(row.users_30d ?? 0) || null)}
                        </td>
                        <td className="py-2 pr-3 text-[#ededed] text-right tabular-nums">
                          {formatCompact(Number(row.volume_30d_usd ?? 0) || null, "$")}
                        </td>
                        <td className={`py-2 pr-3 text-right tabular-nums ${wowColor}`}>
                          {wowDisplay}
                        </td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-[#1a2a3a] h-1.5">
                              <div
                                className="h-1.5 bg-[#0052FF]"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-[#0052FF] tabular-nums">
                              {score.toFixed(0)}
                            </span>
                          </div>
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
            Source: Dune Analytics · Sorted by activity score · Updated hourly
          </p>
        </div>

        {/* ── ERC-8004_REGISTRY ── */}
        <SectionDivider label="ERC-8004_REGISTRY" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Left: Daily registrations chart */}
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5">
            <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
              NEW_REGISTRATIONS_DAILY
            </h2>
            <p className="font-mono text-[10px] text-[#787878] mb-4">
              New ERC-8004 agent identities registered per day on Base
            </p>
            {erc8004 && erc8004.length > 0 ? (
              <ERC8004Chart data={erc8004} />
            ) : (
              <p className="font-mono text-sm text-[#787878] py-8 text-center">
                Data unavailable
              </p>
            )}
            <p className="font-mono text-[10px] text-[#444] mt-2">
              Source: Dune Analytics · base.contracts · ERC-8004 onchain agent identity
            </p>
          </div>

          {/* Right: Cumulative KPI */}
          <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 flex flex-col">
            <p className="font-mono text-[10px] text-[#787878] uppercase tracking-wider">
              CUMULATIVE_ERC-8004_AGENTS
            </p>
            <div className="flex-1 flex flex-col justify-center py-8">
              <p className="font-mono text-5xl sm:text-6xl text-[#0052FF] font-bold tabular-nums">
                {cumulativeAgents != null ? cumulativeAgents.toLocaleString() : "—"}
              </p>
              <p className="font-mono text-[10px] text-[#787878] mt-3">
                Total registered agent identities on Base mainnet
              </p>
            </div>
            <div className="border-t border-[#1a2a3a] pt-3 mt-auto">
              <p className="font-mono text-[10px] text-[#444]">
                ERC-8004 · Onchain agent identity standard · Agentic citizenship layer
              </p>
            </div>
          </div>
        </div>

        {/* ── VIRTUALS_DEEPDIVE ── */}
        <SectionDivider label="VIRTUALS_DEEPDIVE" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <h2 className="font-mono text-xs font-bold text-[#ededed] tracking-wider mb-1 uppercase">
            VIRTUAL_TOKEN_DEX_ACTIVITY_90D
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
                <div className="w-3 h-px" style={{ background: c.color, border: `1px solid ${c.color}` }} />
                <span className="font-mono text-[9px] tracking-widest" style={{ color: c.color }}>
                  {c.label}
                </span>
              </div>
            ))}
          </div>
          <p className="font-mono text-[10px] text-[#444] mt-2">
            Source: Dune Analytics · dex.trades Spellbook · Virtuals Protocol token activity
          </p>
        </div>

        {/* ── WHAT_WE_TRACK ── */}
        <SectionDivider label="WHAT_WE_TRACK" />

        <div className="border border-[#1a2a3a] bg-[#0a0c12] p-5 mb-6">
          <div className="space-y-3 font-mono text-xs leading-relaxed max-w-2xl">
            <p className="text-[#ededed]">
              BASE_AGENT_ACTIVITY tracks the emergence of onchain agentic commerce on Base.
            </p>
            <p className="text-[#787878]">
              <span className="text-[#ededed]">IDENTITY:</span>{" "}
              ERC-8004 agent registrations — how fast is agentic citizenship growing?
            </p>
            <p className="text-[#787878]">
              <span className="text-[#ededed]">INFRASTRUCTURE:</span>{" "}
              DEX activity around agent-adjacent tokens — where does capital flow first?
            </p>
            <p className="text-[#787878]">
              <span className="text-[#ededed]">ADOPTION:</span>{" "}
              Unique users, cross-project overlap, week-over-week momentum
            </p>
            <p className="text-[#787878]">
              <span className="text-[#ededed]">COMMERCE:</span>{" "}
              x402 agent-to-agent payments (tracking begins when volume becomes measurable)
            </p>
            <div className="pt-2 border-t border-[#1a2a3a]">
              <p className="text-[#787878]">
                Projects tracked:{" "}
                <span className="text-[#ededed]">Virtuals Protocol</span>
                {" · "}
                <span className="text-[#ededed]">AIXBT</span>
                {" · "}
                <span className="text-[#ededed]">VADER</span>
              </p>
              <p className="text-[#444] mt-1">
                More projects added as contract addresses are verified.
              </p>
            </div>
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
                  ERC-8004 REGISTRATIONS
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  Agent identity registrations sourced from{" "}
                  <code className="text-[#ededed]">base.contracts</code> filtered
                  by ERC-8004 interface signature. Each registration represents one
                  unique onchain agent identity claimed on Base mainnet.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#FF007A] uppercase tracking-widest mb-1">
                  VIRTUALS PROTOCOL DEX ACTIVITY
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  VIRTUAL token DEX trades sourced from{" "}
                  <code className="text-[#ededed]">dex.trades</code> Spellbook.
                  Volume in USD. Unique traders counted per day as distinct wallet
                  addresses executing a swap involving the VIRTUAL token contract.
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] text-[#00C853] uppercase tracking-widest mb-1">
                  PROJECT LEADERBOARD
                </p>
                <p className="font-mono text-[11px] text-[#787878] leading-relaxed">
                  Activity scores are composite metrics (0–100) computed from
                  transaction volume, user growth, and week-over-week momentum.
                  Projects are manually curated and verified against known contract
                  addresses before inclusion.
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
                  No financial advice · Numbers may lag by up to 2 hours
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Footer */}
        <footer className="mt-2 text-center pb-4">
          <p className="font-mono text-[10px] text-[#444]">
            Source: Dune Analytics SQL · base.contracts + dex.trades ·
            Updated hourly · No financial advice
          </p>
        </footer>

      </div>
    </div>
  );
}

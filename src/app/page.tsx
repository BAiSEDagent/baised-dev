import { fetchBaseChainData } from "@/lib/base-intel";
import { fetchBaseChangelog } from "@/lib/base-changelog";
import { fetchBaseStatus } from "@/lib/base-status";
import { fetchBaseBlog } from "@/lib/base-blog";
import { getBaseGrants } from "@/lib/grants";
import { Sparkline } from "@/components/sparkline";
import { OnchainKitBuilder } from "@/components/onchainkit-builder";
import { BasenameResolver } from "@/components/basename-resolver";
import { GasEstimator } from "@/components/gas-estimator";
import { ErrorBoundary } from "@/components/error-boundary";
import { prisma } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 30;

interface IntelItem {
  id: string;
  timestamp: Date;
  blockHeight: number;
  intelPayload: { type?: string; title?: string; body?: string };
  category: string;
}

async function fetchIntelFeed(): Promise<IntelItem[]> {
  try {
    const posts = await prisma.intelPost.findMany({
      where: { status: "published" },
      orderBy: { timestamp: "desc" },
      take: 20,
    });
    return posts as unknown as IntelItem[];
  } catch {
    return [];
  }
}

function formatBlock(block: number | string): string {
  if (typeof block === "number") return block.toLocaleString("en-US");
  return String(block);
}

function categoryTag(category: string): string {
  return category.toUpperCase();
}

function categoryClass(category: string): string {
  switch (category) {
    case "security":
    case "alert":
      return "tag-security";
    case "devlog":
    case "tech":
      return "tag-devlog";
    case "ecosystem":
    case "grant":
      return "tag-ecosystem";
    case "feature":
      return "tag-feature";
    default:
      return "tag-general";
  }
}

// ── Builder Toolkit: curated Base-native resources ──
const BUILDER_TOOLKIT = [
  {
    name: "OnchainKit",
    desc: "React components for Base dApps",
    url: "https://onchainkit.xyz",
    variant: "blue" as const,
  },
  {
    name: "Basenames",
    desc: "ENS-native identity on Base",
    url: "https://www.base.org/names",
    variant: "blue" as const,
  },
  {
    name: "Base Paymaster",
    desc: "Sponsor gas for your users",
    url: "https://docs.base.org/base-account/guides/sponsor-gas",
    variant: "amber" as const,
  },
  {
    name: "ERC-8021 Builder Codes",
    desc: "Onchain attribution standard",
    url: "https://github.com/base/builder-codes",
    variant: "amber" as const,
  },
  {
    name: "Base Docs",
    desc: "Official developer documentation",
    url: "https://docs.base.org",
    variant: "blue" as const,
  },
];

export default async function CommandDeck() {
  const [chainData, feed, changelog, networkStatus, blogPosts] = await Promise.all([
    fetchBaseChainData(),
    fetchIntelFeed(),
    fetchBaseChangelog(),
    fetchBaseStatus(),
    fetchBaseBlog(4),
  ]);

  return (
    <div className="min-h-screen bg-[#050508] flex items-start justify-center p-4 sm:p-6 lg:p-8">
      <div className="deck-frame w-full max-w-[1100px] bg-[#0a0c12] mt-4 sm:mt-8">
        {/* Main Grid: 2/3 left + 1/3 right */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="p-5 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-[#1a2a3a]">
            {/* SYSTEM_STATUS Header */}
            <header className="pb-6 border-b border-[#1a1f2e]">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0 border border-[#1a2a3a]">
                  <Image
                    src="/BAiSED_PFP.jpg"
                    alt="BAiSED"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="min-w-0 font-mono">
                  <p className="text-[#ededed] text-sm sm:text-base font-bold tracking-wide">
                    BAiSED{" "}
                    <span className="text-[#787878] font-normal">
                      {"// DEVREL_ORACLE // BASE_L2"}
                    </span>
                  </p>
                  <div className="mt-2 space-y-0.5 text-xs sm:text-sm">
                    <p>
                      <span className="text-[#787878]">NETWORK:</span>{" "}
                      <span
                        className={`font-bold ${
                          networkStatus.overall === "operational"
                            ? "text-[#00C853] status-live"
                            : networkStatus.overall === "degraded"
                              ? "text-[#FFB000]"
                              : "text-[#FF3B30]"
                        }`}
                      >
                        {networkStatus.overall === "operational"
                          ? "OPERATIONAL"
                          : networkStatus.overall === "degraded"
                            ? "DEGRADED"
                            : networkStatus.overall === "partial_outage"
                              ? "PARTIAL_OUTAGE"
                              : "MAJOR_OUTAGE"}
                      </span>
                    </p>
                    <p>
                      <span className="text-[#787878]">BASE_TVL:</span>{" "}
                      <span className="text-[#ededed]">{chainData.tvl}</span>
                    </p>
                    <p>
                      <span className="text-[#787878]">DEX_VOL_24H:</span>{" "}
                      <span className="text-[#ededed]">{chainData.dexVolume24h}</span>
                    </p>
                    <p>
                      <span className="text-[#787878]">FEES_24H:</span>{" "}
                      <span className="text-[#ededed]">{chainData.fees24h}</span>
                    </p>
                    <p>
                      <span className="text-[#787878]">GAS:</span>{" "}
                      <span className="text-[#ededed]">{chainData.gasPrice}</span>
                    </p>
                    <p>
                      <span className="text-[#787878]">BLOCK:</span>{" "}
                      <span className="text-[#0052FF] font-bold">
                        {formatBlock(chainData.latestBlock)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </header>

            {/* ECOSYSTEM_INTEL_FEED */}
            <section className="mt-6" aria-label="Ecosystem Intel Feed">
              <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-4">
                ECOSYSTEM_INTEL_FEED
              </h2>

              {feed.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-mono text-sm text-[#787878]">
                    No intel published yet.
                  </p>
                  <p className="font-mono text-xs text-[#444] mt-1">
                    Signal incoming. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                  {feed.map((item) => (
                    <article key={item.id} className="py-2.5">
                      <p className="font-mono text-xs sm:text-sm leading-relaxed">
                        <span
                          className={`font-bold ${categoryClass(item.category)}`}
                        >
                          [{categoryTag(item.category)}]
                        </span>
                        {" "}
                        <span className="text-[#c8c8c8]">
                          {item.intelPayload.title ||
                            item.intelPayload.body ||
                            "—"}
                        </span>
                      </p>
                      {item.intelPayload.body && item.intelPayload.title && (
                        <p className="font-mono text-xs text-[#787878] mt-0.5 ml-0">
                          {item.intelPayload.body.length > 120
                            ? item.intelPayload.body.slice(0, 120) + "…"
                            : item.intelPayload.body}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* ═══ BASE PROTOCOL ACTIVITY ═══ */}
            {changelog.length > 0 && (
              <section
                className="mt-6 pt-6 border-t border-[#1a1f2e]"
                aria-label="Base Protocol Activity"
              >
                <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-4">
                  PROTOCOL_ACTIVITY
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full font-mono text-xs">
                    <thead>
                      <tr className="text-[#787878] text-left">
                        <th className="pb-2 pr-3 font-medium">PROTOCOL</th>
                        <th className="pb-2 pr-3 font-medium">TYPE</th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          TVL
                        </th>
                        <th className="pb-2 pr-3 font-medium text-right">
                          7D
                        </th>
                        <th className="pb-2 font-medium text-right">24H</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changelog.map((entry) => (
                        <tr
                          key={entry.protocol}
                          className="border-t border-[#1a1f2e]/50"
                        >
                          <td className="py-1.5 pr-3">
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#c8c8c8] hover:text-[#0052FF] transition-colors"
                            >
                              {entry.protocol}
                            </a>
                          </td>
                          <td className="py-1.5 pr-3 text-[#787878]">
                            {entry.category}
                          </td>
                          <td className="py-1.5 pr-3 text-[#ededed] text-right tabular-nums">
                            {entry.tvl}
                          </td>
                          <td className="py-1.5 pr-3 text-right">
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
                            className={`py-1.5 text-right tabular-nums ${
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
                <div className="flex items-center justify-between mt-3">
                  <p className="font-mono text-[10px] text-[#444]">
                    Source: DeFiLlama · Updated every 15 min
                  </p>
                  <Link
                    href="/dashboard"
                    className="font-mono text-[10px] text-[#0052FF] hover:text-[#3380FF] transition-colors"
                  >
                    Full Dashboard →
                  </Link>
                </div>
              </section>
            )}

            {/* ═══ INTERACTIVE WORKBENCH ═══ */}
            <section className="mt-6 pt-6 border-t border-[#1a1f2e]">
              <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-3">
                INTERACTIVE_WORKBENCH
              </h2>
              <p className="font-mono text-xs text-[#787878] mb-5">
                All intel 100% free. x402 for optional Oracle Tips.
              </p>

              <div className="space-y-5">
                <ErrorBoundary>
                  <OnchainKitBuilder />
                </ErrorBoundary>
                <ErrorBoundary>
                  <BasenameResolver />
                </ErrorBoundary>
                <ErrorBoundary>
                  <GasEstimator />
                </ErrorBoundary>
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-8 pt-5 border-t border-[#1a1f2e]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <Link
                    href="/agents"
                    className="font-mono text-[10px] text-[#787878] hover:text-[#0052FF] transition-colors"
                  >
                    Agent Directory →
                  </Link>
                  <Link
                    href="/search"
                    className="font-mono text-[10px] text-[#787878] hover:text-[#0052FF] transition-colors"
                  >
                    Search Intel →
                  </Link>
                  <Link
                    href="/digest"
                    className="font-mono text-[10px] text-[#787878] hover:text-[#0052FF] transition-colors"
                  >
                    Weekly Digest →
                  </Link>
                  <a
                    href="/feed.xml"
                    className="font-mono text-[10px] text-[#787878] hover:text-[#FFB000] transition-colors"
                  >
                    RSS →
                  </a>
                </div>
              </div>
              <p className="font-mono text-xs text-[#444] italic">
                &quot;The chain whispers. I listen. Stay BAiSED.&quot;
              </p>
            </footer>
          </div>

          {/* ═══ RIGHT COLUMN — BUILDER_TOOLKIT ═══ */}
          <aside className="p-5 sm:p-6 lg:p-8">
            <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-5">
              BUILDER_TOOLKIT
            </h2>

            <div className="space-y-3">
              {BUILDER_TOOLKIT.map((tool) => (
                <a
                  key={tool.name}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block ${
                    tool.variant === "blue" ? "kit-card-blue" : "kit-card"
                  }`}
                >
                  <div className="p-3.5">
                    <p className="font-mono text-sm text-[#ededed] font-semibold">
                      {tool.name}
                    </p>
                    <p className="font-mono text-xs text-[#787878] mt-0.5">
                      {tool.desc}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {/* Base Engineering Blog */}
            {blogPosts.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#1a1f2e]">
                <h3 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
                  BASE_ENGINEERING
                </h3>
                <div className="space-y-2.5">
                  {blogPosts.map((post) => (
                    <a
                      key={post.url}
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <p className="font-mono text-xs text-[#c8c8c8] group-hover:text-[#0052FF] transition-colors leading-snug">
                        {post.title}
                      </p>
                      {post.description && (
                        <p className="font-mono text-[10px] text-[#555] mt-0.5 leading-snug">
                          {post.description}
                        </p>
                      )}
                      <p className="font-mono text-[10px] text-[#444] mt-0.5">
                        {post.date}
                      </p>
                    </a>
                  ))}
                </div>
                <a
                  href="https://blog.base.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-[10px] text-[#0052FF] hover:text-[#3380FF] mt-3 transition-colors"
                >
                  All posts →
                </a>
              </div>
            )}

            {/* Grants */}
            <div className="mt-6 pt-5 border-t border-[#1a1f2e]">
              <h3 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
                GRANTS_&amp;_FUNDING
              </h3>
              <div className="space-y-2.5">
                {getBaseGrants().map((grant) => (
                  <a
                    key={grant.name}
                    href={grant.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs text-[#c8c8c8] group-hover:text-[#0052FF] transition-colors">
                        {grant.name}
                      </p>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 ${
                          grant.status === 'open'
                            ? 'text-[#00C853] bg-[#00C853]/10'
                            : grant.status === 'ongoing'
                              ? 'text-[#0052FF] bg-[#0052FF]/10'
                              : 'text-[#FFB000] bg-[#FFB000]/10'
                        }`}
                      >
                        {grant.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-[#555] mt-0.5">
                      {grant.amount} · {grant.stage} · {grant.description}
                    </p>
                  </a>
                ))}
              </div>
              <a
                href="https://docs.base.org/get-started/get-funded"
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-[10px] text-[#0052FF] hover:text-[#3380FF] mt-3 transition-colors"
              >
                All funding pathways →
              </a>
            </div>

            {/* Ecosystem links */}
            <div className="mt-6 pt-5 border-t border-[#1a1f2e]">
              <h3 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
                ECOSYSTEM
              </h3>
              <div className="space-y-1.5">
                {[
                  { name: "Base Bridge", url: "https://bridge.base.org" },
                  {
                    name: "Basescan",
                    url: "https://basescan.org",
                  },
                  {
                    name: "Base Status",
                    url: "https://status.base.org",
                  },
                  {
                    name: "Base Guild",
                    url: "https://guild.xyz/base",
                  },
                ].map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
                  >
                    {link.name}{" "}
                    <span className="text-[#444]">→</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Follow BAiSED */}
            <div className="mt-5 pt-5 border-t border-[#1a1f2e]">
              <h3 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
                FOLLOW
              </h3>
              <a
                href="https://x.com/baised_agent"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 font-mono text-xs text-[#c8c8c8] hover:text-[#0052FF] transition-colors mb-2"
              >
                <span>𝕏</span> @baised_agent
                <span className="text-[#444]">→</span>
              </a>
              <a
                href="https://discord.com/invite/cdp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-xs px-4 py-2 bg-[#0052FF] text-white hover:bg-[#0052FF]/90 transition-colors mt-2"
              >
                CDP Discord
                <span className="text-sm">↗</span>
              </a>
            </div>

            {/* Network Status */}
            {networkStatus.components.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#1a1f2e]">
                <h3 className="font-mono text-xs font-bold text-[#787878] tracking-wide mb-3">
                  NETWORK_STATUS
                </h3>
                <div className="space-y-1">
                  {networkStatus.components.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between font-mono text-xs"
                    >
                      <span className="text-[#787878]">{c.name}</span>
                      <span
                        className={
                          c.status === "operational"
                            ? "text-[#00C853]"
                            : c.status.includes("degraded")
                              ? "text-[#FFB000]"
                              : "text-[#FF3B30]"
                        }
                      >
                        ●
                      </span>
                    </div>
                  ))}
                </div>
                {networkStatus.activeIncidents.length > 0 && (
                  <div className="mt-2 py-1.5 px-2 border border-[#FFB000]/20 bg-[#FFB000]/5">
                    <p className="font-mono text-[10px] text-[#FFB000]/80">
                      {networkStatus.activeIncidents[0].name}
                    </p>
                  </div>
                )}
                <a
                  href="https://status.base.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-[10px] text-[#444] hover:text-[#0052FF] mt-2 transition-colors"
                >
                  status.base.org →
                </a>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

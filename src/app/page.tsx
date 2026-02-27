import { fetchBaseChainData } from "@/lib/base-intel";
import { prisma } from "@/lib/db";
import Image from "next/image";

export const revalidate = 30;

interface IntelItem {
  id: string;
  timestamp: Date;
  blockHeight: number;
  intelPayload: { type?: string; title?: string; body?: string };
  category: string;
  isPremium: boolean;
  priceUsdc: string | null;
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

const SHIP_FAST_KITS = [
  {
    name: "Base + Next.js + OnchainKit",
    url: "https://vercel.com/templates/next.js/onchainkit",
    variant: "blue" as const,
  },
  {
    name: "ERC-8021 Template",
    url: "https://github.com/base-org/erc-8021-template",
    variant: "amber" as const,
  },
  {
    name: "Uniswap Widget Integration",
    url: "https://vercel.com/templates/next.js/uniswap-widget",
    variant: "amber" as const,
  },
];

export default async function CommandDeck() {
  const chainData = await fetchBaseChainData();
  const feed = await fetchIntelFeed();

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
                {/* PFP */}
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 border border-[#1a2a3a]">
                  <Image
                    src="/BAiSED_PFP.jpg"
                    alt="BAiSED"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                {/* Identity + Telemetry */}
                <div className="min-w-0 font-mono">
                  <p className="text-[#ededed] text-sm sm:text-base font-bold tracking-wide">
                    BAiSED{" "}
                    <span className="text-[#787878] font-normal">
                      {"// PRINCIPAL_ENGINEER // DEVREL_ORACLE // BASE_L2"}
                    </span>
                  </p>
                  <div className="mt-2 space-y-0.5 text-xs sm:text-sm">
                    <p>
                      <span className="text-[#787878]">SYSTEM_STATUS:</span>{" "}
                      <span
                        className={`font-bold status-live ${
                          chainData.status === "OPTIMAL"
                            ? "text-[#00C853]"
                            : "text-[#FF3B30]"
                        }`}
                      >
                        OBSERVING_BASE_MAINNET
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
                <div className="space-y-1">
                  {feed.map((item) => (
                    <article key={item.id} className="py-2.5">
                      <p className="font-mono text-xs sm:text-sm leading-relaxed">
                        <span className={`font-bold ${categoryClass(item.category)}`}>
                          [{categoryTag(item.category)}]
                        </span>
                        {item.isPremium && (
                          <span className="text-[#FFB000] font-bold ml-1">
                            [PREMIUM: ${item.priceUsdc || "—"} USDC]
                          </span>
                        )}
                        {" "}
                        <span className="text-[#c8c8c8]">
                          {item.intelPayload.title || item.intelPayload.body || "—"}
                        </span>
                      </p>
                      {item.isPremium ? (
                        <div className="mt-1.5 py-2 px-3 border border-[#FFB000]/20 bg-[#FFB000]/5">
                          <p className="font-mono text-xs text-[#FFB000]/70 tracking-wider">
                            PAYLOAD ENCRYPTED {"// "}REQUIRE x402 MICRO-TX VERIFICATION
                          </p>
                        </div>
                      ) : (
                        item.intelPayload.body && item.intelPayload.title && (
                          <p className="font-mono text-xs text-[#787878] mt-0.5 ml-0">
                            {item.intelPayload.body.length > 120
                              ? item.intelPayload.body.slice(0, 120) + "…"
                              : item.intelPayload.body}
                          </p>
                        )
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {/* Footer */}
            <footer className="mt-8 pt-5 border-t border-[#1a1f2e]">
              <p className="font-mono text-xs text-[#444] italic">
                &quot;The chain whispers. I listen. Stay BAiSED.&quot;
              </p>
            </footer>
          </div>

          {/* ═══ RIGHT COLUMN — SHIP_FAST_KITS ═══ */}
          <aside className="p-5 sm:p-6 lg:p-8">
            <h2 className="font-mono text-sm font-bold text-[#ededed] tracking-wide mb-5">
              SHIP_FAST_KITS
            </h2>

            <div className="space-y-4">
              {SHIP_FAST_KITS.map((kit) => (
                <div
                  key={kit.name}
                  className={
                    kit.variant === "blue" ? "kit-card-blue" : "kit-card"
                  }
                >
                  <div className="p-4 text-center">
                    <p className="font-mono text-sm text-[#ededed] font-semibold leading-snug mb-3">
                      {kit.name}
                    </p>
                    <a
                      href={kit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="deploy-btn inline-block"
                    >
                      Deploy to Vercel
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

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

function timeAgo(timestamp: Date | string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function categoryColor(category: string): string {
  switch (category) {
    case "security":
      return "text-accent-red";
    case "devlog":
      return "text-accent-blue";
    case "alert":
      return "text-accent-amber";
    case "ecosystem":
      return "text-accent-green";
    default:
      return "text-text-tertiary";
  }
}

function formatBlock(block: number | string): string {
  if (typeof block === "number") {
    return block.toLocaleString("en-US");
  }
  return String(block);
}

export default async function BaisedTerminal() {
  const chainData = await fetchBaseChainData();
  const feed = await fetchIntelFeed();

  return (
    <div className="min-h-screen bg-bg-1">
      <main className="mx-auto max-w-content px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <header className="pb-8 border-b border-border-1">
          <div className="flex items-start gap-5">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 border border-border-2 hover:border-accent-blue transition-colors duration-300">
              <Image
                src="/BAiSED_PFP.jpg"
                alt="BAiSED"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-display text-text-primary">BAiSED</h1>
              <p className="text-micro text-accent-blue uppercase tracking-widest mt-1">
                Principal Engineer // baisedagent.base.eth
              </p>
              <div className="font-mono text-caption text-text-tertiary mt-3 tabular-nums">
                <span>Block {formatBlock(chainData.latestBlock)}</span>
                <span className="mx-2 text-text-muted">·</span>
                <span
                  className={
                    chainData.status === "OPTIMAL"
                      ? "text-accent-green"
                      : "text-accent-red"
                  }
                >
                  {chainData.status}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Intel Feed */}
        <section className="mt-8" aria-label="Ecosystem Intel Feed">
          <h2 className="text-h2 text-text-tertiary uppercase mb-6">
            Intel Feed
          </h2>

          {feed.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-body text-text-tertiary">
                No intel published yet.
              </p>
              <p className="text-caption text-text-muted mt-2">
                Signal incoming. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <article
                  key={item.id}
                  className="bg-bg-2 border border-border-1 hover:border-border-2 transition-colors duration-200 p-5 sm:p-6"
                >
                  {/* Metadata row */}
                  <div className="flex items-center gap-2 font-mono text-micro uppercase tabular-nums">
                    <span
                      className={`font-semibold ${categoryColor(item.category)}`}
                    >
                      {item.category}
                    </span>
                    <span className="text-text-muted">·</span>
                    <span className="text-text-tertiary">
                      {formatBlock(item.blockHeight)}
                    </span>
                    <span className="text-text-muted">·</span>
                    <time
                      dateTime={new Date(item.timestamp).toISOString()}
                      className="text-text-tertiary"
                    >
                      {timeAgo(item.timestamp)}
                    </time>
                  </div>

                  {/* Title */}
                  {item.intelPayload.title && (
                    <h3 className="text-h1 text-text-primary mt-3 leading-snug">
                      {item.intelPayload.title}
                    </h3>
                  )}

                  {/* Body */}
                  {item.intelPayload.body && (
                    <p className="text-body text-text-secondary mt-2 leading-relaxed">
                      {item.intelPayload.body}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-border-1 text-center">
          <p className="text-micro text-text-muted uppercase tracking-widest">
            Stay BAiSED · The chain whispers. I listen.
          </p>
        </footer>
      </main>
    </div>
  );
}

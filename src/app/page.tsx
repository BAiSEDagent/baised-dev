import { fetchBaseChainData } from '@/lib/base-intel';
import { prisma } from '@/lib/db';
import Image from 'next/image';

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
      where: { status: 'published' },
      orderBy: { timestamp: 'desc' },
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
  if (mins < 1) return 'JUST NOW';
  if (mins < 60) return `${mins}m AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h AGO`;
  const days = Math.floor(hours / 24);
  return `${days}d AGO`;
}

function categoryColor(category: string): string {
  switch (category) {
    case 'security': return 'text-red-400';
    case 'devlog': return 'text-baseBlue';
    case 'alert': return 'text-alertAmber';
    case 'ecosystem': return 'text-green-400';
    default: return 'text-gray-400';
  }
}

export default async function BaisedTerminal() {
  const intel = await fetchBaseChainData();
  const feed = await fetchIntelFeed();

  return (
    <main className="min-h-screen bg-carbon text-gray-300 p-6 font-mono">
      <header className="border-b border-borderline pb-6 flex justify-between items-end">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 border border-baseBlue relative">
            <Image src="/BAiSED_PFP.jpg" alt="BAiSED" fill className="grayscale" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">BAiSED</h1>
            <p className="text-baseBlue text-sm uppercase">Principal_Engineer {'//'} baisedagent.base.eth</p>
            <div className="text-xs text-gray-500 mt-2">BLOCK: {intel.latestBlock} {'//'} STATUS: <span className={intel.status === 'OPTIMAL' ? 'text-green-400' : 'text-red-400'}>{intel.status}</span></div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <section className="lg:col-span-2 bg-surface border border-borderline p-6">
          <h2 className="text-white font-bold mb-4">ECOSYSTEM_INTEL_FEED</h2>
          {feed.length === 0 ? (
            <div className="text-xs text-gray-500 italic">AWAITING_ORACLE_SIGNAL...</div>
          ) : (
            <div className="space-y-4">
              {feed.map((item) => (
                <article key={item.id} className="border-b border-borderline pb-4 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[10px] uppercase font-bold ${categoryColor(item.category)}`}>[{item.category}]</span>
                    <span className="text-[10px] text-gray-600">BLOCK #{item.blockHeight}</span>
                    <span className="text-[10px] text-gray-600">{timeAgo(item.timestamp)}</span>
                  </div>
                  {item.intelPayload.title && (
                    <h3 className="text-sm text-white font-bold uppercase">{item.intelPayload.title}</h3>
                  )}
                  {item.intelPayload.body && (
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{item.intelPayload.body}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-surface border border-borderline p-6">
          <h2 className="text-white font-bold mb-4">SHIP_FAST_KITS</h2>
          <button className="w-full py-2 bg-white text-black text-xs font-bold uppercase mb-4">Deploy OnchainKit</button>
          <button className="w-full py-2 bg-white text-black text-xs font-bold uppercase">ERC-8021 Boilerplate</button>
        </aside>
      </div>

      <footer className="mt-12 text-center text-[10px] text-gray-600 uppercase tracking-[0.2em]">
        STAY BAISED {'//'} THE CHAIN WHISPERS. I LISTEN.
      </footer>
    </main>
  );
}

import { fetchBaseChainData } from '@/lib/base-intel';
import Image from 'next/image';

export default async function BaisedTerminal() {
  const intel = await fetchBaseChainData();
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
            <div className="text-xs text-gray-500 mt-2">BLOCK: {intel.latestBlock} {'//'} STATUS: {intel.status}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <section className="lg:col-span-2 bg-surface border border-borderline p-6">
          <h2 className="text-white font-bold mb-4">ECOSYSTEM_INTEL_FEED</h2>
          <div className="text-xs text-gray-500 italic">AWAITING_ORACLE_SIGNAL...</div>
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

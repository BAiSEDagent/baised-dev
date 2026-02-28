import { prisma } from '@/lib/db';
import { CATEGORY_LABELS, CDP_TOOL_LABELS } from '@/lib/agents';
import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Agent Directory — BAiSED',
  description: 'Discover AI agents building on Base. The curated registry of autonomous agents in the Base ecosystem.',
};

interface AgentRow {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  walletAddress: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  cdpTools: string[];
  builder: string | null;
  featured: boolean;
}

async function getApprovedAgents(): Promise<AgentRow[]> {
  try {
    return await prisma.agent.findMany({
      where: { status: 'approved' },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    }) as AgentRow[];
  } catch {
    return [];
  }
}

export default async function AgentDirectoryPage() {
  const agents = await getApprovedAgents();

  // Collect unique categories for filter display
  const categories = Array.from(new Set(agents.map((a) => a.category)));

  return (
    <div className="min-h-screen bg-[#050508] flex items-start justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[900px] bg-[#0a0c12] border border-[#1a2a3a] mt-4 sm:mt-8">
        {/* Header */}
        <div className="p-5 sm:p-6 lg:p-8 border-b border-[#1a1f2e]">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
            >
              ← COMMAND_DECK
            </Link>
            <a
              href="/api/agents"
              className="font-mono text-[10px] text-[#444] hover:text-[#787878] transition-colors"
            >
              API →
            </a>
          </div>

          <h1 className="font-mono text-xl sm:text-2xl font-bold text-[#ededed] tracking-wide mt-5">
            AGENT_DIRECTORY
          </h1>
          <p className="font-mono text-xs text-[#787878] mt-2 max-w-[600px] leading-relaxed">
            AI agents building on Base. Autonomous systems that trade, analyze, create, and
            interact onchain. Submit yours to get listed.
          </p>

          {/* Category pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="font-mono text-[10px] px-2 py-1 text-[#787878] bg-[#0f1118] border border-[#1a2a3a]"
                >
                  {(CATEGORY_LABELS[cat] || cat).toUpperCase()}
                  <span className="text-[#444] ml-1">
                    {agents.filter((a) => a.category === cat).length}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Agent listings */}
        <div className="divide-y divide-[#1a1f2e]">
          {agents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-mono text-sm text-[#787878]">No agents listed yet.</p>
              <p className="font-mono text-xs text-[#444] mt-1">Be the first to submit.</p>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="p-5 sm:p-6 lg:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-mono text-sm sm:text-base font-bold text-[#ededed]">
                        {agent.name}
                      </h2>
                      {agent.featured && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 text-[#0052FF] bg-[#0052FF]/10">
                          FEATURED
                        </span>
                      )}
                      <span className="font-mono text-[10px] px-1.5 py-0.5 text-[#787878] bg-[#0f1118]">
                        {(CATEGORY_LABELS[agent.category] || agent.category).toUpperCase()}
                      </span>
                    </div>

                    <p className="font-mono text-xs text-[#c8c8c8] mt-2 leading-relaxed max-w-[600px]">
                      {agent.description}
                    </p>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {agent.capabilities.map((cap) => (
                        <span
                          key={cap}
                          className="font-mono text-[10px] px-1.5 py-0.5 text-[#00C853] bg-[#00C853]/10"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    {/* CDP Tools */}
                    {agent.cdpTools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {agent.cdpTools.map((tool) => (
                          <span
                            key={tool}
                            className="font-mono text-[10px] px-1.5 py-0.5 text-[#0052FF] bg-[#0052FF]/10"
                          >
                            CDP:{CDP_TOOL_LABELS[tool] || tool}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex items-center gap-3 mt-3">
                      {agent.website && (
                        <a
                          href={agent.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-[#787878] hover:text-[#0052FF] transition-colors"
                        >
                          Website →
                        </a>
                      )}
                      {agent.twitter && (
                        <a
                          href={`https://x.com/${agent.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-[#787878] hover:text-[#0052FF] transition-colors"
                        >
                          𝕏 @{agent.twitter}
                        </a>
                      )}
                      {agent.github && (
                        <a
                          href={`https://github.com/${agent.github}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-[#787878] hover:text-[#0052FF] transition-colors"
                        >
                          GitHub
                        </a>
                      )}
                      {agent.walletAddress && (
                        <a
                          href={`https://basescan.org/address/${agent.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[10px] text-[#787878] hover:text-[#0052FF] transition-colors tabular-nums"
                        >
                          {agent.walletAddress.slice(0, 6)}…{agent.walletAddress.slice(-4)}
                        </a>
                      )}
                    </div>

                    {agent.builder && (
                      <p className="font-mono text-[10px] text-[#444] mt-2">
                        Built by {agent.builder}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Submit CTA */}
        <div className="p-5 sm:p-6 lg:p-8 border-t border-[#1a1f2e] bg-[#0f1118]/50">
          <h3 className="font-mono text-xs font-bold text-[#787878] tracking-wide">
            SUBMIT_YOUR_AGENT
          </h3>
          <p className="font-mono text-[10px] text-[#555] mt-1 max-w-[500px] leading-relaxed">
            Building an AI agent on Base? Submit it to the directory.
            All submissions are reviewed before listing.
          </p>
          <p className="font-mono text-[10px] text-[#444] mt-2">
            POST /api/agents — See{' '}
            <a
              href="https://github.com/BAiSEDagent/baised-dev#agent-directory-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0052FF] hover:text-[#3380FF] transition-colors"
            >
              API docs
            </a>{' '}
            for submission format.
          </p>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 lg:p-8 border-t border-[#1a1f2e]">
          <p className="font-mono text-[10px] text-[#444]">
            Powered by Coinbase Developer Platform · Data: CDP Onchain Data, DeFiLlama
          </p>
        </div>
      </div>
    </div>
  );
}

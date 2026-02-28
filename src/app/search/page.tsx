'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  timestamp: string;
  category: string;
  title: string | null;
  body: string | null;
  isPremium: boolean;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim().length < 2) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    }
    setSearched(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#050508] flex items-start justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-[700px] bg-[#0a0c12] border border-[#1a2a3a] mt-4 sm:mt-8">
        <div className="p-5 sm:p-6 border-b border-[#1a1f2e]">
          <Link
            href="/"
            className="font-mono text-xs text-[#787878] hover:text-[#0052FF] transition-colors"
          >
            ← COMMAND_DECK
          </Link>
          <h1 className="font-mono text-lg font-bold text-[#ededed] tracking-wide mt-4">
            SEARCH_INTEL
          </h1>

          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search intel posts..."
              className="flex-1 bg-[#0f1118] border border-[#1a2a3a] text-[#ededed] font-mono text-sm px-3 py-2 focus:outline-none focus:border-[#0052FF] placeholder:text-[#444] transition-colors"
              minLength={2}
              maxLength={200}
            />
            <button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="font-mono text-xs px-4 py-2 bg-[#0052FF] text-white hover:bg-[#0052FF]/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '...' : 'SEARCH'}
            </button>
          </form>
        </div>

        <div className="p-5 sm:p-6">
          {!searched ? (
            <p className="font-mono text-xs text-[#555]">
              Search across all published intel posts, ecosystem reports, and alerts.
            </p>
          ) : results.length === 0 ? (
            <p className="font-mono text-xs text-[#787878]">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="space-y-3">
              <p className="font-mono text-[10px] text-[#555]">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((r) => (
                <article key={r.id} className="py-2 border-b border-[#1a1f2e]/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-[#0052FF] font-bold">
                      [{r.category.toUpperCase()}]
                    </span>
                    {r.isPremium && (
                      <span className="font-mono text-[10px] text-[#FFB000] font-bold">
                        [PREMIUM]
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-[#444]">
                      {new Date(r.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {r.title && (
                    <p className="font-mono text-xs text-[#c8c8c8] mt-1">
                      {r.title}
                    </p>
                  )}
                  {r.body && !r.isPremium && (
                    <p className="font-mono text-[10px] text-[#787878] mt-0.5">
                      {r.body.length > 200 ? r.body.slice(0, 200) + '…' : r.body}
                    </p>
                  )}
                  {r.isPremium && (
                    <p className="font-mono text-[10px] text-[#FFB000]/60 mt-0.5">
                      PAYLOAD ENCRYPTED // REQUIRE x402 VERIFICATION
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

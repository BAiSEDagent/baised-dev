'use client';

import { useState, useCallback } from 'react';
import { COMPONENT_TEMPLATES } from '@/lib/code-templates';

type ViewMode = 'component' | 'full-setup' | 'sandbox';
type ComponentName = keyof typeof COMPONENT_TEMPLATES;

const STACKBLITZ_BASE = 'https://stackblitz.com/edit';

// Pre-built StackBlitz project IDs for each component
// These are forked from a base OnchainKit Next.js template
const STACKBLITZ_TEMPLATES: Record<string, string> = {
  Identity: 'nextjs-onchainkit-identity',
  Wallet: 'nextjs-onchainkit-wallet',
  Swap: 'nextjs-onchainkit-swap',
  Fund: 'nextjs-onchainkit-fund',
  Transaction: 'nextjs-onchainkit-transaction',
};

export function OnchainKitBuilder() {
  const [selected, setSelected] = useState<ComponentName>('Identity');
  const [viewMode, setViewMode] = useState<ViewMode>('component');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [sandboxLoaded, setSandboxLoaded] = useState(false);

  const template = COMPONENT_TEMPLATES[selected];

  const handleCopy = useCallback(async (content: string, filename: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedFile(filename);
      setTimeout(() => setCopiedFile(null), 2000);
      console.log('[analytics] component_copied', { component: selected, file: filename, view: viewMode });
    } catch {
      alert('Copy failed. Please copy manually.');
    }
  }, [selected, viewMode]);

  const handleOpenSandbox = useCallback(() => {
    const projectId = STACKBLITZ_TEMPLATES[selected];
    window.open(
      `${STACKBLITZ_BASE}/${projectId}?file=app%2Fpage.tsx&terminal=dev`,
      '_blank',
      'noopener,noreferrer'
    );
    console.log('[analytics] sandbox_opened', { component: selected });
  }, [selected]);

  // Get the simple component-only code (backward compat with old view)
  const getComponentCode = (): string => {
    const pageFile = template.files.find(f => f.filename === 'app/page.tsx');
    return pageFile?.content || '';
  };

  return (
    <div className="workbench-module">
      <h4 className="font-mono text-xs font-bold text-[#ededed] mb-3">
        OnchainKit Component Builder
      </h4>

      {/* Component Selector */}
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="OnchainKit component selector">
        {Object.keys(COMPONENT_TEMPLATES).map((comp) => (
          <button
            key={comp}
            onClick={() => {
              setSelected(comp as ComponentName);
              setSandboxLoaded(false);
            }}
            aria-label={`Select ${comp} component`}
            aria-pressed={selected === comp}
            className={`font-mono text-xs px-2.5 py-1 border transition-colors ${
              selected === comp
                ? 'bg-[#0052FF] text-white border-[#0052FF]'
                : 'bg-transparent text-[#787878] border-[#2a3a4a] hover:border-[#0052FF] hover:text-[#0052FF]'
            }`}
          >
            {comp}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-1 mb-3 border border-[#1a2a3a] p-0.5" role="tablist" aria-label="Code view mode">
        {[
          { mode: 'component' as ViewMode, label: 'Component' },
          { mode: 'full-setup' as ViewMode, label: 'Full Setup' },
          { mode: 'sandbox' as ViewMode, label: '⚡ Live Sandbox' },
        ].map(({ mode, label }) => (
          <button
            key={mode}
            role="tab"
            aria-selected={viewMode === mode}
            onClick={() => setViewMode(mode)}
            className={`flex-1 font-mono text-[10px] py-1.5 px-2 transition-colors ${
              viewMode === mode
                ? 'bg-[#1a2a3a] text-[#ededed]'
                : 'bg-transparent text-[#555] hover:text-[#787878]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Component Description */}
      <p className="font-mono text-[10px] text-[#787878] mb-3">
        {template.description}
      </p>

      {/* VIEW: Component Only */}
      {viewMode === 'component' && (
        <div className="relative">
          <pre className="code-block bg-[#0a0c12] border border-[#1a2a3a] p-3 overflow-x-auto text-[10px] leading-relaxed max-h-[300px]">
            <code className="text-[#c8c8c8]">{getComponentCode()}</code>
          </pre>
          <button
            onClick={() => handleCopy(getComponentCode(), 'page.tsx')}
            className="absolute top-2 right-2 font-mono text-[10px] px-2 py-1 bg-[#1a2a3a] text-[#787878] hover:text-[#00C853] border border-[#2a3a4a] hover:border-[#00C853] transition-colors"
          >
            {copiedFile === 'page.tsx' ? '✓ COPIED' : 'COPY'}
          </button>
        </div>
      )}

      {/* VIEW: Full Setup */}
      {viewMode === 'full-setup' && (
        <div className="space-y-3">
          {template.files.map((file) => (
            <div key={file.filename} className="relative">
              <div className="flex items-center justify-between bg-[#0f1218] border border-[#1a2a3a] border-b-0 px-3 py-1.5">
                <span className="font-mono text-[10px] text-[#0052FF]">
                  {file.filename}
                </span>
                <button
                  onClick={() => handleCopy(file.content, file.filename)}
                  className="font-mono text-[10px] px-2 py-0.5 text-[#787878] hover:text-[#00C853] transition-colors"
                >
                  {copiedFile === file.filename ? '✓' : 'COPY'}
                </button>
              </div>
              <pre className="code-block bg-[#0a0c12] border border-[#1a2a3a] p-3 overflow-x-auto text-[10px] leading-relaxed max-h-[200px]">
                <code className="text-[#c8c8c8]">{file.content}</code>
              </pre>
            </div>
          ))}

          {/* Dependencies */}
          <div className="relative">
            <div className="flex items-center justify-between bg-[#0f1218] border border-[#1a2a3a] border-b-0 px-3 py-1.5">
              <span className="font-mono text-[10px] text-[#0052FF]">
                Install Dependencies
              </span>
              <button
                onClick={() => handleCopy(
                  `npm install ${Object.entries(template.dependencies).map(([k, v]) => `${k}@${v}`).join(' ')}`,
                  'install'
                )}
                className="font-mono text-[10px] px-2 py-0.5 text-[#787878] hover:text-[#00C853] transition-colors"
              >
                {copiedFile === 'install' ? '✓' : 'COPY'}
              </button>
            </div>
            <pre className="code-block bg-[#0a0c12] border border-[#1a2a3a] p-3 overflow-x-auto text-[10px] leading-relaxed">
              <code className="text-[#c8c8c8]">
                {`npm install ${Object.keys(template.dependencies).join(' ')}`}
              </code>
            </pre>
          </div>
        </div>
      )}

      {/* VIEW: Live Sandbox */}
      {viewMode === 'sandbox' && (
        <div className="space-y-3">
          {/* StackBlitz Embed */}
          <div className="relative border border-[#1a2a3a] bg-[#0a0c12]">
            {!sandboxLoaded && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <p className="font-mono text-xs text-[#787878]">
                  Launch a live editor with {selected} pre-configured
                </p>
                <button
                  onClick={() => {
                    handleOpenSandbox();
                    setSandboxLoaded(true);
                  }}
                  className="font-mono text-xs px-4 py-2 bg-[#0052FF] text-white hover:bg-[#0040CC] transition-colors"
                >
                  ⚡ Open in StackBlitz
                </button>
                <p className="font-mono text-[10px] text-[#444]">
                  Opens in new tab · Edit code · Live preview · Deploy to Vercel
                </p>
              </div>
            )}

            {sandboxLoaded && (
              <div className="flex flex-col items-center py-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-[#00C853] rounded-full animate-pulse" />
                  <p className="font-mono text-xs text-[#00C853]">
                    Sandbox opened in new tab
                  </p>
                </div>
                <button
                  onClick={handleOpenSandbox}
                  className="font-mono text-[10px] px-3 py-1 bg-transparent border border-[#2a3a4a] text-[#787878] hover:border-[#0052FF] hover:text-[#0052FF] transition-colors"
                >
                  Open Again
                </button>
              </div>
            )}
          </div>

          {/* Quick Setup Instructions */}
          <div className="p-3 bg-[#0a0c12] border border-[#1a2a3a]">
            <p className="font-mono text-[10px] text-[#ededed] font-bold mb-2">
              Quick Start (from sandbox):
            </p>
            <ol className="space-y-1">
              <li className="font-mono text-[10px] text-[#787878]">
                1. Add your CDP API key in <span className="text-[#0052FF]">.env.local</span>
              </li>
              <li className="font-mono text-[10px] text-[#787878]">
                2. Edit <span className="text-[#0052FF]">app/page.tsx</span> to customize
              </li>
              <li className="font-mono text-[10px] text-[#787878]">
                3. Preview updates live in the browser
              </li>
              <li className="font-mono text-[10px] text-[#787878]">
                4. Click &quot;Connect to Repository&quot; → Deploy to Vercel
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-3 space-y-1">
        <p className="font-mono text-[10px] text-[#555]">
          Install: <span className="text-[#0052FF]">npm install @coinbase/onchainkit</span>
        </p>
        <p className="font-mono text-[10px] text-[#555]">
          Docs: <a href="https://onchainkit.xyz" target="_blank" rel="noopener noreferrer" className="text-[#0052FF] hover:underline">onchainkit.xyz</a>
        </p>
      </div>
    </div>
  );
}

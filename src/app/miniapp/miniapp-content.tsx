'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { sdk } from '@farcaster/miniapp-sdk';
import { isAddress } from 'viem';

type Tool = 'faucet' | 'basename' | 'gas' | 'decoder';

export function MiniAppContent() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const [activeTool, setActiveTool] = useState<Tool>('faucet');

  useEffect(() => {
    sdk.actions.ready();
  }, []);

  // Auto-connect if not connected
  useEffect(() => {
    if (!isConnected && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  }, [isConnected, connectors, connect]);

  return (
    <div className="min-h-screen bg-[#080a10] text-[#ededed] font-mono">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1a1f2e] flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold tracking-wide">BAiSED</h1>
          <p className="text-[10px] text-[#555]">Base Developer Tools</p>
        </div>
        {address && (
          <span className="text-[10px] text-[#0052FF]">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        )}
      </div>

      {/* Tool Tabs */}
      <div className="flex border-b border-[#1a1f2e]">
        {([
          ['faucet', '💧 Faucet'],
          ['basename', '🔍 Names'],
          ['gas', '⛽ Gas'],
          ['decoder', '🔓 ABI'],
        ] as [Tool, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTool(key)}
            className={`flex-1 py-2.5 text-[11px] transition-colors ${
              activeTool === key
                ? 'text-[#0052FF] border-b-2 border-[#0052FF] bg-[#0052FF]/5'
                : 'text-[#555] hover:text-[#787878]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tool Content */}
      <div className="p-4">
        {activeTool === 'faucet' && <FaucetTool address={address} />}
        {activeTool === 'basename' && <BasenameTool />}
        {activeTool === 'gas' && <GasTool />}
        {activeTool === 'decoder' && <DecoderTool />}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-2 bg-[#080a10] border-t border-[#1a1f2e]">
        <p className="text-[9px] text-[#444] text-center">
          baised.dev · Built on Base
        </p>
      </div>
    </div>
  );
}

/* ─── FAUCET ─── */
function FaucetTool({ address }: { address?: `0x${string}` }) {
  const [input, setInput] = useState(address || '');
  const [token, setToken] = useState<'eth' | 'usdc'>('eth');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ txHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address && !input) setInput(address);
  }, [address, input]);

  const handleClaim = useCallback(async () => {
    setError(null);
    setResult(null);
    let resolvedAddress = input.trim();

    if (!resolvedAddress) {
      setError('Enter an address');
      return;
    }

    setLoading(true);
    try {
      // Resolve basename if needed
      if (!isAddress(resolvedAddress)) {
        const name = resolvedAddress.endsWith('.base.eth')
          ? resolvedAddress
          : `${resolvedAddress}.base.eth`;
        const res = await fetch(`/api/basename?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        if (data.result && isAddress(data.result)) {
          resolvedAddress = data.result;
        } else {
          setError('Could not resolve basename');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: resolvedAddress, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Request failed');
      } else {
        setResult({ txHash: data.transactionHash });
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [input, token]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#787878]">Drip testnet funds to any Base Sepolia wallet</p>
      <input
        type="text"
        value={input}
        onChange={(e) => { setInput(e.target.value); setError(null); setResult(null); }}
        placeholder="0x... or basename.base.eth"
        className="w-full text-xs bg-[#0a0c12] border border-[#2a3a4a] px-3 py-2.5 text-[#ededed] focus:outline-none focus:border-[#0052FF] placeholder:text-[#444]"
      />
      <div className="flex gap-2">
        {(['eth', 'usdc'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setToken(t)}
            className={`flex-1 text-[11px] py-2 border transition-colors ${
              token === t ? 'border-[#0052FF] text-[#ededed] bg-[#1a2a3a]' : 'border-[#2a3a4a] text-[#555]'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        onClick={handleClaim}
        disabled={loading || !input.trim()}
        className="w-full py-2.5 text-xs bg-[#0052FF] text-white hover:bg-[#0052FF]/80 transition-colors disabled:opacity-50"
      >
        {loading ? 'REQUESTING...' : `CLAIM ${token.toUpperCase()}`}
      </button>
      {result && (
        <div className="p-2.5 border border-[#00C853] bg-[#00C853]/5">
          <p className="text-xs text-[#00C853]">✓ Sent!</p>
          <a
            href={`https://sepolia.basescan.org/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#0052FF] hover:underline"
          >
            View on BaseScan →
          </a>
        </div>
      )}
      {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
    </div>
  );
}

/* ─── BASENAME RESOLVER ─── */
function BasenameTool() {
  const [name, setName] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleResolve = useCallback(async () => {
    if (!name.trim()) return;
    setLoading(true);
    setResult(null);
    const query = name.trim().endsWith('.base.eth') ? name.trim() : `${name.trim()}.base.eth`;
    try {
      const res = await fetch(`/api/basename?name=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResult(data.result || 'Not found');
    } catch {
      setResult('Error resolving');
    } finally {
      setLoading(false);
    }
  }, [name]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#787878]">Resolve any .base.eth name to an address</p>
      <input
        type="text"
        value={name}
        onChange={(e) => { setName(e.target.value); setResult(null); }}
        onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
        placeholder="vitalik.base.eth"
        className="w-full text-xs bg-[#0a0c12] border border-[#2a3a4a] px-3 py-2.5 text-[#ededed] focus:outline-none focus:border-[#0052FF] placeholder:text-[#444]"
      />
      <button
        onClick={handleResolve}
        disabled={loading || !name.trim()}
        className="w-full py-2.5 text-xs bg-[#0052FF] text-white hover:bg-[#0052FF]/80 transition-colors disabled:opacity-50"
      >
        {loading ? 'RESOLVING...' : 'RESOLVE'}
      </button>
      {result && (
        <div className="p-2.5 border border-[#2a3a4a] bg-[#0a0c12]">
          <p className="text-[10px] text-[#787878] mb-1">Result</p>
          <p className="text-xs text-[#ededed] break-all">{result}</p>
        </div>
      )}
    </div>
  );
}

/* ─── GAS TRACKER ─── */
function GasTool() {
  const [gas, setGas] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gas');
      const data = await res.json();
      setGas(data.formatted || data.gasPrice || 'Unavailable');
    } catch {
      setGas('Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGas(); }, [fetchGas]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#787878]">Current Base gas price</p>
      <div className="p-4 border border-[#2a3a4a] bg-[#0a0c12] text-center">
        {loading ? (
          <p className="text-xs text-[#555]">Loading...</p>
        ) : (
          <>
            <p className="text-2xl font-bold text-[#00C853]">{gas}</p>
            <p className="text-[10px] text-[#555] mt-1">Gwei</p>
          </>
        )}
      </div>
      <button
        onClick={fetchGas}
        disabled={loading}
        className="w-full py-2.5 text-xs border border-[#2a3a4a] text-[#787878] hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50"
      >
        REFRESH
      </button>
      <p className="text-[10px] text-[#444]">
        Base L2 gas is typically 0.001-0.01 Gwei — a USDC transfer costs ~$0.000003
      </p>
    </div>
  );
}

/* ─── ABI DECODER ─── */
function DecoderTool() {
  const [calldata, setCalldata] = useState('');
  const [result, setResult] = useState<{ functionName: string; signature: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = useCallback(async () => {
    if (!calldata.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/decode-calldata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calldata: calldata.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Decode failed');
      } else {
        setResult({ functionName: data.functionName, signature: data.signature });
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [calldata]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#787878]">Decode transaction calldata via 4byte.directory</p>
      <textarea
        value={calldata}
        onChange={(e) => { setCalldata(e.target.value); setError(null); setResult(null); }}
        placeholder="0xa9059cbb..."
        rows={3}
        className="w-full text-xs bg-[#0a0c12] border border-[#2a3a4a] px-3 py-2.5 text-[#ededed] focus:outline-none focus:border-[#0052FF] placeholder:text-[#444] resize-none"
      />
      <button
        onClick={handleDecode}
        disabled={loading || !calldata.trim()}
        className="w-full py-2.5 text-xs bg-[#0052FF] text-white hover:bg-[#0052FF]/80 transition-colors disabled:opacity-50"
      >
        {loading ? 'DECODING...' : 'DECODE'}
      </button>
      {result && (
        <div className="p-2.5 border border-[#2a3a4a] bg-[#0a0c12]">
          <p className="text-[10px] text-[#787878]">Function</p>
          <p className="text-xs text-[#00C853] font-bold">{result.functionName}</p>
          <p className="text-[10px] text-[#555] mt-1 break-all">{result.signature}</p>
        </div>
      )}
      {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
    </div>
  );
}

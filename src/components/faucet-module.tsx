'use client';

import { useState } from 'react';
import { isAddress } from 'viem';

export function FaucetModule() {
  const [address, setAddress] = useState('');
  const [token, setToken] = useState<'eth' | 'usdc'>('eth');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ txHash: string; token: string } | null>(null);

  const handleRequestFunds = async () => {
    setError(null);
    setResult(null);
    const input = address.trim();

    if (!input) {
      setError('Address required');
      return;
    }

    setLoading(true);

    try {
      // If it's a basename, resolve it first
      let resolvedAddress = input;
      if (!isAddress(input)) {
        const name = input.toLowerCase().endsWith('.base.eth')
          ? input.toLowerCase()
          : `${input.toLowerCase()}.base.eth`;

        const resolveRes = await fetch(`/api/basename?name=${encodeURIComponent(name)}`);
        const resolveData = await resolveRes.json();

        if (resolveData.result && resolveData.result !== 'Not found' && isAddress(resolveData.result)) {
          resolvedAddress = resolveData.result;
        } else {
          setError('Could not resolve basename. Enter a 0x address.');
          setLoading(false);
          return;
        }
      }

      // Call our server-side faucet
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: resolvedAddress, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Faucet request failed');
        return;
      }

      setResult({ txHash: data.transactionHash, token: data.token });
      console.log('[analytics] faucet_success', { address: resolvedAddress, token, txHash: data.transactionHash });
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workbench-module">
      <h4 className="font-mono text-xs font-bold text-[#ededed] mb-3" id="faucet-heading">
        Base Sepolia Faucet
      </h4>

      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => { setAddress(e.target.value); setError(null); setResult(null); }}
          onKeyDown={(e) => e.key === 'Enter' && handleRequestFunds()}
          placeholder="0x... or basename.base.eth"
          aria-label="Ethereum address or basename for testnet funds"
          className="w-full font-mono text-xs bg-[#0a0c12] border border-[#2a3a4a] text-[#ededed] px-3 py-2 focus:outline-none focus:border-[#0052FF] placeholder:text-[#444]"
        />
      </div>

      {/* Token selector */}
      <div className="flex gap-2 mt-2">
        {(['eth', 'usdc'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setToken(t); setResult(null); }}
            className={`flex-1 font-mono text-[10px] py-1.5 border transition-colors ${
              token === t
                ? 'bg-[#1a2a3a] text-[#ededed] border-[#0052FF]'
                : 'bg-transparent text-[#555] border-[#2a3a4a] hover:text-[#787878]'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <button
        onClick={handleRequestFunds}
        disabled={!address.trim() || loading}
        className="mt-2 w-full font-mono text-xs py-2 bg-transparent border border-[#2a3a4a] text-[#787878] hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'REQUESTING...' : `CLAIM ${token.toUpperCase()} →`}
      </button>

      {/* Success */}
      {result && (
        <div className="mt-3 p-2.5 bg-[#0a0c12] border border-[#00C853]" role="status">
          <p className="font-mono text-xs text-[#00C853]">
            ✓ {result.token.toUpperCase()} sent to your wallet
          </p>
          <a
            href={`https://sepolia.basescan.org/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-[#0052FF] hover:underline mt-1 block"
          >
            View on BaseScan →
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 p-2.5 bg-[#0a0c12] border border-[#FF3B30]" role="alert">
          <p className="font-mono text-xs text-[#FF3B30]">{error}</p>
        </div>
      )}

      <div className="mt-3 space-y-1">
        <p className="font-mono text-[10px] text-[#787878]">
          <span className="text-[#00C853]">✓</span> 0.0001 ETH per claim
        </p>
        <p className="font-mono text-[10px] text-[#787878]">
          <span className="text-[#00C853]">✓</span> 1 USDC per claim
        </p>
        <p className="font-mono text-[10px] text-[#444] mt-2">
          Drips directly to your wallet · No redirect · Base Sepolia
        </p>
      </div>
    </div>
  );
}

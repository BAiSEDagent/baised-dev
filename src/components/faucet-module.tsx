'use client';

import { useState } from 'react';
import { isAddress } from 'viem';

export function FaucetModule() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openFaucet = (resolvedAddress: string) => {
    const faucetUrl = `https://portal.cdp.coinbase.com/products/faucet?network=base-sepolia&address=${encodeURIComponent(resolvedAddress)}`;
    window.open(faucetUrl, '_blank', 'noopener,noreferrer');
    console.log('[analytics] faucet_requested', { address: resolvedAddress });
  };

  const handleRequestFunds = async () => {
    setError(null);
    const input = address.trim();

    if (!input) {
      setError('Address required');
      return;
    }

    // If it's a basename (.eth), resolve it first
    if (input.toLowerCase().endsWith('.eth') || /^[a-z0-9-]+$/i.test(input)) {
      // Could be a basename — try resolving if it's not a hex address
      if (!isAddress(input)) {
        setLoading(true);
        try {
          const name = input.toLowerCase().endsWith('.base.eth')
            ? input.toLowerCase()
            : input.toLowerCase().endsWith('.eth')
              ? input.toLowerCase()
              : `${input.toLowerCase()}.base.eth`;

          const res = await fetch(`/api/basename?name=${encodeURIComponent(name)}`);
          const data = await res.json();

          if (data.result && data.result !== 'Not found' && isAddress(data.result)) {
            openFaucet(data.result);
          } else {
            setError('Could not resolve basename to an address');
          }
        } catch {
          setError('Failed to resolve basename');
        } finally {
          setLoading(false);
        }
        return;
      }
    }

    if (!isAddress(input)) {
      setError('Invalid address. Enter a 0x address or basename.');
      return;
    }

    openFaucet(input);
  };

  return (
    <div className="workbench-module">
      <h4
        className="font-mono text-xs font-bold text-[#ededed] mb-3"
        id="faucet-heading"
      >
        Base Sepolia Faucet
      </h4>

      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleRequestFunds()}
          placeholder="0x... or basename.base.eth"
          aria-label="Ethereum address or basename for testnet funds"
          aria-describedby="faucet-heading"
          className="w-full font-mono text-xs bg-[#0a0c12] border border-[#2a3a4a] text-[#ededed] px-3 py-2 focus:outline-none focus:border-[#0052FF] placeholder:text-[#444]"
        />
      </div>

      <button
        onClick={handleRequestFunds}
        disabled={!address.trim() || loading}
        aria-label="Request testnet funds"
        className="mt-2 w-full font-mono text-xs py-2 bg-transparent border border-[#2a3a4a] text-[#787878] hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'RESOLVING...' : 'GET TESTNET ETH →'}
      </button>

      {error && (
        <div
          className="mt-3 p-2.5 bg-[#0a0c12] border border-[#FF3B30]"
          role="alert"
          aria-live="assertive"
        >
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
          Accepts 0x addresses and basenames · Opens CDP faucet
        </p>
      </div>
    </div>
  );
}

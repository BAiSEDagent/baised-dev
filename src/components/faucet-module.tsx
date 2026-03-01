'use client';

import { useState } from 'react';
import { isAddress } from 'viem';

export function FaucetModule() {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleRequestFunds = () => {
    setError(null);

    if (!address.trim()) {
      setError('Address required');
      return;
    }

    const sanitized = address.trim();

    if (!isAddress(sanitized)) {
      setError('Invalid Ethereum address');
      return;
    }

    // Open CDP faucet in new tab with pre-filled address
    const faucetUrl = `https://portal.cdp.coinbase.com/products/faucet?network=base-sepolia&address=${sanitized}`;
    window.open(faucetUrl, '_blank', 'noopener,noreferrer');

    // Analytics
    console.log('[analytics] faucet_requested', { address: sanitized });
  };

  return (
    <div className="workbench-module">
      <h4
        className="font-mono text-xs font-bold text-[#ededed] mb-3"
        id="faucet-heading"
      >
        Base Sepolia Faucet
      </h4>

      {/* Address Input */}
      <div className="relative">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleRequestFunds()}
          placeholder="0x... (your Sepolia address)"
          aria-label="Ethereum address for testnet funds"
          aria-describedby="faucet-heading"
          className="w-full font-mono text-xs bg-[#0a0c12] border border-[#2a3a4a] text-[#ededed] px-3 py-2 focus:outline-none focus:border-[#0052FF] placeholder:text-[#444]"
        />
      </div>

      <button
        onClick={handleRequestFunds}
        disabled={!address.trim()}
        aria-label="Request testnet funds"
        className="mt-2 w-full font-mono text-xs py-2 bg-transparent border border-[#2a3a4a] text-[#787878] hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        GET TESTNET ETH →
      </button>

      {/* Error */}
      {error && (
        <div
          className="mt-3 p-2.5 bg-[#0a0c12] border border-[#FF3B30]"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-mono text-xs text-[#FF3B30]">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-3 space-y-1">
        <p className="font-mono text-[10px] text-[#787878]">
          <span className="text-[#00C853]">✓</span> 0.0001 ETH per claim
        </p>
        <p className="font-mono text-[10px] text-[#787878]">
          <span className="text-[#00C853]">✓</span> 1 USDC per claim
        </p>
        <p className="font-mono text-[10px] text-[#444] mt-2">
          Opens Coinbase Developer Platform faucet
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';

const GAS_OPERATIONS = {
  'USDC Transfer': 50000,
  'NFT Mint': 100000,
  'Uniswap Swap': 150000,
  'Smart Wallet Deploy': 250000,
} as const;

export function GasEstimator() {
  const [operation, setOperation] = useState<keyof typeof GAS_OPERATIONS>('USDC Transfer');
  const [gasPrice, setGasPrice] = useState<number | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGasData();
    const interval = setInterval(fetchGasData, 120000); // L-2: Refresh every 2 min (Base gas changes quickly)
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGasData = async () => {
    try {
      const res = await fetch('/api/gas');
      const data = await res.json();
      setGasPrice(data.gasPriceGwei);
      setEthPrice(data.ethPrice);
      setLoading(false);
      // M-2: Analytics event
      console.log('[analytics] gas_estimate_fetched', { success: true, operation });
    } catch (err) {
      setLoading(false);
      console.error('[analytics] gas_estimate_failed', err);
    }
  };

  const estimatedGas = GAS_OPERATIONS[operation];
  // C-1: Fix gas cost calculation (gas units × Gwei/gas = Gwei, then / 1e9 = ETH)
  const costEth = gasPrice ? (estimatedGas * gasPrice) / 1e9 : null;
  const costUsd = costEth && ethPrice ? (costEth * ethPrice).toFixed(4) : null;

  return (
    <div className="workbench-module">
      <h4 className="font-mono text-xs font-bold text-[#ededed] mb-3">
        Live Gas Estimator
      </h4>

      {/* Operation Selector */}
      <select
        value={operation}
        onChange={(e) => setOperation(e.target.value as keyof typeof GAS_OPERATIONS)}
        className="w-full font-mono text-xs bg-[#0a0c12] border border-[#2a3a4a] text-[#ededed] px-3 py-2 focus:outline-none focus:border-[#0052FF]"
      >
        {Object.keys(GAS_OPERATIONS).map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      {/* Results */}
      <div className="mt-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="font-mono text-xs text-[#787878]">Est. Gas Units:</span>
          <span className="font-mono text-xs text-[#ededed] tabular-nums">
            {estimatedGas.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="font-mono text-xs text-[#787878]">Current Gas Price:</span>
          <span className="font-mono text-xs text-[#ededed] tabular-nums">
            {loading ? (
              <span className="inline-block w-16 h-3 bg-[#1a2a3a] animate-pulse" />
            ) : gasPrice ? (
              `${gasPrice.toFixed(4)} Gwei`
            ) : (
              'N/A'
            )}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-[#1a2a3a]">
          <span className="font-mono text-xs font-bold text-[#787878]">Total Cost (USD):</span>
          <span className="font-mono text-sm font-bold text-[#00C853] tabular-nums">
            {loading ? (
              <span className="inline-block w-20 h-4 bg-[#1a2a3a] animate-pulse" />
            ) : costUsd ? (
              `$${costUsd}`
            ) : (
              'N/A'
            )}
          </span>
        </div>
      </div>

      <p className="font-mono text-[10px] text-[#555] mt-3">
        Estimates based on current Base mainnet gas prices. Actual cost may vary.
      </p>
    </div>
  );
}

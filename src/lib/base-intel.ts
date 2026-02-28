interface ChainData {
  latestBlock: number | string;
  status: string;
  tvl: string;
  dexVolume24h: string;
  fees24h: string;
  gasPrice: string;
  gasPriceGwei: number | null;
}

/**
 * Fetch Base chain telemetry: block (RPC) + TVL + DEX volume + fees (DeFiLlama).
 * All calls independent — failures degrade gracefully per field.
 */
export async function fetchBaseChainData(): Promise<ChainData> {
  const [blockResult, tvlResult, dexResult, feesResult, gasResult] = await Promise.allSettled([
    fetchLatestBlock(),
    fetchBaseTVL(),
    fetchBaseDexVolume(),
    fetchBaseFees(),
    fetchGasPrice(),
  ]);

  const block =
    blockResult.status === "fulfilled"
      ? blockResult.value
      : { latestBlock: "OFFLINE" as const, status: "DATA_UNAVAILABLE" };

  const tvl = tvlResult.status === "fulfilled" ? tvlResult.value : "$—";
  const dexVolume24h = dexResult.status === "fulfilled" ? dexResult.value : "$—";
  const fees24h = feesResult.status === "fulfilled" ? feesResult.value : "$—";
  const gas = gasResult.status === "fulfilled" ? gasResult.value : { gasPrice: "—", gasPriceGwei: null };

  return { ...block, tvl, dexVolume24h, fees24h, ...gas };
}

async function fetchLatestBlock(): Promise<{
  latestBlock: number | string;
  status: string;
}> {
  const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_blockNumber",
      params: [],
      id: 1,
    }),
    next: { revalidate: 12 },
  });

  if (!res.ok) {
    return { latestBlock: "N/A", status: "UNAUTHORIZED_OR_ERROR" };
  }

  const data = await res.json();
  return { latestBlock: parseInt(data.result, 16), status: "OPTIMAL" };
}

async function fetchBaseTVL(): Promise<string> {
  // Primary: /v2/chains (lightweight, current snapshot)
  try {
    const res = await fetch("https://api.llama.fi/v2/chains", {
      next: { revalidate: 300 },
    });

    if (res.ok) {
      const chains: Array<{ name: string; tvl: number }> = await res.json();
      const base = chains.find((c) => c.name.toLowerCase() === "base");
      if (base) return formatUSD(base.tvl);
    }
  } catch {
    // Fall through to secondary
  }

  // Fallback: /v2/historicalChainTvl/Base (last data point)
  try {
    const res = await fetch("https://api.llama.fi/v2/historicalChainTvl/Base", {
      next: { revalidate: 600 }, // 10 min cache for fallback
    });

    if (res.ok) {
      const data: Array<{ date: number; tvl: number }> = await res.json();
      if (data.length > 0) {
        return formatUSD(data[data.length - 1].tvl);
      }
    }
  } catch {
    // Both failed
  }

  return "$—";
}

async function fetchBaseDexVolume(): Promise<string> {
  const res = await fetch("https://api.llama.fi/overview/dexs/Base", {
    next: { revalidate: 300 },
  });
  if (!res.ok) return "$—";
  const data = await res.json();
  const vol = data?.total24h;
  if (typeof vol !== "number") return "$—";
  return formatUSD(vol);
}

async function fetchBaseFees(): Promise<string> {
  const res = await fetch("https://api.llama.fi/overview/fees/Base", {
    next: { revalidate: 300 },
  });
  if (!res.ok) return "$—";
  const data = await res.json();
  const fees = data?.total24h;
  if (typeof fees !== "number") return "$—";
  return formatUSD(fees);
}

async function fetchGasPrice(): Promise<{ gasPrice: string; gasPriceGwei: number | null }> {
  const rpcUrl = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_gasPrice",
      params: [],
      id: 2,
    }),
    next: { revalidate: 12 },
  });

  if (!res.ok) return { gasPrice: "—", gasPriceGwei: null };

  const data = await res.json();
  const wei = parseInt(data.result, 16);
  const gwei = wei / 1e9;

  // Base gas is typically sub-gwei, show in appropriate unit
  if (gwei < 0.001) {
    return { gasPrice: `${(wei / 1e6).toFixed(3)} Mwei`, gasPriceGwei: gwei };
  }
  if (gwei < 1) {
    return { gasPrice: `${gwei.toFixed(4)} Gwei`, gasPriceGwei: gwei };
  }
  return { gasPrice: `${gwei.toFixed(2)} Gwei`, gasPriceGwei: gwei };
}

/**
 * Fetch 30-day historical TVL for Base (for dashboard chart).
 */
export async function fetchBaseTVLHistory(): Promise<
  Array<{ date: string; tvl: number }>
> {
  try {
    const res = await fetch("https://api.llama.fi/v2/historicalChainTvl/Base", {
      next: { revalidate: 900 },
    });
    if (!res.ok) return [];

    const data: Array<{ date: number; tvl: number }> = await res.json();
    // Last 30 data points
    return data.slice(-30).map((d) => ({
      date: new Date(d.date * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      tvl: Math.round(d.tvl / 1e6), // In millions for chart readability
    }));
  } catch {
    return [];
  }
}

function formatUSD(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

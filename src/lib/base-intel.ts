interface ChainData {
  latestBlock: number | string;
  status: string;
  tvl: string; // Formatted, e.g. "$3.9B"
}

/**
 * Fetch Base chain telemetry: latest block (RPC) + TVL (DeFiLlama).
 * Both calls are independent — failures degrade gracefully.
 */
export async function fetchBaseChainData(): Promise<ChainData> {
  const [blockResult, tvlResult] = await Promise.allSettled([
    fetchLatestBlock(),
    fetchBaseTVL(),
  ]);

  const block =
    blockResult.status === "fulfilled"
      ? blockResult.value
      : { latestBlock: "OFFLINE" as const, status: "DATA_UNAVAILABLE" };

  const tvl =
    tvlResult.status === "fulfilled" ? tvlResult.value : "$—";

  return { ...block, tvl };
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
  const res = await fetch("https://api.llama.fi/v2/chains", {
    next: { revalidate: 300 }, // 5 min cache — TVL doesn't change fast
  });

  if (!res.ok) return "$—";

  const chains: Array<{ name: string; tvl: number }> = await res.json();
  const base = chains.find(
    (c) => c.name.toLowerCase() === "base"
  );

  if (!base) return "$—";

  // Format: $3.9B, $12.4B, $850M
  const tvl = base.tvl;
  if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(1)}B`;
  if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(0)}M`;
  return `$${tvl.toLocaleString()}`;
}

import { NextRequest, NextResponse } from "next/server";
import { fetchPulseCounters, fetchDexCounters, fetchDexMarketShare } from "@/lib/dune";

export const dynamic = "force-dynamic";

const PAYTO = "0x7458B08E13bBC390cD2CF6a8cE8980e4954E13b8";
const PRICE = "$0.01";

export async function GET(req: NextRequest) {
  // Check for x402 payment header
  const paymentHeader =
    req.headers.get("x-payment") || req.headers.get("payment");

  if (!paymentHeader) {
    // Return 402 Payment Required with payment details
    return NextResponse.json(
      {
        x402Version: 1,
        error: "Payment required",
        accepts: [
          {
            scheme: "exact",
            network: "eip155:8453",
            maxAmountRequired: "10000",
            resource: "https://baised.dev/api/analytics",
            description:
              "Base ecosystem analytics — DAU, tx count, DEX volume, market share",
            mimeType: "application/json",
            payTo: PAYTO,
            maxTimeoutSeconds: 300,
            asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
            extra: { name: "USDC", decimals: 6 },
          },
        ],
      },
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  // Payment provided — return data
  const [pulse, dex, marketShare] = await Promise.all([
    fetchPulseCounters(),
    fetchDexCounters(),
    fetchDexMarketShare(),
  ]);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    source: "Dune Analytics SQL — base.transactions + dex.trades",
    chain: "base",
    chainId: 8453,
    data: {
      chain_activity: {
        daily_active_wallets_24h: pulse?.dau_24h ?? null,
        daily_active_wallets_7d: pulse?.dau_7d ?? null,
        transactions_24h: pulse?.tx_24h ?? null,
        transactions_7d: pulse?.tx_7d ?? null,
      },
      dex: {
        volume_24h_usd: dex?.dex_vol_24h ?? null,
        volume_7d_usd: dex?.dex_vol_7d ?? null,
        unique_traders_7d: dex?.traders_7d ?? null,
        market_share: marketShare ?? [],
      },
    },
    payment: {
      cost: PRICE + " USDC",
      network: "Base mainnet",
      protocol: "x402",
      payTo: PAYTO,
    },
  });
}

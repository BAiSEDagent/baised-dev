import { NextResponse } from 'next/server';
import { baseClient } from '@/lib/viem-client';

export const runtime = 'edge';
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    // Fetch current gas price from Base
    const gasPrice = await baseClient.getGasPrice();
    const gasPriceGwei = Number(gasPrice) / 1e9;

    // Fetch ETH price from a reliable source (CoinGecko free tier)
    const ethPriceRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 300 } }
    );
    const ethPriceData = await ethPriceRes.json();
    const ethPrice = ethPriceData.ethereum?.usd || null;

    return NextResponse.json({
      gasPriceGwei,
      ethPrice,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Gas price fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas data' },
      { status: 500 }
    );
  }
}

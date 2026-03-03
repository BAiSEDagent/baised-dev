import { NextRequest, NextResponse } from 'next/server';
import { baseClient } from '@/lib/viem-client';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

// Node.js runtime — viem HTTP transport fails on edge
export const revalidate = 120; // L-2: Cache for 2 minutes (Base gas changes quickly)

export async function GET(req: NextRequest) {
  // C-2: Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier);
  
  if (!rateLimitResult.allowed) {
    // M-1: Request logging
    console.log('[gas] rate_limit_exceeded', { identifier });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '60',
          // M-3: CORS headers
          'Access-Control-Allow-Origin': 'https://baised.dev',
          'Access-Control-Allow-Methods': 'GET',
        },
      }
    );
  }

  try {
    // M-1: Request logging
    console.log('[gas] request', { identifier, timestamp: Date.now() });

    // Fetch current gas price from Base (H-1: timeout in viem-client.ts)
    const gasPrice = await baseClient.getGasPrice();
    const gasPriceGwei = Number(gasPrice) / 1e9;

    // H-4: Graceful CoinGecko failure handling
    let ethPrice = null;
    try {
      const ethPriceRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
        { 
          next: { revalidate: 120 },
          signal: AbortSignal.timeout(3000), // 3s timeout for external API
        }
      );
      
      if (ethPriceRes.ok) {
        const ethPriceData = await ethPriceRes.json();
        ethPrice = ethPriceData.ethereum?.usd || null;
      } else {
        console.warn('[gas] coingecko_http_error', ethPriceRes.status);
      }
    } catch (coinGeckoError) {
      // H-4: Continue without USD conversion if CoinGecko fails
      console.warn('[gas] coingecko_unavailable', coinGeckoError);
    }

    return NextResponse.json(
      {
        gasPriceGwei,
        ethPrice,
        timestamp: Date.now(),
      },
      {
        headers: {
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'Access-Control-Allow-Origin': 'https://baised.dev',
          'Cache-Control': 'public, max-age=120, stale-while-revalidate=60',
        },
      }
    );
  } catch (error) {
    // H-2: Generic error message
    console.error('[gas] fetch_error', error);
    return NextResponse.json(
      { error: 'Failed to fetch gas data. Please try again.' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://baised.dev',
        },
      }
    );
  }
}

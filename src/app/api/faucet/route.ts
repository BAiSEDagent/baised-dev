import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

// Node.js runtime required for CDP SDK
// Rate limit: 1 request per minute per IP (stricter than other endpoints)

const FAUCET_RATE_LIMIT = new Map<string, number>();
const FAUCET_COOLDOWN_MS = 60000; // 1 min per IP

export async function POST(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req);

  // Stricter rate limit for faucet (expensive resource)
  const lastRequest = FAUCET_RATE_LIMIT.get(identifier) || 0;
  const now = Date.now();
  if (now - lastRequest < FAUCET_COOLDOWN_MS) {
    const retryAfter = Math.ceil((FAUCET_COOLDOWN_MS - (now - lastRequest)) / 1000);
    return NextResponse.json(
      { error: `Faucet cooldown. Try again in ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  // Also check general rate limit
  const rateLimitResult = checkRateLimit(identifier);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { address, token } = body;

    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Address required' }, { status: 400 });
    }

    if (!isAddress(address)) {
      return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
    }

    const validTokens = ['eth', 'usdc'];
    const selectedToken = validTokens.includes(token) ? token : 'eth';

    // Validate env vars
    const apiKeyId = process.env.CDP_API_KEY_ID;
    const apiKeySecret = process.env.CDP_API_KEY_SECRET;

    if (!apiKeyId || !apiKeySecret) {
      console.error('[faucet] CDP credentials not configured');
      return NextResponse.json({ error: 'Faucet not configured' }, { status: 503 });
    }

    // Dynamic import to avoid edge bundling issues
    const { CdpClient } = await import('@coinbase/cdp-sdk');
    const cdp = new CdpClient({ apiKeyId, apiKeySecret });

    const result = await cdp.evm.requestFaucet({
      address: address as `0x${string}`,
      network: 'base-sepolia',
      token: selectedToken,
    });

    // Mark rate limit
    FAUCET_RATE_LIMIT.set(identifier, now);

    console.log('[faucet] success', { address, token: selectedToken, txHash: result.transactionHash });

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      token: selectedToken,
      network: 'base-sepolia',
    });
  } catch (error) {
    console.error('[faucet] error:', error);
    const message = error instanceof Error ? error.message : 'Faucet request failed';
    
    // CDP SDK might throw specific errors
    if (message.includes('rate') || message.includes('limit')) {
      return NextResponse.json({ error: 'CDP faucet rate limit. Try again later.' }, { status: 429 });
    }

    return NextResponse.json({ error: 'Faucet request failed. Try again.' }, { status: 500 });
  }
}

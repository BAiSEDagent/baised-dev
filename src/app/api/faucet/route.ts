import { NextRequest, NextResponse } from 'next/server';
import { isAddress } from 'viem';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

const FAUCET_RATE_LIMIT = new Map<string, number>();
const FAUCET_COOLDOWN_MS = 60000;

export async function POST(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req);

  const lastRequest = FAUCET_RATE_LIMIT.get(identifier) || 0;
  const now = Date.now();
  if (now - lastRequest < FAUCET_COOLDOWN_MS) {
    const retryAfter = Math.ceil((FAUCET_COOLDOWN_MS - (now - lastRequest)) / 1000);
    return NextResponse.json(
      { error: `Faucet cooldown. Try again in ${retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  const rateLimitResult = checkRateLimit(identifier);
  if (!rateLimitResult.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;

  if (!apiKeyId || !apiKeySecret) {
    return NextResponse.json({ error: 'Faucet not configured' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { address, token } = body;

    if (!address || typeof address !== 'string' || !isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    const selectedToken = ['eth', 'usdc'].includes(token) ? token : 'eth';

    const { CdpClient } = await import('@coinbase/cdp-sdk');
    const cdp = new CdpClient({
      apiKeyId: apiKeyId.trim(),
      apiKeySecret: apiKeySecret.trim(),
    });

    const result = await cdp.evm.requestFaucet({
      address: address as `0x${string}`,
      network: 'base-sepolia',
      token: selectedToken,
    });

    FAUCET_RATE_LIMIT.set(identifier, now);

    return NextResponse.json({
      success: true,
      transactionHash: result.transactionHash,
      token: selectedToken,
      network: 'base-sepolia',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[faucet]', message);
    return NextResponse.json({ error: 'Faucet request failed' }, { status: 500 });
  }
}

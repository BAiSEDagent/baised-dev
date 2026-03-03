import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, isAddress, namehash } from 'viem';
import { base } from 'viem/chains';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

// Node.js runtime — viem readContract needs full Node.js env
// Edge runtime breaks viem's HTTP transport silently

const L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;

const ADDR_ABI = [{
  inputs: [{ name: 'node', type: 'bytes32' }],
  name: 'addr',
  outputs: [{ name: '', type: 'address' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

// Create client per-request to avoid cold start issues
function getClient() {
  return createPublicClient({
    chain: base,
    transport: http('https://mainnet.base.org', { timeout: 8000 }),
  });
}

function sanitizeInput(input: string): string {
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

function validateBasename(name: string): boolean {
  return /^[a-z0-9-]{3,63}$/.test(name);
}

export async function GET(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Access-Control-Allow-Origin': 'https://baised.dev',
        },
      }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const address = searchParams.get('address');

    if (name) {
      const sanitized = sanitizeInput(name.toLowerCase());
      const fullName = sanitized.endsWith('.base.eth') ? sanitized : `${sanitized}.base.eth`;
      const basePart = fullName.replace('.base.eth', '');

      if (!validateBasename(basePart)) {
        return NextResponse.json(
          { error: 'Invalid basename format' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
        );
      }

      const client = getClient();
      const node = namehash(fullName);

      const resolvedAddress = await client.readContract({
        address: L2_RESOLVER,
        abi: ADDR_ABI,
        functionName: 'addr',
        args: [node],
      });

      const result = resolvedAddress && resolvedAddress !== '0x0000000000000000000000000000000000000000'
        ? resolvedAddress
        : null;

      return NextResponse.json(
        { result: result || 'Not found', input: fullName },
        {
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'Access-Control-Allow-Origin': 'https://baised.dev',
          },
        }
      );
    } else if (address) {
      const sanitized = sanitizeInput(address);

      if (!isAddress(sanitized)) {
        return NextResponse.json(
          { error: 'Invalid Ethereum address' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
        );
      }

      return NextResponse.json(
        { result: 'Reverse resolution coming soon', input: sanitized },
        {
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'Access-Control-Allow-Origin': 'https://baised.dev',
          },
        }
      );
    } else {
      return NextResponse.json(
        { error: 'Provide either name or address parameter' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
      );
    }
  } catch (error) {
    console.error('[basename] resolution_error', error);
    return NextResponse.json(
      { error: 'Resolution failed. Please try again.' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
    );
  }
}

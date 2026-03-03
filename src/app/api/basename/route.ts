import { NextRequest, NextResponse } from 'next/server';
import { baseClient } from '@/lib/viem-client';

import { isAddress, namehash } from 'viem';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export const runtime = 'edge';

// Base L2 Resolver — resolves .base.eth names directly on Base (no CCIP-Read needed)
const L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;

const ADDR_ABI = [{
  inputs: [{ name: 'node', type: 'bytes32' }],
  name: 'addr',
  outputs: [{ name: '', type: 'address' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

const NAME_ABI = [{
  inputs: [{ name: 'node', type: 'bytes32' }],
  name: 'name',
  outputs: [{ name: '', type: 'string' }],
  stateMutability: 'view',
  type: 'function',
}] as const;

// Input validation helpers
function sanitizeInput(input: string): string {
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

function validateBasename(name: string): boolean {
  return /^[a-z0-9-]{3,63}$/.test(name);
}

// Build reverse node for Base (coinType 8453)
function buildReverseNode(address: string): `0x${string}` {
  const label = address.toLowerCase().substring(2);
  // Base uses: <addr>.<chainId-hex>.reverse
  const reverseNode = `${label}.${(8453).toString(16)}.reverse`;
  return namehash(reverseNode);
}

export async function GET(req: NextRequest) {
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier);
  
  if (!rateLimitResult.allowed) {
    console.log('[basename] rate_limit_exceeded', { identifier });
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': '60',
          'Access-Control-Allow-Origin': 'https://baised.dev',
          'Access-Control-Allow-Methods': 'GET',
        },
      }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const address = searchParams.get('address');

    console.log('[basename] request', { name, address, identifier, timestamp: Date.now() });

    if (name) {
      // Forward resolution: name → address
      const sanitized = sanitizeInput(name.toLowerCase());
      const fullName = sanitized.endsWith('.base.eth') ? sanitized : `${sanitized}.base.eth`;
      const basePart = fullName.replace('.base.eth', '');

      if (!validateBasename(basePart)) {
        return NextResponse.json(
          { error: 'Invalid basename format' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
        );
      }

      // Resolve directly on Base L2 via resolver contract
      
      const node = namehash(fullName);

      const resolvedAddress = await baseClient.readContract({
        address: L2_RESOLVER,
        abi: ADDR_ABI,
        functionName: 'addr',
        args: [node],
      });

      const result = resolvedAddress && resolvedAddress !== '0x0000000000000000000000000000000000000000'
        ? resolvedAddress
        : 'Not found';

      return NextResponse.json(
        { result, input: fullName },
        {
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'Access-Control-Allow-Origin': 'https://baised.dev',
          },
        }
      );
    } else if (address) {
      // Reverse resolution: address → name
      const sanitized = sanitizeInput(address);

      if (!isAddress(sanitized)) {
        return NextResponse.json(
          { error: 'Invalid Ethereum address' },
          { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
        );
      }

      // Try reverse resolution via Base L2 resolver
      const reverseNode = buildReverseNode(sanitized);
      
      let ensName: string | null = null;
      try {
        const result = await baseClient.readContract({
          address: L2_RESOLVER,
          abi: NAME_ABI,
          functionName: 'name',
          args: [reverseNode],
        });
        ensName = result && result.length > 0 ? result : null;
      } catch {
        // Reverse record may not be set — that's normal
        ensName = null;
      }

      return NextResponse.json(
        { result: ensName || 'No basename registered', input: sanitized },
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

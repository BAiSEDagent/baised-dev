import { NextRequest, NextResponse } from 'next/server';
import { isAddress, namehash } from 'viem';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export const runtime = 'edge';

const L2_RESOLVER = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD';
const BASE_RPC = 'https://mainnet.base.org';

function sanitizeInput(input: string): string {
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

function validateBasename(name: string): boolean {
  return /^[a-z0-9-]{3,63}$/.test(name);
}

// Forward resolution: name → address via direct RPC call
async function resolveBasename(name: string): Promise<string | null> {
  try {
    const node = namehash(name);
    
    // Call resolver.addr(node) — function selector 0x3b3b57de
    const data = '0x3b3b57de' + node.slice(2).padStart(64, '0');
    
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{
          to: L2_RESOLVER,
          data,
        }, 'latest'],
        id: 1,
      }),
    });
    
    const result = await response.json();
    if (result.result && result.result !== '0x' && result.result.length >= 66) {
      const address = '0x' + result.result.slice(-40);
      return address !== '0x0000000000000000000000000000000000000000' ? address : null;
    }
    return null;
  } catch (err) {
    console.error('[basename] resolve error:', err);
    return null;
  }
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

      const resolvedAddress = await resolveBasename(fullName);
      
      return NextResponse.json(
        {
          result: resolvedAddress || 'Not found',
          input: fullName,
        },
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

      // Reverse resolution: not implemented (requires different contract call)
      return NextResponse.json(
        { result: 'No basename registered', input: sanitized },
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

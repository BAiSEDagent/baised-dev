import { NextRequest, NextResponse } from 'next/server';
import { mainnetClient } from '@/lib/viem-client';
import { normalize } from 'viem/ens';
import { isAddress } from 'viem';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export const runtime = 'edge';

// Input validation helpers
function sanitizeInput(input: string): string {
  // Strip control characters
  return input.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

function validateBasename(name: string): boolean {
  // Basenames must be lowercase alphanumeric + hyphens, 3-63 chars
  return /^[a-z0-9-]{3,63}$/.test(name);
}

export async function GET(req: NextRequest) {
  // C-2: Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier);
  
  if (!rateLimitResult.allowed) {
    // M-1: Request logging
    console.log('[basename] rate_limit_exceeded', { identifier });
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
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const address = searchParams.get('address');

    // M-1: Request logging
    console.log('[basename] request', { name, address, identifier, timestamp: Date.now() });

    if (name) {
      // Forward resolution: name → address
      const sanitized = sanitizeInput(name.toLowerCase());

      // Add .base.eth if not present
      const fullName = sanitized.endsWith('.base.eth') ? sanitized : `${sanitized}.base.eth`;

      // Validate basename format
      const basePart = fullName.replace('.base.eth', '');
      if (!validateBasename(basePart)) {
        return NextResponse.json(
          { error: 'Invalid basename format' },
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': 'https://baised.dev',
            },
          }
        );
      }

      // Resolve using ENS (H-1: timeout already in viem-client.ts)
      const normalized = normalize(fullName);
      const resolvedAddress = await mainnetClient.getEnsAddress({
        name: normalized,
      });

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
      // Reverse resolution: address → name
      const sanitized = sanitizeInput(address);

      if (!isAddress(sanitized)) {
        return NextResponse.json(
          { error: 'Invalid Ethereum address' },
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': 'https://baised.dev',
            },
          }
        );
      }

      const ensName = await mainnetClient.getEnsName({
        address: sanitized as `0x${string}`,
      });

      return NextResponse.json(
        {
          result: ensName || 'No basename registered',
          input: sanitized,
        },
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
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': 'https://baised.dev',
          },
        }
      );
    }
  } catch (error) {
    // H-2: Generic error message (no stack trace leak)
    console.error('[basename] resolution_error', error);
    return NextResponse.json(
      { error: 'Resolution failed. Please try again.' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': 'https://baised.dev',
        },
      }
    );
  }
}

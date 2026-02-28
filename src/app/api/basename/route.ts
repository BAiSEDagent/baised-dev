import { NextRequest, NextResponse } from 'next/server';
import { baseClient } from '@/lib/viem-client';
import { normalize } from 'viem/ens';
import { isAddress } from 'viem';

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
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name');
    const address = searchParams.get('address');

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
          { status: 400 }
        );
      }

      // Resolve using ENS
      const normalized = normalize(fullName);
      const resolvedAddress = await baseClient.getEnsAddress({
        name: normalized,
      });

      return NextResponse.json({
        result: resolvedAddress || 'Not found',
        input: fullName,
      });
    } else if (address) {
      // Reverse resolution: address → name
      const sanitized = sanitizeInput(address);

      if (!isAddress(sanitized)) {
        return NextResponse.json(
          { error: 'Invalid Ethereum address' },
          { status: 400 }
        );
      }

      const ensName = await baseClient.getEnsName({
        address: sanitized as `0x${string}`,
      });

      return NextResponse.json({
        result: ensName || 'No basename registered',
        input: sanitized,
      });
    } else {
      return NextResponse.json(
        { error: 'Provide either name or address parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Basename resolution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Resolution failed' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { decodeFunctionData, parseAbi, isHex } from 'viem';
import { checkRateLimit, getRateLimitIdentifier } from '@/lib/rate-limit';

export const runtime = 'edge';

// In-memory cache for 4byte lookups
interface CacheEntry {
  signatures: string[];
  timestamp: number;
}

const signatureCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3600000; // 1 hour

export async function POST(req: NextRequest) {
  // Rate limiting
  const identifier = getRateLimitIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier);
  
  if (!rateLimitResult.allowed) {
    console.log('[decode-calldata] rate_limit_exceeded', { identifier });
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
    const body = await req.json();
    const { calldata } = body;

    // Logging
    console.log('[decode-calldata] request', { identifier, calldataLength: calldata?.length });

    // Validate input
    if (!calldata || typeof calldata !== 'string') {
      return NextResponse.json(
        { error: 'calldata is required' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
      );
    }

    if (!isHex(calldata)) {
      return NextResponse.json(
        { error: 'Invalid hex string. Must start with 0x' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
      );
    }

    if (calldata.length < 10) {
      return NextResponse.json(
        { error: 'Calldata too short. Must include function selector (4 bytes)' },
        { status: 400, headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
      );
    }

    // Extract function selector (first 4 bytes)
    const selector = calldata.slice(0, 10); // 0x + 8 hex chars

    // Check cache first
    const cachedEntry = signatureCache.get(selector);
    const now = Date.now();
    
    let signatures: string[];

    if (cachedEntry && (now - cachedEntry.timestamp) < CACHE_TTL_MS) {
      signatures = cachedEntry.signatures;
      console.log('[decode-calldata] cache_hit', { selector });
    } else {
      // Fetch from 4byte.directory
      try {
        const fourbyteRes = await fetch(
          `https://www.4byte.directory/api/v1/signatures/?hex_signature=${selector}`,
          { signal: AbortSignal.timeout(5000) } // 5s timeout
        );

        if (!fourbyteRes.ok) {
          throw new Error(`4byte API returned ${fourbyteRes.status}`);
        }

        const data = await fourbyteRes.json();
        signatures = data.results?.map((r: { text_signature: string }) => r.text_signature) || [];

        // Cache result
        signatureCache.set(selector, { signatures, timestamp: now } as CacheEntry);
        console.log('[decode-calldata] 4byte_lookup', { selector, count: signatures.length });
      } catch (fourbyteError) {
        console.warn('[decode-calldata] 4byte_unavailable', fourbyteError);
        signatures = [];
      }
    }

    // Decode using first signature (most common match)
    if (signatures.length === 0) {
      return NextResponse.json(
        {
          success: false,
          selector,
          functionName: `Unknown function ${selector}`,
          params: null,
          rawCalldata: calldata,
        },
        { headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
      );
    }

    const signature = signatures[0];

    try {
      // Type assertion needed because signature is dynamic at runtime
      const abi = parseAbi([`function ${signature}`] as readonly string[]);
      const decoded = decodeFunctionData({
        abi,
        data: calldata as `0x${string}`,
      });

      return NextResponse.json(
        {
          success: true,
          selector,
          functionName: decoded.functionName,
          params: decoded.args as unknown[],
          signature,
          alternativeSignatures: signatures.slice(1, 3), // Show up to 2 alternatives
        },
        { headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
      );
    } catch {
      // Decode failed - return error
      return NextResponse.json(
        {
          success: false,
          selector,
          functionName: signature,
          params: null,
          error: 'Failed to decode parameters',
          rawCalldata: calldata,
        },
        { headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' } }
      );
    }
  } catch (error) {
    console.error('[decode-calldata] error', error);
    return NextResponse.json(
      { error: 'Decoding failed. Please try again.' },
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': 'https://baised.dev' },
      }
    );
  }
}

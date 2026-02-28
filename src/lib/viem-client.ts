/**
 * Viem public client for Base mainnet
 * Used for Basename resolution and gas estimation
 */
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// C-3: Validate CDP_API_KEY environment variable at runtime
// In build/dev mode, Next.js may not have all env vars loaded yet
// The actual validation happens when the client makes a request
const CDP_API_KEY = process.env.CDP_API_KEY || '';

if (typeof window === 'undefined' && !CDP_API_KEY && process.env.NODE_ENV !== 'test') {
  // Only warn during build, actual error will occur at runtime when API is called
  console.warn('[viem-client] CDP_API_KEY not set - API calls will fail at runtime');
}

export const baseClient = createPublicClient({
  chain: base,
  transport: http(
    CDP_API_KEY 
      ? `https://api.developer.coinbase.com/rpc/v1/base/${CDP_API_KEY}`
      : 'https://mainnet.base.org', // Fallback to public RPC (will be rate-limited)
    {
      timeout: 5000, // H-1: 5s timeout on all RPC calls
    }
  ),
});

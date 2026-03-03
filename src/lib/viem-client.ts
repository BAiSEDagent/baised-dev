/**
 * Viem public client for Base mainnet
 * Used for Basename resolution (L2 resolver), gas estimation, contract reads
 */
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const CDP_API_KEY = process.env.CDP_API_KEY || '';

if (typeof window === 'undefined' && !CDP_API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('[viem-client] CDP_API_KEY not set - API calls will fail at runtime');
}

export const baseClient = createPublicClient({
  chain: base,
  transport: http(
    CDP_API_KEY 
      ? `https://api.developer.coinbase.com/rpc/v1/base/${CDP_API_KEY}`
      : 'https://mainnet.base.org',
    {
      timeout: 5000,
    }
  ),
});

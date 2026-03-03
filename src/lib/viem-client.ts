/**
 * Viem public clients for Base mainnet and Ethereum L1
 * baseClient: gas estimation, contract reads on Base
 * mainnetClient: ENS/Basename resolution (CCIP-Read requires L1)
 */
import { createPublicClient, http } from 'viem';
import { base, mainnet } from 'viem/chains';

// C-3: Validate CDP_API_KEY environment variable at runtime
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

// L1 client for ENS resolution — Basenames use CCIP-Read via L1 Universal Resolver
// Must be Ethereum mainnet (not Base) — ENS contracts live on L1
export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com', {
    timeout: 10000, // ENS CCIP-Read can be slow
  }),
});

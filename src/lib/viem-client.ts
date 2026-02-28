/**
 * Viem public client for Base mainnet
 * Used for Basename resolution and gas estimation
 */
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

export const baseClient = createPublicClient({
  chain: base,
  transport: http(`https://api.developer.coinbase.com/rpc/v1/base/${process.env.CDP_API_KEY}`),
});

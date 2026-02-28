import { createPublicClient, http, type Hash, type Address, getAddress } from 'viem';
import { base } from 'viem/chains';

// Base Mainnet USDC (Circle)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const USDC_DECIMALS = 6;

// x402 payment configuration
export const X402_CONFIG = {
  payee: '0x7458B08E13bBC390cD2CF6a8cE8980e4954E13b8' as Address, // baisedagent.base.eth
  /** Minimum payment in USDC atomic units (1e6 = 1 USDC). 0.01 USDC = 10000 */
  minAmount: BigInt(10000), // 0.01 USDC
  asset: `eip155:8453/erc20:${USDC_ADDRESS}`,
  network: 'base',
} as const;

const client = createPublicClient({
  chain: base,
  transport: http(process.env.BASE_RPC_URL || 'https://mainnet.base.org'),
});

export interface PaymentVerification {
  valid: boolean;
  payer: Address;
  amount: string; // wei string
  blockNumber: number;
  error?: string;
}

/**
 * Verify a USDC transfer on Base to the configured payee.
 * Returns payer address, amount, and block if valid.
 */
export async function verifyPayment(txHash: Hash): Promise<PaymentVerification> {
  const fail = (error: string): PaymentVerification => ({
    valid: false,
    payer: '0x0000000000000000000000000000000000000000',
    amount: '0',
    blockNumber: 0,
    error,
  });

  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    if (!receipt || receipt.status !== 'success') {
      return fail('Transaction not found or reverted');
    }

    // Find USDC Transfer log to our payee
    const transferLog = receipt.logs.find((log) => {
      if (log.address.toLowerCase() !== USDC_ADDRESS.toLowerCase()) return false;
      if (log.topics.length < 3) return false;

      // topics[2] is the `to` address (padded to 32 bytes)
      const toAddress = '0x' + (log.topics[2]?.slice(26) || '');
      return toAddress.toLowerCase() === X402_CONFIG.payee.toLowerCase();
    });

    if (!transferLog) {
      return fail('No USDC transfer to payee found in transaction');
    }

    // Decode the transfer
    const from = getAddress('0x' + (transferLog.topics[1]?.slice(26) || ''));
    const value = BigInt(transferLog.data);

    if (value < X402_CONFIG.minAmount) {
      return fail(`Payment below minimum: ${value} < ${X402_CONFIG.minAmount}`);
    }

    return {
      valid: true,
      payer: from,
      amount: value.toString(),
      blockNumber: Number(receipt.blockNumber),
    };
  } catch (error) {
    return fail(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate x402 challenge headers for 402 responses.
 */
export function paymentRequiredHeaders(): Record<string, string> {
  return {
    'X-Payment-Address': X402_CONFIG.payee,
    'X-Payment-Amount': X402_CONFIG.minAmount.toString(),
    'X-Payment-Asset': X402_CONFIG.asset,
    'X-Payment-Network': X402_CONFIG.network,
    'X-Payment-Decimals': String(USDC_DECIMALS),
  };
}

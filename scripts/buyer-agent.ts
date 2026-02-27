#!/usr/bin/env npx tsx
/**
 * buyer-agent.ts — Autonomous x402 Buyer Agent for baised.dev
 *
 * Demonstrates the full monetization loop:
 *   1. Query /api/intel → receive 402 challenge with payment params
 *   2. Send USDC on Base to the specified payee
 *   3. Wait for onchain confirmation
 *   4. Replay request with X-Payment-TxHash → receive decrypted intel
 *
 * Usage:
 *   PRIVATE_KEY=0x... npx tsx scripts/buyer-agent.ts
 *
 * Requirements:
 *   - Funded wallet on Base mainnet with ≥0.01 USDC + ETH for gas
 *   - viem installed (already in project deps)
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  encodeFunctionData,
  type Hex,
  type Address,
} from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ── Config ──────────────────────────────────────────────────────────
const BAISED_API = 'https://baised.dev/api/intel';
const BASE_RPC = 'https://mainnet.base.org';

const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const;
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ── Helpers ─────────────────────────────────────────────────────────
function log(stage: string, msg: string) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] [${stage}] ${msg}`);
}

function die(msg: string): never {
  console.error(`\n🔴 FATAL: ${msg}`);
  process.exit(1);
}

// ── Step 1: Hit the 402 Challenge ───────────────────────────────────
async function fetchChallenge(): Promise<{
  payee: Address;
  amount: bigint;
  decimals: number;
}> {
  log('CHALLENGE', `GET ${BAISED_API} (no payment header)`);

  const res = await fetch(BAISED_API);

  if (res.status !== 402) {
    die(`Expected 402, got ${res.status}. Is x402 gate enabled?`);
  }

  const payee = res.headers.get('X-Payment-Address') as Address;
  const amount = BigInt(res.headers.get('X-Payment-Amount') || '0');
  const decimals = parseInt(res.headers.get('X-Payment-Decimals') || '6');
  const asset = res.headers.get('X-Payment-Asset') || '';
  const network = res.headers.get('X-Payment-Network') || '';

  log('CHALLENGE', `402 received. Payment parameters:`);
  log('CHALLENGE', `  Payee:    ${payee}`);
  log('CHALLENGE', `  Amount:   ${amount} (${Number(amount) / 10 ** decimals} USDC)`);
  log('CHALLENGE', `  Asset:    ${asset}`);
  log('CHALLENGE', `  Network:  ${network}`);

  if (!payee || amount === 0n) {
    die('Invalid challenge headers — missing payee or amount');
  }

  return { payee, amount, decimals };
}

// ── Step 2: Send USDC Payment ───────────────────────────────────────
async function sendPayment(
  privateKey: Hex,
  payee: Address,
  amount: bigint
): Promise<Hex> {
  const account = privateKeyToAccount(privateKey);
  log('PAYMENT', `Wallet: ${account.address}`);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(BASE_RPC),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(BASE_RPC),
  });

  // Check USDC balance
  const balanceData = await publicClient.readContract({
    address: USDC_ADDRESS,
    abi: [
      {
        name: 'balanceOf',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'account', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'balanceOf',
    args: [account.address],
  });

  const balance = balanceData as bigint;
  log('PAYMENT', `USDC balance: ${Number(balance) / 1e6} USDC`);

  if (balance < amount) {
    die(
      `Insufficient USDC. Need ${Number(amount) / 1e6}, have ${Number(balance) / 1e6}`
    );
  }

  // Build ERC-20 transfer
  log('PAYMENT', `Sending ${Number(amount) / 1e6} USDC to ${payee}...`);

  const data = encodeFunctionData({
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [payee, amount],
  });

  const hash = await walletClient.sendTransaction({
    to: USDC_ADDRESS,
    data,
  });

  log('PAYMENT', `Tx submitted: ${hash}`);
  log('PAYMENT', `Waiting for confirmation...`);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  if (receipt.status !== 'success') {
    die(`Transaction reverted: ${hash}`);
  }

  log('PAYMENT', `✅ Confirmed in block ${receipt.blockNumber}`);
  return hash;
}

// ── Step 3: Redeem Intel ────────────────────────────────────────────
async function redeemIntel(txHash: Hex): Promise<void> {
  log('REDEEM', `GET ${BAISED_API}`);
  log('REDEEM', `  X-Payment-TxHash: ${txHash}`);

  const res = await fetch(BAISED_API, {
    headers: { 'X-Payment-TxHash': txHash },
  });

  const body = await res.json();

  if (res.status === 402) {
    // Payment verification failed — tx might not be indexed yet
    log('REDEEM', `⏳ 402 — verification pending: ${body.detail || body.error}`);
    log('REDEEM', `Retrying in 5s...`);
    await new Promise((r) => setTimeout(r, 5000));
    return redeemIntel(txHash); // Recursive retry
  }

  if (res.status === 409) {
    die(`409 Conflict — tx hash already used: ${txHash}`);
  }

  if (res.status !== 200) {
    die(`Unexpected ${res.status}: ${JSON.stringify(body)}`);
  }

  // ── Success ─────────────────────────────────────────────────────
  log('REDEEM', `✅ 200 OK — Intel decrypted`);
  log('REDEEM', `  Payer: ${body.payment?.payer}`);
  log('REDEEM', `  Posts: ${body.count}`);

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  DECRYPTED INTEL FEED');
  console.log('═══════════════════════════════════════════════════\n');

  for (const post of body.intel) {
    const premium = post.isPremium ? ` [PREMIUM: $${post.priceUsdc} USDC]` : '';
    console.log(`[${post.category.toUpperCase()}]${premium}`);
    console.log(`  ${post.intelPayload.title}`);
    if (post.intelPayload.body) {
      console.log(`  ${post.intelPayload.body.slice(0, 200)}...`);
    }
    console.log();
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('  x402 PAYMENT VERIFIED. STAY BAISED.');
  console.log('═══════════════════════════════════════════════════\n');
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔵 BAiSED Buyer Agent v1.0');
  console.log('   Autonomous x402 Intel Acquisition\n');

  const privateKey = process.env.PRIVATE_KEY as Hex | undefined;
  if (!privateKey || !privateKey.startsWith('0x')) {
    die('Set PRIVATE_KEY env var (0x-prefixed hex). Needs USDC + ETH on Base.');
  }

  // Step 1: Get challenge
  const challenge = await fetchChallenge();

  // Step 2: Send payment
  const txHash = await sendPayment(privateKey, challenge.payee, challenge.amount);

  // Step 3: Redeem
  await redeemIntel(txHash);
}

main().catch((err) => {
  console.error('\n🔴 Unhandled error:', err.message || err);
  process.exit(1);
});

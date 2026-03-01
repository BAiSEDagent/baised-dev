/**
 * Full file structure templates for OnchainKit components.
 * Plan A: Show complete working app setup, not just component snippets.
 */

export interface FileTemplate {
  filename: string;
  language: string;
  content: string;
}

export interface ComponentTemplate {
  component: string;
  description: string;
  files: FileTemplate[];
  dependencies: Record<string, string>;
}

// Shared layout template (used by all components)
const LAYOUT_TEMPLATE = `import type { Metadata } from 'next';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { base } from 'viem/chains';
import '@coinbase/onchainkit/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'My Base App',
  description: 'Built with OnchainKit on Base',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <OnchainKitProvider
          apiKey={process.env.NEXT_PUBLIC_CDP_API_KEY}
          chain={base}
        >
          {children}
        </OnchainKitProvider>
      </body>
    </html>
  );
}`;

const ENV_TEMPLATE = `# Get your CDP API key at https://portal.cdp.coinbase.com
NEXT_PUBLIC_CDP_API_KEY=YOUR_CDP_API_KEY_HERE`;

const SHARED_DEPS: Record<string, string> = {
  'next': '^14.2.0',
  'react': '^18.3.0',
  'react-dom': '^18.3.0',
  '@coinbase/onchainkit': '^0.36.0',
  'viem': '^2.20.0',
};

export const COMPONENT_TEMPLATES: Record<string, ComponentTemplate> = {
  Identity: {
    component: 'Identity',
    description: 'Display user identity with basename, avatar, and verification badge',
    files: [
      { filename: 'app/layout.tsx', language: 'tsx', content: LAYOUT_TEMPLATE },
      {
        filename: 'app/page.tsx',
        language: 'tsx',
        content: `'use client';

import { Identity, Name, Avatar, Badge, Address } from '@coinbase/onchainkit/identity';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Identity
        address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
      >
        <Avatar />
        <Name />
        <Badge />
        <Address />
      </Identity>
    </main>
  );
}`,
      },
      { filename: '.env.local.example', language: 'bash', content: ENV_TEMPLATE },
    ],
    dependencies: SHARED_DEPS,
  },

  Wallet: {
    component: 'Wallet',
    description: 'Connect/disconnect wallet with dropdown menu',
    files: [
      { filename: 'app/layout.tsx', language: 'tsx', content: LAYOUT_TEMPLATE },
      {
        filename: 'app/page.tsx',
        language: 'tsx',
        content: `'use client';

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import { Avatar, Name, Identity } from '@coinbase/onchainkit/identity';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Wallet>
        <ConnectWallet>
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
          </Identity>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </main>
  );
}`,
      },
      { filename: '.env.local.example', language: 'bash', content: ENV_TEMPLATE },
    ],
    dependencies: SHARED_DEPS,
  },

  Swap: {
    component: 'Swap',
    description: 'Token swap interface with USDC/ETH pair',
    files: [
      { filename: 'app/layout.tsx', language: 'tsx', content: LAYOUT_TEMPLATE },
      {
        filename: 'app/page.tsx',
        language: 'tsx',
        content: `'use client';

import { Swap, SwapAmountInput, SwapButton, SwapToggle } from '@coinbase/onchainkit/swap';
import type { Token } from '@coinbase/onchainkit/token';

const ETH_TOKEN: Token = {
  name: 'Ethereum',
  address: '',
  symbol: 'ETH',
  decimals: 18,
  image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
  chainId: 8453,
};

const USDC_TOKEN: Token = {
  name: 'USD Coin',
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  symbol: 'USDC',
  decimals: 6,
  image: 'https://d3r81g40ber1hp.cloudfront.net/wallet/wais/44/2b/442b80bd16af0c0d9b22e03a16753823fe826e5bfd457292b55fa0ba8c1ba213-ZWUzYjJmZGUtMDYxNy00NDcyLTg0NjQtMWI4OGEwYjBiODE2',
  chainId: 8453,
};

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Swap>
        <SwapAmountInput label="Sell" swappableTokens={[ETH_TOKEN, USDC_TOKEN]} token={ETH_TOKEN} type="from" />
        <SwapToggle />
        <SwapAmountInput label="Buy" swappableTokens={[ETH_TOKEN, USDC_TOKEN]} token={USDC_TOKEN} type="to" />
        <SwapButton />
      </Swap>
    </main>
  );
}`,
      },
      { filename: '.env.local.example', language: 'bash', content: ENV_TEMPLATE },
    ],
    dependencies: SHARED_DEPS,
  },

  Fund: {
    component: 'Fund',
    description: 'One-click fiat onramp button for users to buy crypto',
    files: [
      { filename: 'app/layout.tsx', language: 'tsx', content: LAYOUT_TEMPLATE },
      {
        filename: 'app/page.tsx',
        language: 'tsx',
        content: `'use client';

import { FundButton } from '@coinbase/onchainkit/fund';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <FundButton />
    </main>
  );
}`,
      },
      { filename: '.env.local.example', language: 'bash', content: ENV_TEMPLATE },
    ],
    dependencies: SHARED_DEPS,
  },

  Transaction: {
    component: 'Transaction',
    description: 'Execute and track on-chain transactions with status updates',
    files: [
      { filename: 'app/layout.tsx', language: 'tsx', content: LAYOUT_TEMPLATE },
      {
        filename: 'app/page.tsx',
        language: 'tsx',
        content: `'use client';

import {
  Transaction,
  TransactionButton,
  TransactionStatus,
  TransactionStatusAction,
  TransactionStatusLabel,
} from '@coinbase/onchainkit/transaction';
import type { LifecycleStatus } from '@coinbase/onchainkit/transaction';

const CONTRACT_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC on Base

const contracts = [
  {
    address: CONTRACT_ADDRESS as \`0x\${string}\`,
    abi: [
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
    ] as const,
    functionName: 'transfer',
    args: [
      '0xYOUR_RECIPIENT_ADDRESS_HERE', // ← replace with recipient address
      BigInt(1000000), // 1 USDC (6 decimals)
    ],
  },
];

export default function Home() {
  const handleOnStatus = (status: LifecycleStatus) => {
    console.log('Transaction status:', status);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <Transaction
        contracts={contracts}
        onStatus={handleOnStatus}
      >
        <TransactionButton text="Send 1 USDC" />
        <TransactionStatus>
          <TransactionStatusLabel />
          <TransactionStatusAction />
        </TransactionStatus>
      </Transaction>
    </main>
  );
}`,
      },
      { filename: '.env.local.example', language: 'bash', content: ENV_TEMPLATE },
    ],
    dependencies: SHARED_DEPS,
  },
};

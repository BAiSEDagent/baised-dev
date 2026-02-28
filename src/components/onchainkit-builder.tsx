'use client';

import { useState } from 'react';

const COMPONENTS = {
  Identity: {
    code: `import { Identity, Name, Avatar, Badge, Address } from '@coinbase/onchainkit/identity';

<Identity address="0x...">
  <Avatar />
  <Name />
  <Badge />
  <Address />
</Identity>`,
    imports: '@coinbase/onchainkit/identity',
  },
  Wallet: {
    code: `import { Wallet, ConnectWallet, WalletDropdown } from '@coinbase/onchainkit/wallet';

<Wallet>
  <ConnectWallet>
    <Avatar />
    <Name />
  </ConnectWallet>
  <WalletDropdown>
    <Identity />
  </WalletDropdown>
</Wallet>`,
    imports: '@coinbase/onchainkit/wallet',
  },
  Swap: {
    code: `import { Swap, SwapAmountInput, SwapButton, SwapToggle } from '@coinbase/onchainkit/swap';

<Swap>
  <SwapAmountInput label="Sell" token={USDC_TOKEN} />
  <SwapToggle />
  <SwapAmountInput label="Buy" token={ETH_TOKEN} />
  <SwapButton />
</Swap>`,
    imports: '@coinbase/onchainkit/swap',
  },
  Fund: {
    code: `import { FundButton } from '@coinbase/onchainkit/fund';

<FundButton />`,
    imports: '@coinbase/onchainkit/fund',
  },
  Transaction: {
    code: `import { Transaction, TransactionButton, TransactionStatus } from '@coinbase/onchainkit/transaction';

<Transaction
  contracts={[{
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: 'transfer',
    args: [recipient, amount],
  }]}
  onSuccess={(response) => console.log('TX:', response.transactionReceipts[0].transactionHash)}
>
  <TransactionButton text="Send" />
  <TransactionStatus />
</Transaction>`,
    imports: '@coinbase/onchainkit/transaction',
  },
};

export function OnchainKitBuilder() {
  const [selected, setSelected] = useState<keyof typeof COMPONENTS>('Identity');
  const [copied, setCopied] = useState(false);

  // H-3: Clipboard error handling
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COMPONENTS[selected].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // M-2: Analytics
      console.log('[analytics] component_copied', { component: selected });
    } catch (err) {
      console.error('[analytics] copy_failed', err);
      // Fallback for non-HTTPS or permission denied
      alert('Copy failed. Please copy manually or enable clipboard permissions.');
    }
  };

  return (
    <div className="workbench-module">
      <h4 className="font-mono text-xs font-bold text-[#ededed] mb-3">
        OnchainKit Component Builder
      </h4>

      {/* Component Selector */}
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="OnchainKit component selector">
        {Object.keys(COMPONENTS).map((comp) => (
          <button
            key={comp}
            onClick={() => setSelected(comp as keyof typeof COMPONENTS)}
            aria-label={`Select ${comp} component`} // M-4: Accessibility
            aria-pressed={selected === comp} // M-4: Accessibility
            className={`font-mono text-xs px-2.5 py-1 border transition-colors ${
              selected === comp
                ? 'bg-[#0052FF] text-white border-[#0052FF]'
                : 'bg-transparent text-[#787878] border-[#2a3a4a] hover:border-[#0052FF] hover:text-[#0052FF]'
            }`}
          >
            {comp}
          </button>
        ))}
      </div>

      {/* Code Output */}
      <div className="relative">
        <pre className="code-block bg-[#0a0c12] border border-[#1a2a3a] p-3 overflow-x-auto text-[10px] leading-relaxed">
          <code className="text-[#c8c8c8]">{COMPONENTS[selected].code}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 font-mono text-[10px] px-2 py-1 bg-[#1a2a3a] text-[#787878] hover:text-[#00C853] border border-[#2a3a4a] hover:border-[#00C853] transition-colors"
        >
          {copied ? '✓ COPIED' : 'COPY'}
        </button>
      </div>

      <p className="font-mono text-[10px] text-[#555] mt-2">
        Install: <span className="text-[#0052FF]">npm install @coinbase/onchainkit</span>
      </p>
      <p className="font-mono text-[10px] text-[#555] mt-0.5">
        Requires CDP API key in .env.local
      </p>
    </div>
  );
}

import type { Metadata } from 'next';
import { MiniAppProviders } from './providers';
import { MiniAppContent } from './miniapp-content';

export const metadata: Metadata = {
  title: 'BAiSED Mini App — Base Developer Tools',
  description:
    'Faucet, basename resolver, gas tracker, and ABI decoder inside your wallet.',
};

export default function MiniAppPage() {
  return (
    <MiniAppProviders>
      <MiniAppContent />
    </MiniAppProviders>
  );
}

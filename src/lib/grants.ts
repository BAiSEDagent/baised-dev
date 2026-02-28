/**
 * Base Ecosystem Grants — curated funding opportunities for builders.
 * Updated manually or via cron scraping. Static data with clear apply links.
 */

export interface Grant {
  name: string;
  amount: string;
  stage: string;
  description: string;
  applyUrl: string;
  status: 'open' | 'upcoming' | 'ongoing';
}

export function getBaseGrants(): Grant[] {
  return [
    {
      name: 'Weekly Builder Rewards',
      amount: '2 ETH/week',
      stage: 'Prototype',
      description: 'Weekly rewards for active builders. Prototypes and experiments welcome.',
      applyUrl: 'https://www.builderscore.xyz/',
      status: 'ongoing',
    },
    {
      name: 'Builder Grants',
      amount: '1–5 ETH',
      stage: 'Shipped',
      description: 'Fast retroactive grants for projects live on Base mainnet.',
      applyUrl: 'https://docs.base.org/get-started/get-funded#builder-grants-live-on-base',
      status: 'open',
    },
    {
      name: 'Base Batches',
      amount: 'Up to $100K+',
      stage: 'Founder',
      description: 'Comprehensive founder program with mentorship, resources, and funding.',
      applyUrl: 'https://docs.base.org/get-started/get-funded#base-batches-the-founder-track',
      status: 'open',
    },
  ];
}

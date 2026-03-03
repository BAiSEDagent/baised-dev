export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL || 'https://baised.dev';

  return Response.json({
    accountAssociation: {
      header: '',
      payload: '',
      signature: '',
    },
    miniapp: {
      version: '1',
      name: 'BAiSED',
      homeUrl: `${URL}/miniapp`,
      iconUrl: `${URL}/icon.png`,
      splashImageUrl: `${URL}/icon.png`,
      splashBackgroundColor: '#080a10',
      subtitle: 'Base Developer Tools',
      description:
        'Faucet, basename resolver, gas tracker, and ABI decoder — all inside your wallet. Built for Base builders.',
      screenshotUrls: [],
      primaryCategory: 'developer-tools',
      tags: ['base', 'developer', 'faucet', 'tools', 'devrel'],
      heroImageUrl: `${URL}/og`,
      tagline: 'Dev tools in your wallet',
      ogTitle: 'BAiSED — Base Developer Tools',
      ogDescription:
        'Faucet, basename resolver, gas tracker, and ABI decoder. No tab switching.',
      ogImageUrl: `${URL}/og`,
      noindex: false,
    },
  });
}

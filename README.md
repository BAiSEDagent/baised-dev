# baised.dev

Base ecosystem intelligence hub. Live chain telemetry, protocol analytics, and builder resources — powered by an AI agent.

**[baised.dev](https://baised.dev)** · **[@baised_agent](https://x.com/baised_agent)**

## What It Does

- **Live Chain Metrics** — Base TVL, DEX volume, fees, gas price, block height. Updated every 12s–5min from Coinbase CDP RPC + DeFiLlama.
- **Protocol Activity** — Top Base protocols by TVL with 7-day sparkline charts and 24h change. Base-specific data only.
- **Base Engineering Feed** — Latest posts from the Base core team blog (blog.base.dev), pulled via RSS.
- **Grants & Funding** — Curated funding opportunities: Weekly Builder Rewards, Builder Grants, OP Retro Funding, Base Batches, Gitcoin Rounds.
- **Weekly Digest** — Auto-generated ecosystem summary at [/digest](https://baised.dev/digest). Chain metrics, top protocols, engineering updates.
- **Intel Feed** — Published ecosystem reports and alerts, stored in Postgres. Premium posts gated via x402 onchain USDC micropayments.
- **Search** — Full-text search across all intel posts at [/search](https://baised.dev/search).
- **RSS** — Subscribe at [/feed.xml](https://baised.dev/feed.xml). Includes intel posts and weekly digest.
- **Builder Toolkit** — Curated links: OnchainKit, Basenames, Base Paymaster, ERC-8021, Base Docs.
- **Network Status** — Real-time Base network component status from status.base.org.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14.2 (App Router, RSC) |
| Styling | Tailwind CSS 3.4, Geist Mono |
| Database | Neon Postgres (Prisma 5.22) |
| RPC | Coinbase CDP (Base Mainnet + Sepolia) |
| Data | DeFiLlama API, Base Status API, blog.base.dev RSS |
| Payments | x402 protocol — onchain USDC verification via Viem |
| Hosting | Vercel (auto-deploy from `main`) |
| Tests | Vitest — 26 tests across 4 suites |

## Architecture

```
baised.dev
├── src/app/
│   ├── page.tsx              # Command Deck (main dashboard)
│   ├── digest/page.tsx       # Weekly ecosystem digest
│   ├── search/page.tsx       # Intel search (client-side)
│   ├── dashboard/page.tsx    # Extended dashboard
│   ├── api/
│   │   ├── intel/route.ts    # x402-gated intel API
│   │   ├── search/route.ts   # Full-text search API
│   │   └── stats/route.ts    # Public stats endpoint
│   ├── feed.xml/route.ts     # RSS feed
│   └── opengraph-image.tsx   # Dynamic OG image
├── src/lib/
│   ├── base-intel.ts         # Chain telemetry (RPC + DeFiLlama)
│   ├── base-changelog.ts     # Protocol activity (Base-specific TVL)
│   ├── base-blog.ts          # Engineering blog RSS parser
│   ├── base-status.ts        # Network status
│   ├── weekly-digest.ts      # Auto-generated digest
│   ├── grants.ts             # Curated funding data
│   ├── x402.ts               # Payment verification
│   ├── validate.ts           # Input validation
│   ├── rate-limit.ts         # Sliding window rate limiter
│   └── db.ts                 # Prisma client
├── src/components/
│   └── sparkline.tsx          # SVG sparkline charts
├── scripts/
│   ├── intel-cron.ts         # Automated intel publisher
│   └── buyer-agent.ts        # Autonomous x402 buyer agent
└── prisma/
    └── schema.prisma         # IntelPost + PaymentLedger models
```

## Security

- Rate limiting: 10 req/min/IP (sliding window, `x-vercel-forwarded-for`)
- Input validation: 10KB max payload, field constraints
- CORS + security headers (HSTS 2yr preload, X-Frame-Options, CSP)
- x402 payment gate: onchain USDC verification, replay protection via unique `txHash`
- `Cache-Control: no-store` on all API routes
- Secrets in environment variables only (never committed)

## Development

```bash
npm install
cp .env.example .env.local  # Add your keys
npx prisma generate
npm run dev
```

## Tests

```bash
npm test           # Run all 26 tests
npm test -- --ui   # Vitest UI
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BASE_RPC_URL` | Coinbase CDP RPC endpoint (Base Mainnet) |
| `BASE_SEPOLIA_RPC_URL` | Coinbase CDP RPC endpoint (Base Sepolia) |
| `NEXT_PUBLIC_CDP_CLIENT_API_KEY` | CDP Client API Key (public, for OnchainKit) |
| `DATABASE_URL` | Neon Postgres connection string |
| `BAISED_AGENT_SECRET` | API authentication secret |

## License

MIT

---

Built by [BAiSED](https://x.com/baised_agent) · No hype. No speculation. Just signal.

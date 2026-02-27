# baised.dev v2 — Architecture & Design Spec

> Written under Coding Governor enforcement.
> This document is the single source of truth for the v2 rebuild.
> No code ships without satisfying every section.

---

## 1. Plan — Requirements

### 1.1 What baised.dev IS
- The personal technical home of BAiSED — a Principal Engineer and DevRel oracle for the Base ecosystem.
- A live intelligence dashboard that builders visit for signal, not noise.
- A statement of craft. The UI itself is the portfolio.

### 1.2 What baised.dev is NOT
- A blog template with a dark theme
- A hackathon demo
- A generic "terminal aesthetic" landing page

### 1.3 Core Requirements
1. **Live Base chain telemetry** — block height, status, latency
2. **Intel feed** — timestamped, categorized posts (devlog, ecosystem, security, alert)
3. **Authenticated write API** — POST /api/intel (agent-only, rate-limited)
4. **Public read API** — GET /api/intel (open, cached)
5. **Responsive** — mobile-first, no layout shifts
6. **Accessible** — WCAG AA contrast ratios minimum
7. **Fast** — Lighthouse Performance >95, First Load JS <100kB
8. **Secure** — rotated secrets, rate limiting, input validation, CORS

### 1.4 Acceptance Criteria
- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Zero layout shift (CLS = 0)
- [ ] All text passes WCAG AA contrast (4.5:1 body, 3:1 large)
- [ ] Rate limiting: 10 POST /api/intel per minute per IP
- [ ] Input validation: reject payloads >10KB, sanitize all fields
- [ ] Secret rotation complete, old secret invalidated
- [ ] Test suite: ≥ 5 tests covering API + rendering
- [ ] Ship Report generated and all gates passed

---

## 2. Design System — The Rules

### 2.1 Design Philosophy
Reference systems: **Geist** (Vercel), **Linear**, **Apple HIG**

Principles:
- **Reduction over addition.** Every element must earn its pixels.
- **Type is the interface.** Typography hierarchy creates navigation, not decorative borders.
- **Color is semantic.** Never decorative. Every color communicates state.
- **Whitespace is structure.** Generous padding creates rhythm and scannability.
- **Motion is meaning.** No animation without purpose. No CRT gimmicks.

### 2.2 Color System

#### Backgrounds (Geist-inspired)
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-1` | `#0A0A0A` | Page background (not pure black — easier on eyes) |
| `--bg-2` | `#111111` | Card/surface background |
| `--bg-3` | `#171717` | Elevated surface (hover states, modals) |

#### Borders (3-tier system)
| Token | Value | Usage |
|-------|-------|-------|
| `--border-1` | `#1A1A1A` | Default borders |
| `--border-2` | `#262626` | Hover borders |
| `--border-3` | `#333333` | Active/focus borders |

#### Text (semantic scale)
| Token | Value | Usage | Contrast vs bg-1 |
|-------|-------|-------|-------------------|
| `--text-primary` | `#EDEDED` | Headings, primary content | 15.4:1 ✅ |
| `--text-secondary` | `#A1A1A1` | Body text, descriptions | 7.5:1 ✅ |
| `--text-tertiary` | `#666666` | Timestamps, metadata | 4.5:1 ✅ (AA) |
| `--text-muted` | `#444444` | Disabled, decorative | 2.8:1 (decorative only) |

#### Accent Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-blue` | `#0052FF` | Base blue — brand, links, primary actions |
| `--accent-blue-hover` | `#3380FF` | Hover state |
| `--accent-green` | `#00C853` | Status: healthy, optimal, success |
| `--accent-amber` | `#FFB000` | Status: warning, alert, attention |
| `--accent-red` | `#FF3B30` | Status: error, critical, danger |

### 2.3 Typography

#### Font Stack
- **Display/Headings:** Geist Sans (already bundled as `GeistVF.woff`)
- **Body:** Geist Sans
- **Data/Code:** Geist Mono (already bundled as `GeistMonoVF.woff`)

Do NOT import JetBrains Mono externally. Geist Mono is the correct choice — it ships with the project and is designed by the same team that built the platform we deploy on.

#### Type Scale (8px grid, rem-based)
| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| Display | 2.5rem (40px) | 700 | 1.1 | -0.04em | Hero: "BAiSED" |
| H1 | 1.5rem (24px) | 600 | 1.2 | -0.02em | Section headers |
| H2 | 0.875rem (14px) | 600 | 1.3 | 0.05em (uppercase) | Card headers |
| Body | 0.875rem (14px) | 400 | 1.6 | 0 | Descriptions, intel body |
| Caption | 0.75rem (12px) | 400 | 1.4 | 0 | Metadata, timestamps |
| Micro | 0.625rem (10px) | 500 | 1.2 | 0.08em (uppercase) | Tags, labels, status |

### 2.4 Spacing System (8px grid)

All spacing uses multiples of 4px, with a strong preference for 8px increments:
```
4px  — tight internal padding (tags, badges)
8px  — default gap between related elements
12px — gap between items in a list
16px — section padding (mobile)
24px — card padding (desktop)
32px — gap between major sections
48px — page-level vertical rhythm
64px — hero spacing
```

**Rule:** No magic numbers. Every margin and padding must map to this scale.

### 2.5 Layout

#### Structure
```
┌─────────────────────────────────────────────────────┐
│  HEADER                                              │
│  ┌─────────┐                                         │
│  │  PFP    │  BAiSED                                 │
│  │  96×96  │  Principal_Engineer // baisedagent.base.eth │
│  └─────────┘  BLOCK: 42,693,903 // STATUS: OPTIMAL  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  INTEL FEED (full width — no sidebar)               │
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │ [DEVLOG] BLOCK #42,693,903 · 2m AGO            ││
│  │ GENESIS: OPERATIONAL CONTROL ASSUMED            ││
│  │ baised.dev is live. Neon Postgres connected...  ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
│  ┌─────────────────────────────────────────────────┐│
│  │ [ECOSYSTEM] BLOCK #42,700,100 · 1h AGO         ││
│  │ BASE BATCH 5 APPLICATIONS OPEN                  ││
│  │ Apply at base.dev/batches...                    ││
│  └─────────────────────────────────────────────────┘│
│                                                      │
├─────────────────────────────────────────────────────┤
│  FOOTER                                              │
│  STAY BAISED // THE CHAIN WHISPERS. I LISTEN.       │
└─────────────────────────────────────────────────────┘
```

**Key decision: Kill the sidebar.** The "SHIP_FAST_KITS" section is placeholder filler. It adds visual noise and zero value. The intel feed should be full-width with breathing room. If we add tooling links later, they go in a dedicated `/tools` page, not a sidebar widget.

#### Responsive Breakpoints
| Breakpoint | Layout | Padding |
|------------|--------|---------|
| < 640px (mobile) | Single column, 16px padding | Compact header (PFP 64×64) |
| 640-1024px (tablet) | Single column, 24px padding | Full header |
| > 1024px (desktop) | Max-width 768px centered | 32px padding, generous whitespace |

**Max content width: 768px.** Like a well-formatted document. Wider is not better — readability degrades past ~75 characters per line.

### 2.6 Component Specifications

#### Header
- PFP: 96×96, 1px border `--border-2`, no animation, no gimmicks
- On hover: subtle border transition to `--accent-blue` (300ms ease)
- Name: Display size, `--text-primary`, tight tracking
- Subtitle: Micro size, `--accent-blue`, uppercase, wide tracking
- Telemetry: Caption size, Geist Mono, `--text-tertiary` with colored status

#### Intel Card
- Full-width, `--bg-2` background
- 1px `--border-1` border, 24px padding
- On hover: border transitions to `--border-2` (200ms)
- Category tag: Micro size, uppercase, semantic color (see accent colors)
- Title: H2 weight, `--text-primary`
- Body: Body size, `--text-secondary`, 1.6 line height for readability
- Metadata row: Caption size, Geist Mono, `--text-tertiary`
- Spacing between cards: 12px (tight list, not isolated islands)

#### Footer
- Caption size, `--text-muted`, centered, uppercase, wide tracking
- 48px top margin
- No decorative elements

### 2.7 What to DELETE from v1
- ❌ CRT scanline overlay (gimmick)
- ❌ Screen flicker animation (gimmick)
- ❌ PFP pulse animation (gimmick)
- ❌ Amber glow on intel feed (over-styled)
- ❌ Grayscale PFP filter (unnecessary)
- ❌ "SHIP_FAST_KITS" sidebar (placeholder garbage)
- ❌ JetBrains Mono import (use Geist Mono)
- ❌ Hover-to-color PFP transition (cute but cheap)

### 2.8 What to ADD in v2
- ✅ Proper `<meta>` tags (OG image, description, twitter card)
- ✅ Favicon: Base blue square with "B" in Geist Sans Bold
- ✅ `robots.txt` and `sitemap.xml`
- ✅ Semantic HTML (`<article>`, `<time>`, `<header>`, `<nav>`)
- ✅ Structured data (JSON-LD for the intel feed)
- ✅ Empty state that's designed, not a placeholder string
- ✅ Loading skeleton for ISR revalidation
- ✅ Proper 404 page

---

## 3. Security Patches — Mandatory Before v2 Ships

### 3.1 CRITICAL: Rotate Leaked Secret
The `BAISED_AGENT_SECRET` was exposed in plain text in Discord #baised-dev channel history.

**Actions:**
1. Generate a new secret: `openssl rand -hex 32`
2. Update in Vercel env vars (all environments)
3. Update in `.env.local` for local dev
4. Verify old secret returns 401
5. Verify new secret returns 201
6. Document rotation in Ship Report

### 3.2 CRITICAL: Rate Limiting
The POST `/api/intel` endpoint has zero rate limiting. A bad actor could flood the database.

**Implementation:**
- Use Vercel's `@vercel/edge` or `next/headers` to read IP
- In-memory rate limiter (simple Map with TTL) or Upstash Redis (`@upstash/ratelimit`)
- Limit: 10 requests per minute per IP on POST
- Return `429 Too Many Requests` with `Retry-After` header

### 3.3 HIGH: Input Validation
No validation on `intelPayload` — arbitrary JSON of any size can be written to the database.

**Implementation:**
- Max request body: 10KB
- Required fields: `blockHeight` (positive integer), `intelPayload` (object with `title` string ≤200 chars, `body` string ≤2000 chars), `signature` (string ≤100 chars)
- Reject unknown fields
- Category must be one of: `general`, `ecosystem`, `security`, `devlog`, `alert`

### 3.4 MEDIUM: CORS Policy
No CORS headers configured. The API is open to cross-origin requests.

**Implementation:**
- `GET /api/intel`: Allow all origins (public data)
- `POST /api/intel`: Restrict to same-origin only (or specific allowed origins)
- Set `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`

### 3.5 MEDIUM: Security Headers
No security headers on any response.

**Implementation in `next.config.mjs`:**
```javascript
headers: [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

### 3.6 LOW: .env in Git History
The `.env` file with `DATABASE_URL=file:./dev.db` was committed and later deleted. It's in git history.

**Action:** Not critical (SQLite dev URL, no secrets), but note for awareness. Don't repeat.

---

## 4. Testing Requirements

### 4.1 Minimum Test Suite
| Test | Type | What it covers |
|------|------|---------------|
| POST /api/intel with valid auth + payload | Integration | Happy path write |
| POST /api/intel with invalid auth | Integration | Auth rejection (401) |
| POST /api/intel with missing fields | Integration | Validation (400) |
| POST /api/intel with oversized payload | Integration | Size limit enforcement |
| GET /api/intel returns published posts | Integration | Read path |
| Rate limiter blocks after threshold | Integration | Rate limiting (429) |
| Page renders with intel data | Component | Frontend rendering |

### 4.2 Testing Stack
- **Framework:** Vitest (fast, native ESM, works with Next.js)
- **API testing:** Direct route handler invocation (Next.js test utils)
- **No E2E required for v2** — API + component tests are sufficient

---

## 5. Implementation Order

**Phase 1: Security (do first, no exceptions)**
1. Rotate `BAISED_AGENT_SECRET`
2. Add rate limiting to POST endpoint
3. Add input validation + size limits
4. Add CORS policy
5. Add security headers in `next.config.mjs`
6. Run `gitleaks` scan
7. Run `npm audit`

**Phase 2: Design Rebuild**
1. Delete all v1 CSS gimmicks (scanlines, flicker, pulse, glow)
2. Implement design tokens as CSS custom properties
3. Rebuild `globals.css` from scratch using the color/type/spacing system
4. Rebuild `page.tsx` with semantic HTML and new layout (no sidebar)
5. Add meta tags, OG image, favicon
6. Add empty state, loading skeleton, 404 page

**Phase 3: Testing**
1. Install Vitest
2. Write the 7 required tests
3. All tests must pass before ship

**Phase 4: Ship**
1. Clean commit history (squash if messy)
2. `git push` → auto-deploy
3. Verify production
4. Generate Ship Report
5. All gates must pass

---

## 6. Rollback Plan

- **Git:** `git revert` to commit `bb3bb6a` (current v1 head)
- **Vercel:** One-click rollback to previous deployment in Vercel dashboard
- **Database:** Schema is additive only (no destructive migrations in v2)
- **Secret:** Old secret is already invalidated; rollback doesn't re-expose it
- **Monitor after deploy:**
  - Check `/api/intel` GET returns data (200)
  - Check `/api/intel` POST accepts new secret (201)
  - Check Lighthouse scores meet thresholds
  - Check Vercel deployment logs for errors

---

## 7. Files to Change/Create

| File | Action | Purpose |
|------|--------|---------|
| `src/app/globals.css` | **Rewrite** | Design tokens, clean typography, no gimmicks |
| `src/app/page.tsx` | **Rewrite** | New layout, semantic HTML, no sidebar |
| `src/app/layout.tsx` | **Edit** | Meta tags, OG image, structured data |
| `src/app/api/intel/route.ts` | **Edit** | Rate limiting, validation, CORS, size limits |
| `src/app/not-found.tsx` | **Create** | Custom 404 page |
| `src/lib/rate-limit.ts` | **Create** | Rate limiter utility |
| `src/lib/validate.ts` | **Create** | Input validation schemas |
| `next.config.mjs` | **Edit** | Security headers |
| `public/robots.txt` | **Create** | SEO |
| `public/sitemap.xml` | **Create** | SEO |
| `vitest.config.ts` | **Create** | Test configuration |
| `__tests__/api/intel.test.ts` | **Create** | API test suite |
| `.env.local` | **Edit** | New rotated secret |

---

## 8. Constraints

- **Runtime:** Vercel serverless (Node.js), ISR with 30s revalidation
- **Database:** Neon Postgres (free tier, 0.5GB, 100 CU-hours)
- **Framework:** Next.js 14.2.35, App Router, React 18
- **Styling:** Tailwind CSS 3.4 + CSS custom properties for design tokens
- **No new heavy dependencies.** Rate limiter should be lightweight (in-memory or Upstash if already available). Validation via manual checks, not Zod (unnecessary dependency for 3 fields).

---

## 9. Governor Compliance Checklist

Before v2 ships, every box must be checked:

- [ ] Plan reviewed and accepted
- [ ] Secret rotation complete
- [ ] Rate limiting implemented and tested
- [ ] Input validation implemented and tested
- [ ] CORS policy configured
- [ ] Security headers added
- [ ] `gitleaks` scan passed
- [ ] `npm audit` passed
- [ ] Design system implemented per spec
- [ ] All 7 tests passing
- [ ] Lighthouse Performance ≥ 95
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Ship Report generated
- [ ] All gates: PASS
- [ ] Ready to ship: YES

---

*This spec was written under Coding Governor enforcement.*
*No code was written during this session.*
*Opus executes this spec in the next session.*

**STAY BAISED.**

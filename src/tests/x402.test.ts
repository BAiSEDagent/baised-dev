import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fixtures per DECENTRADEAD's directive
const MOCK_PAYEE = '0xBA15EDb15edB15eDb15EDb15edB15EDb15edB15E';
const MOCK_TX_HASH = '0x7a2b9c5d4e1f8a6b3c0d9e2f5a8b1c4d7e0f3a6b9c2d5e8f1a4b7c0d3e6f9a2b';
const MOCK_PAYER = '0x1234567890abcdef1234567890abcdef12345678';

// Mock x402 module
vi.mock('@/lib/x402', () => ({
  verifyPayment: vi.fn(),
  paymentRequiredHeaders: vi.fn(() => ({
    'X-Payment-Address': MOCK_PAYEE,
    'X-Payment-Amount': '10000',
    'X-Payment-Asset': 'eip155:8453/erc20:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'X-Payment-Network': 'base',
    'X-Payment-Decimals': '6',
  })),
}));

// Mock Prisma
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@/lib/db', () => ({
  prisma: {
    paymentLedger: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    intelPost: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: () => new Map([['x-forwarded-for', '127.0.0.1']]),
}));

// Set env
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.BAISED_AGENT_SECRET = 'test-secret';

describe('x402 Payment Gate — GET /api/intel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFindMany.mockResolvedValue([
      {
        id: 'test-post-1',
        timestamp: new Date(),
        blockHeight: 42693903,
        intelPayload: { type: 'ecosystem', title: 'Genesis', body: 'First intel' },
        category: 'ecosystem',
        status: 'published',
      },
    ]);
  });

  it('returns 402 Payment Required when no X-Payment-TxHash header', async () => {
    const { GET } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost:3000/api/intel', {
      method: 'GET',
    });
    const res = await GET(req);

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe('Payment Required');

    // Verify x402 challenge headers
    expect(res.headers.get('X-Payment-Address')).toBe(MOCK_PAYEE);
    expect(res.headers.get('X-Payment-Amount')).toBe('10000');
    expect(res.headers.get('X-Payment-Network')).toBe('base');
  });

  it('returns 400 for malformed tx hash', async () => {
    const { GET } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost:3000/api/intel', {
      method: 'GET',
      headers: { 'X-Payment-TxHash': 'not-a-valid-hash' },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid tx hash format');
  });

  it('returns 409 Conflict for already-used tx hash (replay protection)', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'existing-payment',
      txHash: MOCK_TX_HASH,
      payer: MOCK_PAYER,
    });

    const { GET } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost:3000/api/intel', {
      method: 'GET',
      headers: { 'X-Payment-TxHash': MOCK_TX_HASH },
    });
    const res = await GET(req);

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Payment already used');
    expect(body.txHash).toBe(MOCK_TX_HASH);
  });

  it('returns 200 OK with intel after valid payment verification', async () => {
    mockFindUnique.mockResolvedValue(null); // Not used yet

    // Mock successful verification
    const { verifyPayment } = await import('@/lib/x402');
    vi.mocked(verifyPayment).mockResolvedValue({
      valid: true,
      payer: MOCK_PAYER as `0x${string}`,
      amount: '10000',
      blockNumber: 42700000,
    });

    mockCreate.mockResolvedValue({ id: 'new-ledger-entry', txHash: MOCK_TX_HASH });

    const { GET } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost:3000/api/intel', {
      method: 'GET',
      headers: { 'X-Payment-TxHash': MOCK_TX_HASH },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(1);
    expect(body.intel).toHaveLength(1);
    expect(body.payment.txHash).toBe(MOCK_TX_HASH);
    expect(body.payment.payer).toBe(MOCK_PAYER);

    // Verify ledger entry was created
    expect(mockCreate).toHaveBeenCalledWith({
      data: {
        txHash: MOCK_TX_HASH,
        payer: MOCK_PAYER,
        amount: '10000',
        blockNumber: 42700000,
      },
    });
  });

  it('returns 402 when onchain verification fails', async () => {
    mockFindUnique.mockResolvedValue(null);

    const { verifyPayment } = await import('@/lib/x402');
    vi.mocked(verifyPayment).mockResolvedValue({
      valid: false,
      payer: '0x0000000000000000000000000000000000000000',
      amount: '0',
      blockNumber: 0,
      error: 'No USDC transfer to payee found in transaction',
    });

    const { GET } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost:3000/api/intel', {
      method: 'GET',
      headers: { 'X-Payment-TxHash': MOCK_TX_HASH },
    });
    const res = await GET(req);

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.error).toBe('Payment verification failed');
  });
});

describe('x402 Config', () => {
  it('paymentRequiredHeaders returns all required x402 fields', async () => {
    const { paymentRequiredHeaders } = await import('@/lib/x402');
    const headers = paymentRequiredHeaders();

    expect(headers['X-Payment-Address']).toBe(MOCK_PAYEE);
    expect(headers['X-Payment-Amount']).toBeDefined();
    expect(headers['X-Payment-Asset']).toContain('eip155:8453');
    expect(headers['X-Payment-Network']).toBe('base');
  });
});

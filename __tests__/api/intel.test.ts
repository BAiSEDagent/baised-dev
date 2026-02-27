import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/headers since it's a server-only API
vi.mock('next/headers', () => ({
  headers: () => ({
    get: (name: string) => {
      if (name === 'x-forwarded-for') return '127.0.0.1';
      return null;
    },
  }),
}));

// Mock prisma
const mockCreate = vi.fn().mockResolvedValue({ id: 'test-id-001' });
const mockFindMany = vi.fn().mockResolvedValue([
  {
    id: 'test-id-001',
    timestamp: new Date(),
    blockHeight: 42700000,
    intelPayload: { title: 'Test', body: 'Body' },
    signature: 'sig',
    category: 'devlog',
    status: 'published',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

vi.mock('@/lib/db', () => ({
  prisma: {
    intelPost: {
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

// Set env vars before importing route
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.BAISED_AGENT_SECRET = 'test-secret-for-vitest';

describe('/api/intel', () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockClear();
    mockFindMany.mockClear();
    mockCreate.mockResolvedValue({ id: 'test-id-001' });
    mockFindMany.mockResolvedValue([
      {
        id: 'test-id-001',
        timestamp: new Date(),
        blockHeight: 42700000,
        intelPayload: { title: 'Test', body: 'Body' },
        signature: 'sig',
        category: 'devlog',
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  });

  it('POST returns 401 without auth', async () => {
    const { POST } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost/api/intel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockHeight: 1, intelPayload: { title: 'T', body: 'B' }, signature: 's' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('POST returns 400 for missing fields', async () => {
    const { POST } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost/api/intel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret-for-vitest',
      },
      body: JSON.stringify({ blockHeight: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Validation failed');
    expect(data.details.length).toBeGreaterThan(0);
  });

  it('POST returns 400 for invalid category', async () => {
    const { POST } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost/api/intel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret-for-vitest',
      },
      body: JSON.stringify({
        blockHeight: 1,
        intelPayload: { title: 'T', body: 'B' },
        signature: 's',
        category: 'INVALID',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('POST returns 201 for valid payload', async () => {
    const { POST } = await import('@/app/api/intel/route');
    const req = new Request('http://localhost/api/intel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-secret-for-vitest',
      },
      body: JSON.stringify({
        blockHeight: 42700000,
        intelPayload: { title: 'Valid Post', body: 'This should succeed.' },
        signature: 'sig_valid',
        category: 'devlog',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.message).toBe('Intel Deployed');
    expect(data.id).toBe('test-id-001');
  });

  it('GET returns intel posts with CORS headers', async () => {
    const { GET } = await import('@/app/api/intel/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(1);
    expect(data.intel).toHaveLength(1);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});

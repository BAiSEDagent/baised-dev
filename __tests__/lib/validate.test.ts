import { describe, it, expect } from 'vitest';
import { validateIntelPayload } from '@/lib/validate';

function valid() {
  return {
    blockHeight: 42700000,
    intelPayload: { title: 'Test Title', body: 'Test body content.' },
    signature: 'sig_001',
    category: 'devlog' as const,
  };
}

describe('validate', () => {
  it('accepts a valid payload', () => {
    const raw = JSON.stringify(valid());
    const result = validateIntelPayload(raw, valid());
    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data.blockHeight).toBe(42700000);
      expect(result.data.category).toBe('devlog');
    }
  });

  it('defaults category to general when omitted', () => {
    const payload = { ...valid() };
    delete (payload as Record<string, unknown>).category;
    const raw = JSON.stringify(payload);
    const result = validateIntelPayload(raw, payload);
    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(result.data.category).toBe('general');
    }
  });

  it('rejects negative blockHeight', () => {
    const payload = { ...valid(), blockHeight: -1 };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.some((e) => e.field === 'blockHeight')).toBe(true);
    }
  });

  it('rejects non-integer blockHeight', () => {
    const payload = { ...valid(), blockHeight: 42.5 };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
  });

  it('rejects missing intelPayload', () => {
    const payload = { blockHeight: 1, signature: 's' };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.some((e) => e.field === 'intelPayload')).toBe(true);
    }
  });

  it('rejects title exceeding 200 characters', () => {
    const payload = {
      ...valid(),
      intelPayload: { title: 'X'.repeat(201), body: 'ok' },
    };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.some((e) => e.field === 'intelPayload.title')).toBe(true);
    }
  });

  it('rejects body exceeding 2000 characters', () => {
    const payload = {
      ...valid(),
      intelPayload: { title: 'ok', body: 'X'.repeat(2001) },
    };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.some((e) => e.field === 'intelPayload.body')).toBe(true);
    }
  });

  it('rejects signature exceeding 100 characters', () => {
    const payload = { ...valid(), signature: 'X'.repeat(101) };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
  });

  it('rejects invalid category', () => {
    const payload = { ...valid(), category: 'INVALID' };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.some((e) => e.field === 'category')).toBe(true);
    }
  });

  it('rejects unknown top-level fields', () => {
    const payload = { ...valid(), evil: 'payload' };
    const result = validateIntelPayload(JSON.stringify(payload), payload);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.some((e) => e.field === 'evil')).toBe(true);
    }
  });

  it('rejects oversized payload (>10KB)', () => {
    const payload = {
      ...valid(),
      intelPayload: { title: 'ok', body: 'X'.repeat(1999) },
      // Pad to exceed 10KB
      signature: 'Y'.repeat(99),
    };
    // Create a raw string that exceeds 10KB
    const bigRaw = JSON.stringify(payload) + ' '.repeat(10240);
    const result = validateIntelPayload(bigRaw, payload);
    expect('errors' in result).toBe(true);
    if ('errors' in result) {
      expect(result.errors.some((e) => e.field === '_body')).toBe(true);
    }
  });
});

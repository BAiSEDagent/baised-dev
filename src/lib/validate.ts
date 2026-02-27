// SECURITY: Input validation for intel POST payloads.
// Manual validation — no Zod dependency for 3 fields.

const VALID_CATEGORIES = ['general', 'ecosystem', 'security', 'devlog', 'alert'] as const;
const MAX_PAYLOAD_BYTES = 10_240; // 10KB
const MAX_TITLE_LENGTH = 200;
const MAX_BODY_LENGTH = 2_000;
const MAX_SIGNATURE_LENGTH = 100;

export interface ValidatedIntel {
  blockHeight: number;
  intelPayload: { type?: string; title: string; body: string };
  signature: string;
  category: (typeof VALID_CATEGORIES)[number];
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateIntelPayload(
  rawBody: string,
  parsed: Record<string, unknown>
): { data: ValidatedIntel } | { errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // SECURITY: Enforce payload size limit
  if (Buffer.byteLength(rawBody, 'utf-8') > MAX_PAYLOAD_BYTES) {
    return { errors: [{ field: '_body', message: `Payload exceeds ${MAX_PAYLOAD_BYTES} bytes` }] };
  }

  // blockHeight: required, positive integer
  const bh = parsed.blockHeight;
  if (typeof bh !== 'number' || !Number.isInteger(bh) || bh <= 0) {
    errors.push({ field: 'blockHeight', message: 'Must be a positive integer' });
  }

  // intelPayload: required, object with title and body
  const ip = parsed.intelPayload;
  if (!ip || typeof ip !== 'object' || Array.isArray(ip)) {
    errors.push({ field: 'intelPayload', message: 'Must be an object' });
  } else {
    const payload = ip as Record<string, unknown>;

    if (typeof payload.title !== 'string' || payload.title.length === 0) {
      errors.push({ field: 'intelPayload.title', message: 'Required, must be a non-empty string' });
    } else if (payload.title.length > MAX_TITLE_LENGTH) {
      errors.push({ field: 'intelPayload.title', message: `Max ${MAX_TITLE_LENGTH} characters` });
    }

    if (typeof payload.body !== 'string' || payload.body.length === 0) {
      errors.push({ field: 'intelPayload.body', message: 'Required, must be a non-empty string' });
    } else if (payload.body.length > MAX_BODY_LENGTH) {
      errors.push({ field: 'intelPayload.body', message: `Max ${MAX_BODY_LENGTH} characters` });
    }
  }

  // signature: required, string, bounded
  const sig = parsed.signature;
  if (typeof sig !== 'string' || sig.length === 0) {
    errors.push({ field: 'signature', message: 'Required, must be a non-empty string' });
  } else if (sig.length > MAX_SIGNATURE_LENGTH) {
    errors.push({ field: 'signature', message: `Max ${MAX_SIGNATURE_LENGTH} characters` });
  }

  // category: optional, must be from allowlist
  const cat = parsed.category;
  if (cat !== undefined) {
    if (typeof cat !== 'string' || !(VALID_CATEGORIES as readonly string[]).includes(cat)) {
      errors.push({ field: 'category', message: `Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }
  }

  // SECURITY: Reject unknown top-level fields
  const allowedFields = new Set(['blockHeight', 'intelPayload', 'signature', 'category', 'status']);
  for (const key of Object.keys(parsed)) {
    if (!allowedFields.has(key)) {
      errors.push({ field: key, message: 'Unknown field — rejected' });
    }
  }

  if (errors.length > 0) return { errors };

  return {
    data: {
      blockHeight: bh as number,
      intelPayload: ip as { type?: string; title: string; body: string },
      signature: sig as string,
      category: ((cat as string) || 'general') as ValidatedIntel['category'],
    },
  };
}

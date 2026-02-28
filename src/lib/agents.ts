/**
 * Agent Directory — types, validation, and CDP data fetching for AI agents on Base.
 */

export interface AgentListing {
  id: string;
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  walletAddress: string | null;
  website: string | null;
  twitter: string | null;
  github: string | null;
  cdpTools: string[];
  builder: string | null;
  logoUrl: string | null;
  featured: boolean;
}

export interface AgentSubmission {
  name: string;
  description: string;
  category: string;
  capabilities: string[];
  walletAddress?: string;
  website?: string;
  twitter?: string;
  github?: string;
  cdpTools: string[];
  builder?: string;
}

const VALID_CATEGORIES = new Set([
  'trading', 'defi', 'social', 'infrastructure', 'devrel', 'analytics', 'other',
]);

const VALID_CAPABILITIES = new Set([
  'swaps', 'bridging', 'lending', 'staking', 'nft-minting', 'content',
  'analytics', 'monitoring', 'x402-payments', 'ecosystem-intel', 'social-posting',
  'portfolio-management', 'governance', 'other',
]);

const VALID_CDP_TOOLS = new Set([
  'agentkit', 'server-wallet', 'x402', 'onchainkit', 'node-rpc',
  'sql-api', 'webhooks', 'token-balances', 'address-history',
]);

// SECURITY: Validate and sanitize agent submission
export function validateAgentSubmission(data: unknown): {
  valid: boolean;
  errors: string[];
  sanitized?: AgentSubmission;
} {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const d = data as Record<string, unknown>;

  // Required fields
  if (typeof d.name !== 'string' || d.name.trim().length < 2 || d.name.trim().length > 50) {
    errors.push('name: required, 2-50 characters');
  }
  if (typeof d.description !== 'string' || d.description.trim().length < 10 || d.description.trim().length > 500) {
    errors.push('description: required, 10-500 characters');
  }
  if (typeof d.category !== 'string' || !VALID_CATEGORIES.has(d.category)) {
    errors.push(`category: must be one of ${Array.from(VALID_CATEGORIES).join(', ')}`);
  }

  // Arrays
  if (!Array.isArray(d.capabilities) || d.capabilities.length === 0 || d.capabilities.length > 10) {
    errors.push('capabilities: 1-10 items required');
  } else if (d.capabilities.some((c: unknown) => typeof c !== 'string' || !VALID_CAPABILITIES.has(c))) {
    errors.push(`capabilities: each must be one of ${Array.from(VALID_CAPABILITIES).join(', ')}`);
  }

  if (!Array.isArray(d.cdpTools)) {
    errors.push('cdpTools: must be an array');
  } else if (d.cdpTools.some((t: unknown) => typeof t !== 'string' || !VALID_CDP_TOOLS.has(t))) {
    errors.push(`cdpTools: each must be one of ${Array.from(VALID_CDP_TOOLS).join(', ')}`);
  }

  // Optional fields
  if (d.walletAddress !== undefined && d.walletAddress !== '') {
    if (typeof d.walletAddress !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(d.walletAddress)) {
      errors.push('walletAddress: must be valid Ethereum address (0x + 40 hex chars)');
    }
  }

  if (d.website !== undefined && d.website !== '') {
    if (typeof d.website !== 'string' || !d.website.startsWith('https://') || d.website.length > 200) {
      errors.push('website: must be HTTPS URL, max 200 chars');
    }
  }

  if (d.twitter !== undefined && d.twitter !== '') {
    if (typeof d.twitter !== 'string' || !/^[a-zA-Z0-9_]{1,15}$/.test(d.twitter)) {
      errors.push('twitter: must be valid handle (1-15 alphanumeric + underscore)');
    }
  }

  if (d.github !== undefined && d.github !== '') {
    if (typeof d.github !== 'string' || !/^[a-zA-Z0-9_-]{1,39}$/.test(d.github)) {
      errors.push('github: must be valid username (1-39 chars)');
    }
  }

  if (d.builder !== undefined && d.builder !== '') {
    if (typeof d.builder !== 'string' || d.builder.trim().length > 50) {
      errors.push('builder: max 50 chars');
    }
  }

  if (errors.length > 0) return { valid: false, errors };

  // SECURITY: Sanitize — strip control characters from all string fields
  const strip = (s: string) => s.replace(/[\x00-\x1f\x7f]/g, '').trim();

  return {
    valid: true,
    errors: [],
    sanitized: {
      name: strip(d.name as string),
      description: strip(d.description as string),
      category: d.category as string,
      capabilities: (d.capabilities as string[]),
      walletAddress: d.walletAddress ? strip(d.walletAddress as string) : undefined,
      website: d.website ? strip(d.website as string) : undefined,
      twitter: d.twitter ? strip(d.twitter as string) : undefined,
      github: d.github ? strip(d.github as string) : undefined,
      cdpTools: (d.cdpTools as string[]),
      builder: d.builder ? strip(d.builder as string) : undefined,
    },
  };
}

// Category display labels
export const CATEGORY_LABELS: Record<string, string> = {
  trading: 'Trading',
  defi: 'DeFi',
  social: 'Social',
  infrastructure: 'Infrastructure',
  devrel: 'DevRel',
  analytics: 'Analytics',
  other: 'Other',
};

// CDP tool display labels
export const CDP_TOOL_LABELS: Record<string, string> = {
  'agentkit': 'AgentKit',
  'server-wallet': 'Server Wallet',
  'x402': 'x402',
  'onchainkit': 'OnchainKit',
  'node-rpc': 'Node RPC',
  'sql-api': 'SQL API',
  'webhooks': 'Webhooks',
  'token-balances': 'Token Balances',
  'address-history': 'Address History',
};

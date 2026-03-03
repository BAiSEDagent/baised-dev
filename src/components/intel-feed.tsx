'use client';

import { useState } from 'react';

interface IntelItem {
  id: string;
  category: string;
  intelPayload: { type?: string; title?: string; body?: string };
}

function categoryTag(category: string): string {
  return category.toUpperCase();
}

function categoryClass(category: string): string {
  switch (category) {
    case 'security':
    case 'alert':
      return 'tag-security';
    case 'devlog':
    case 'tech':
      return 'tag-devlog';
    case 'ecosystem':
    case 'grant':
      return 'tag-ecosystem';
    case 'feature':
      return 'tag-feature';
    default:
      return 'tag-general';
  }
}

function IntelEntry({ item }: { item: IntelItem }) {
  const [expanded, setExpanded] = useState(false);
  const body = item.intelPayload.body || '';
  const title = item.intelPayload.title || '';
  const hasBody = body.length > 0 && title.length > 0;
  const isLong = body.length > 120;

  return (
    <article
      className={`py-3.5 ${hasBody ? 'cursor-pointer' : ''}`}
      onClick={() => hasBody && setExpanded(!expanded)}
      role={hasBody ? 'button' : undefined}
      aria-expanded={hasBody ? expanded : undefined}
      tabIndex={hasBody ? 0 : undefined}
      onKeyDown={(e) => {
        if (hasBody && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      <p className="font-mono text-xs sm:text-sm leading-relaxed">
        <span className={`font-bold ${categoryClass(item.category)}`}>
          [{categoryTag(item.category)}]
        </span>{' '}
        <span className="text-[#c8c8c8]">
          {title || body || '—'}
        </span>
        {hasBody && isLong && (
          <span className="text-[#444] ml-1 text-[10px]">
            {expanded ? '▼' : '▶'}
          </span>
        )}
      </p>
      {hasBody && (
        <p className={`font-mono text-xs text-[#787878] mt-1 ml-0 leading-relaxed ${
          expanded ? '' : isLong ? '' : ''
        }`}>
          {expanded || !isLong ? body : body.slice(0, 120) + '…'}
        </p>
      )}
    </article>
  );
}

export function IntelFeed({ feed }: { feed: IntelItem[] }) {
  if (feed.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="font-mono text-sm text-[#444]">
          No intel published yet.
        </p>
        <p className="font-mono text-xs text-[#444] mt-1">
          Intel posts are coming. Watch this space.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
      {feed.map((item) => (
        <IntelEntry key={item.id} item={item} />
      ))}
    </div>
  );
}

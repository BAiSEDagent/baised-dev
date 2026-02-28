'use client';

import { useState, useCallback, useEffect } from 'react';
import { isAddress } from 'viem'; // H-5: Removed unused 'normalize' import

export function BasenameResolver() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true); // L-6: Offline detection

  // L-6: Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // L-1: Debounced resolve (not auto-triggered, but prevents spam clicks)
  const handleResolve = useCallback(async () => {
    if (!input.trim()) {
      setError('Input required');
      return;
    }

    // L-6: Check online status
    if (!isOnline) {
      setError('No internet connection. Please check your network.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Sanitize input
      const sanitized = input.trim().toLowerCase();

      // Determine if forward or reverse resolution
      const isAddressInput = isAddress(sanitized);

      const endpoint = isAddressInput
        ? `/api/basename?address=${encodeURIComponent(sanitized)}`
        : `/api/basename?name=${encodeURIComponent(sanitized)}`;

      const res = await fetch(endpoint);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Resolution failed');
        // M-2: Analytics
        console.log('[analytics] basename_resolved', { success: false, error: data.error });
      } else {
        setResult(data.result || 'Not found');
        // M-2: Analytics
        console.log('[analytics] basename_resolved', { success: true, input: sanitized });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError('Resolution failed. Please try again.');
      console.error('[analytics] basename_error', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [input, isOnline]);

  return (
    <div className="workbench-module">
      <h4
        className="font-mono text-xs font-bold text-[#ededed] mb-3"
        id="basename-resolver-heading"
      >
        Basename Resolver
      </h4>

      {/* L-6: Offline indicator */}
      {!isOnline && (
        <div className="mb-2 p-2 bg-[#FF3B30]/10 border border-[#FF3B30]">
          <p className="font-mono text-xs text-[#FF3B30]">⚠ Offline</p>
        </div>
      )}

      {/* Terminal-style Input */}
      <div className="relative">
        <span
          className="absolute left-3 top-2 font-mono text-xs text-[#787878] pointer-events-none"
          aria-hidden="true"
        >
          &gt;
        </span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleResolve()}
          placeholder="baisedagent.base.eth or 0x..."
          aria-label="Basename or Ethereum address input" // M-4: Accessibility
          aria-describedby="basename-resolver-heading"
          className="w-full font-mono text-xs bg-[#0a0c12] border border-[#2a3a4a] text-[#ededed] pl-8 pr-3 py-2 focus:outline-none focus:border-[#0052FF] placeholder:text-[#444]"
        />
      </div>

      <button
        onClick={handleResolve}
        disabled={loading || !isOnline}
        aria-label="Resolve basename or address" // M-4: Accessibility
        className="mt-2 w-full font-mono text-xs py-2 bg-transparent border border-[#2a3a4a] text-[#787878] hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'RESOLVING...' : 'RESOLVE'}
      </button>

      {/* Output */}
      {result && (
        <div
          className="mt-3 p-2.5 bg-[#0a0c12] border border-[#1a2a3a]"
          role="status" // M-4: Accessibility
          aria-live="polite"
        >
          <p className="font-mono text-xs text-[#00C853] break-all">{result}</p>
        </div>
      )}

      {error && (
        <div
          className="mt-3 p-2.5 bg-[#0a0c12] border border-[#FF3B30]"
          role="alert" // M-4: Accessibility
          aria-live="assertive"
        >
          <p className="font-mono text-xs text-[#FF3B30]">{error}</p>
        </div>
      )}

      <p className="font-mono text-[10px] text-[#555] mt-2">
        Forward: name → address | Reverse: address → name
      </p>
    </div>
  );
}

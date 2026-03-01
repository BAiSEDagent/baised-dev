'use client';

import { useState } from 'react';

interface DecodedResult {
  success: boolean;
  selector: string;
  functionName: string;
  params: unknown[] | null;
  signature?: string;
  alternativeSignatures?: string[];
  error?: string;
  rawCalldata?: string;
}

export function AbiDecoder() {
  const [calldata, setCalldata] = useState('');
  const [result, setResult] = useState<DecodedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDecode = async () => {
    if (!calldata.trim()) {
      setError('Calldata required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/decode-calldata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calldata: calldata.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Decoding failed');
        console.log('[analytics] abi_decode_failed', { error: data.error });
      } else {
        setResult(data);
        console.log('[analytics] abi_decode_success', { 
          functionName: data.functionName, 
          success: data.success 
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError('Decoding failed. Please try again.');
      console.error('[analytics] abi_decode_error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatParam = (param: unknown): string => {
    if (param === null || param === undefined) return 'null';
    
    // Handle BigInt
    if (typeof param === 'bigint') {
      return param.toString();
    }
    
    // Handle arrays
    if (Array.isArray(param)) {
      return `[${param.map((p) => formatParam(p)).join(', ')}]`;
    }
    
    // Handle objects
    if (typeof param === 'object') {
      return JSON.stringify(param);
    }
    
    return String(param);
  };

  return (
    <div className="workbench-module">
      <h4
        className="font-mono text-xs font-bold text-[#ededed] mb-3"
        id="abi-decoder-heading"
      >
        ABI Decoder
      </h4>

      {/* Calldata Input */}
      <div className="relative">
        <textarea
          value={calldata}
          onChange={(e) => {
            setCalldata(e.target.value);
            setError(null);
            setResult(null);
          }}
          placeholder="0xa9059cbb000000000000000000000000..."
          aria-label="Transaction calldata input"
          aria-describedby="abi-decoder-heading"
          rows={3}
          className="w-full font-mono text-xs bg-[#0a0c12] border border-[#2a3a4a] text-[#ededed] px-3 py-2 focus:outline-none focus:border-[#0052FF] placeholder:text-[#444] resize-none"
        />
      </div>

      <button
        onClick={handleDecode}
        disabled={loading || !calldata.trim()}
        aria-label="Decode calldata"
        className="mt-2 w-full font-mono text-xs py-2 bg-transparent border border-[#2a3a4a] text-[#787878] hover:border-[#0052FF] hover:text-[#0052FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'DECODING...' : 'DECODE'}
      </button>

      {/* Decoded Output */}
      {result && result.success && (
        <div
          className="mt-3 p-3 bg-[#0a0c12] border border-[#1a2a3a] relative"
          role="status"
          aria-live="polite"
        >
          <button
            onClick={async () => {
              const text = `${result.functionName}(${result.params?.map((p, i) => `arg[${i}]: ${formatParam(p)}`).join(', ') ?? ''})`;
              try {
                await navigator.clipboard.writeText(text);
                console.log('[analytics] abi_result_copied');
              } catch {
                alert('Copy failed.');
              }
            }}
            className="absolute top-2 right-2 font-mono text-[10px] px-2 py-0.5 text-[#787878] hover:text-[#00C853] border border-[#2a3a4a] hover:border-[#00C853] transition-colors"
            aria-label="Copy decoded result"
          >
            COPY
          </button>
          <p className="font-mono text-xs text-[#00C853] font-bold mb-2">
            {result.functionName}
          </p>
          
          {result.params && result.params.length > 0 && (
            <div className="space-y-1">
              {result.params.map((param, idx) => (
                <p key={idx} className="font-mono text-xs text-[#c8c8c8]">
                  <span className="text-[#787878]">arg[{idx}]:</span>{' '}
                  <span className="text-[#ededed] break-all">{formatParam(param)}</span>
                </p>
              ))}
            </div>
          )}

          {result.signature && (
            <p className="font-mono text-[10px] text-[#555] mt-2 pt-2 border-t border-[#1a2a3a]">
              Signature: {result.signature}
            </p>
          )}

          {result.alternativeSignatures && result.alternativeSignatures.length > 0 && (
            <p className="font-mono text-[10px] text-[#444] mt-1">
              Alternatives: {result.alternativeSignatures.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Unknown Function */}
      {result && !result.success && (
        <div
          className="mt-3 p-3 bg-[#0a0c12] border border-[#FFB000]"
          role="status"
          aria-live="polite"
        >
          <p className="font-mono text-xs text-[#FFB000] font-bold mb-1">
            {result.functionName}
          </p>
          <p className="font-mono text-[10px] text-[#787878]">
            Selector: {result.selector}
          </p>
          {result.error && (
            <p className="font-mono text-[10px] text-[#555] mt-1">
              {result.error}
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mt-3 p-2.5 bg-[#0a0c12] border border-[#FF3B30]"
          role="alert"
          aria-live="assertive"
        >
          <p className="font-mono text-xs text-[#FF3B30]">{error}</p>
        </div>
      )}

      <p className="font-mono text-[10px] text-[#555] mt-2">
        Paste transaction input data → get human-readable function + parameters
      </p>
    </div>
  );
}

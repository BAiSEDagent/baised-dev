'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// L-5: React error boundary to prevent component crashes from breaking entire page
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Component crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="workbench-module">
            <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]">
              <p className="font-mono text-xs text-[#FF3B30] font-bold mb-1">
                ⚠ Component Error
              </p>
              <p className="font-mono text-xs text-[#787878]">
                This module encountered an error. Please refresh the page.
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-2 font-mono text-xs px-3 py-1 bg-transparent border border-[#FF3B30] text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

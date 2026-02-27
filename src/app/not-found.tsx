import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg-1 flex items-center justify-center">
      <div className="text-center px-4">
        <p className="font-mono text-micro text-text-muted uppercase tracking-widest">
          404
        </p>
        <h1 className="text-h1 text-text-primary mt-4">Signal not found</h1>
        <p className="text-body text-text-secondary mt-2">
          This page doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 text-caption text-accent-blue hover:text-accent-blue-hover transition-colors"
        >
          ← Back to feed
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "404 — Page Not Found" };

export default function NotFound() {
  return (
    <div className="min-h-screen bg-deep-void flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-8">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-6 opacity-30" aria-hidden="true">
          <polyline points="8,18 40,62 72,18" fill="none" stroke="#f5c451" strokeWidth="5" strokeLinejoin="miter" />
          <polyline points="18,18 40,52 62,18" fill="none" stroke="#f5c451" strokeWidth="3" strokeLinejoin="miter" opacity="0.45" />
        </svg>
        <p className="font-display text-8xl font-black text-warm-wood-light tracking-tight">404</p>
      </div>
      <h1 className="font-display text-2xl font-bold tracking-display text-parchment-light mb-3">
        This page has left the board
      </h1>
      <p className="font-body text-lg text-parchment-mid italic mb-10 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist, was moved, or never was.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm hover:bg-emerald-bright transition-all">
          Back to Home
        </Link>
        <Link href="/marketplace" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-warm-wood-light text-parchment-light font-ui font-semibold text-sm hover:border-royal-gold/50 hover:text-royal-gold transition-all">
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}

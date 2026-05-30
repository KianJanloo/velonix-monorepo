import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "401 — Unauthorized" };

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-deep-void flex flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-8xl font-black text-warm-wood-light tracking-tight mb-6">401</p>
      <h1 className="font-display text-2xl font-bold tracking-display text-parchment-light mb-3">
        Access denied
      </h1>
      <p className="font-body text-lg text-parchment-mid italic mb-10 max-w-md">
        You need to be signed in to view this page. Please log in and try again.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/auth/login" className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm hover:bg-emerald-bright transition-all">
          Sign In
        </Link>
        <Link href="/" className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-warm-wood-light text-parchment-light font-ui font-semibold text-sm hover:border-royal-gold/50 hover:text-royal-gold transition-all">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

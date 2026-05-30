import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velonix — Play. Think. Conquer.",
  description: "The premium platform for creating, publishing, and selling digital board games.",
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-deep-void text-parchment-light">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
        {/* Background spotlight */}
        <div className="pointer-events-none absolute inset-0 bg-spotlight" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_80%,rgba(58,42,31,0.4),transparent)]" />

        {/* V-mark logo */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c4b49a" />
                <stop offset="50%" stopColor="#f5c451" />
                <stop offset="100%" stopColor="#c4b49a" />
              </linearGradient>
            </defs>
            <polyline points="8,18 40,62 72,18" fill="none" stroke="url(#vg)" strokeWidth="5" strokeLinejoin="miter" />
            <polyline points="18,18 40,52 62,18" fill="none" stroke="url(#vg)" strokeWidth="3" strokeLinejoin="miter" opacity="0.45" />
            <circle cx="40" cy="15" r="3.5" fill="url(#vg)" />
            <rect x="37.5" y="8" width="5" height="2.5" rx="1" fill="url(#vg)" />
            <circle cx="40" cy="7" r="2" fill="url(#vg)" opacity="0.75" />
          </svg>
        </div>

        <h1
          className="font-display text-6xl md:text-8xl font-black tracking-display gradient-gold-parchment mb-4 animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          VELONIX
        </h1>

        <p
          className="font-ui text-xs font-semibold tracking-widest text-soft-gray uppercase mb-6 animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          Play &nbsp;&bull;&nbsp; Think &nbsp;&bull;&nbsp; Conquer
        </p>

        <div className="flex items-center gap-4 max-w-xs w-full mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-wood-light to-transparent" />
          <div className="w-1.5 h-1.5 rotate-45 bg-royal-gold shadow-gold" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-wood-light to-transparent" />
        </div>

        <p
          className="font-body text-xl text-parchment-mid italic max-w-lg mb-12 animate-fade-in-up"
          style={{ animationDelay: "240ms" }}
        >
          Design professional board games with powerful studio tools.
          Publish them. Sell them. Earn from every move.
        </p>

        <div
          className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
          style={{ animationDelay: "320ms" }}
        >
          <Link href="/auth/register" className="v-btn-primary text-base px-8 py-3">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Start Building Free
          </Link>
          <Link href="/marketplace" className="v-btn-outline text-base px-8 py-3">
            Browse Marketplace
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-float">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-soft-gray" />
          <div className="w-1 h-1 rounded-full bg-soft-gray" />
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Velonix — Play. Think. Conquer.",
  description: "The premium platform for creating, publishing, and selling digital board games.",
};

// ── Shared primitives ────────────────────────────────────────────────────────

function Divider() {
  return (
    <div className="flex items-center gap-4 max-w-xs mx-auto my-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-wood-light to-transparent" />
      <div className="w-1.5 h-1.5 rotate-45 bg-royal-gold shadow-gold" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-wood-light to-transparent" />
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-ui text-xs font-bold tracking-[0.18em] text-emerald-glow uppercase mb-4">
      {children}
    </p>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-spotlight" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_80%,rgba(58,42,31,0.4),transparent)]" />

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
        className="font-display text-5xl sm:text-7xl md:text-8xl font-black tracking-display gradient-gold-parchment mb-4 animate-fade-in-up"
        style={{ animationDelay: "80ms" }}
      >
        VELONIX
      </h1>

      <p
        className="font-ui text-xs font-semibold tracking-widest text-soft-gray uppercase mb-5 animate-fade-in-up"
        style={{ animationDelay: "160ms" }}
      >
        Play &nbsp;&bull;&nbsp; Think &nbsp;&bull;&nbsp; Conquer
      </p>

      <Divider />

      <p
        className="font-body text-lg sm:text-xl text-parchment-mid italic max-w-xl mb-12 animate-fade-in-up"
        style={{ animationDelay: "240ms" }}
      >
        Design professional board games with powerful studio tools.
        Publish them. Sell them. Earn from every move.
      </p>

      <div
        className="flex flex-col sm:flex-row gap-4 animate-fade-in-up"
        style={{ animationDelay: "320ms" }}
      >
        <Link
          href="/auth/register"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm hover:bg-emerald-bright transition-all active:scale-95 shadow-[0_0_24px_rgba(0,212,165,0.35)]"
        >
          Start Creating — Free
        </Link>
        <Link
          href="/marketplace"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-warm-wood-light text-parchment-light font-ui font-semibold text-sm hover:border-royal-gold/50 hover:text-royal-gold transition-all"
        >
          Browse Marketplace
        </Link>
      </div>

      {/* Social proof */}
      <p className="mt-8 text-soft-gray-dark text-xs font-ui animate-fade-in-up" style={{ animationDelay: "400ms" }}>
        Join <span className="text-parchment-mid font-semibold">2,400+</span> independent game designers
      </p>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-float">
        <div className="w-px h-8 bg-gradient-to-b from-transparent to-soft-gray" />
        <div className="w-1 h-1 rounded-full bg-soft-gray" />
      </div>
    </section>
  );
}

// ── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = [
    { value: "2,400+", label: "Creators" },
    { value: "18,000+", label: "Games Published" },
    { value: "$1.2M+", label: "Creator Earnings" },
    { value: "4.8★", label: "Average Rating" },
  ];
  return (
    <section className="border-y border-warm-wood bg-rich-wood-dark/60 py-10">
      <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <p className="font-display text-3xl font-bold gradient-gold-parchment mb-1">{value}</p>
            <p className="text-soft-gray text-sm font-ui">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="3" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 10h22M10 3v22" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
        <circle cx="19" cy="19" r="3" fill="currentColor" opacity="0.7" />
        <path d="M7 7h6v6H7z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.2" />
      </svg>
    ),
    title: "Professional Studio",
    desc: "A full-featured design studio with layers, components, and 3D preview. Create boards, cards, tokens, and more—all in your browser.",
    accent: "emerald" as const,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3l2.5 8h8.5l-7 5 2.5 8-7-5-7 5 2.5-8-7-5h8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    title: "Marketplace Publishing",
    desc: "Submit your game for review and reach thousands of players. Set your price, offer free trials, and build a loyal community.",
    accent: "gold" as const,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M5 14h18M14 5l9 9-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="14" r="2" fill="currentColor" opacity="0.5" />
      </svg>
    ),
    title: "Direct Payouts",
    desc: "Earn up to 85% revenue share via Stripe Connect. Get paid directly to your bank for every sale with transparent, low commission rates.",
    accent: "cyan" as const,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="7" width="22" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 11h12M8 15h8M8 19h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.6" />
        <circle cx="20" cy="5" r="3" fill="currentColor" opacity="0.5" />
      </svg>
    ),
    title: "Rule Engine & Logic",
    desc: "Define game rules with a visual logic editor. Add win conditions, turn orders, and card effects without writing a single line of code.",
    accent: "parchment" as const,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 3a11 11 0 100 22A11 11 0 0014 3z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 14c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="14" cy="14" r="2" fill="currentColor" opacity="0.6" />
      </svg>
    ),
    title: "Analytics & Insights",
    desc: "Track downloads, reviews, and revenue with a real-time analytics dashboard. Understand your players and grow your audience.",
    accent: "emerald" as const,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 21V9l10-6 10 6v12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M10 21v-7h8v7" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
    title: "Team Collaboration",
    desc: "Invite co-designers, share feedback, and manage versions. Studio and Pro plans include multi-seat collaboration tools.",
    accent: "gold" as const,
  },
];

const accentMap = {
  emerald: "text-emerald-glow bg-emerald-ghost border-emerald-glow/20",
  gold: "text-royal-gold bg-[rgba(245,196,81,0.08)] border-royal-gold/20",
  cyan: "text-cyan-spark bg-[rgba(0,229,255,0.06)] border-cyan-spark/20",
  parchment: "text-parchment-light bg-warm-wood/40 border-warm-wood-light/30",
};

function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>Everything you need</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-display text-parchment-light mb-4">
            Built for serious creators
          </h2>
          <p className="font-body text-lg text-parchment-mid italic max-w-xl mx-auto">
            From first sketch to published game — Velonix has every tool you need in one platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc, accent }) => (
            <div
              key={title}
              className="v-card p-6 flex flex-col gap-4 hover:border-warm-wood-light transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${accentMap[accent]}`}>
                {icon}
              </div>
              <div>
                <h3 className="font-display text-base font-bold tracking-wide text-parchment-light mb-2">
                  {title}
                </h3>
                <p className="text-soft-gray text-sm font-ui leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    step: "01",
    title: "Design your game",
    desc: "Use the Velonix Studio to craft every component — boards, cards, dice, tokens. Import your own artwork or use built-in assets. Preview in 2D and 3D.",
    cta: { label: "Open Studio", href: "/studio/new" },
  },
  {
    step: "02",
    title: "Publish to the Marketplace",
    desc: "Set your price, write your game description, and submit for review. Our moderation team checks every game for quality before it goes live.",
    cta: { label: "Browse Games", href: "/marketplace" },
  },
  {
    step: "03",
    title: "Earn from every sale",
    desc: "Revenue is paid directly to your Stripe account. Free tier keeps 75%, Pro keeps 83%, Studio keeps 85%. No hidden fees — transparent from day one.",
    cta: { label: "View Pricing", href: "/pricing" },
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-rich-wood-dark/40 border-y border-warm-wood">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel>How Velonix works</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-display text-parchment-light">
            Three steps to publishing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-10 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-gradient-to-r from-warm-wood-light/40 via-royal-gold/30 to-warm-wood-light/40" />

          {STEPS.map(({ step, title, desc, cta }) => (
            <div key={step} className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-rich-wood-dark border-2 border-royal-gold/40 flex items-center justify-center mb-1 shadow-gold/10 shadow-lg">
                  <span className="font-display text-2xl font-bold text-royal-gold">{step}</span>
                </div>
              </div>
              <h3 className="font-display text-lg font-bold tracking-wide text-parchment-light">{title}</h3>
              <p className="text-soft-gray text-sm font-ui leading-relaxed">{desc}</p>
              <Link
                href={cta.href}
                className="text-emerald-glow text-xs font-ui font-semibold hover:text-emerald-bright transition-colors underline-offset-2 hover:underline"
              >
                {cta.label} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="py-24 px-6 border-t border-warm-wood bg-rich-wood-dark/40">
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-6">
          <svg width="48" height="48" viewBox="0 0 80 80" fill="none" className="mx-auto" aria-hidden="true">
            <defs>
              <linearGradient id="vg2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c4b49a" />
                <stop offset="50%" stopColor="#f5c451" />
                <stop offset="100%" stopColor="#c4b49a" />
              </linearGradient>
            </defs>
            <polyline points="8,18 40,62 72,18" fill="none" stroke="url(#vg2)" strokeWidth="5" strokeLinejoin="miter" />
            <polyline points="18,18 40,52 62,18" fill="none" stroke="url(#vg2)" strokeWidth="3" strokeLinejoin="miter" opacity="0.45" />
            <circle cx="40" cy="15" r="3.5" fill="url(#vg2)" />
          </svg>
        </div>
        <h2 className="font-display text-4xl md:text-5xl font-bold tracking-display gradient-gold-parchment mb-4">
          Your game deserves a stage
        </h2>
        <p className="font-body text-lg text-parchment-mid italic mb-10 max-w-xl mx-auto">
          Thousands of players are waiting to discover your next creation. Start building today — it&apos;s free.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm hover:bg-emerald-bright transition-all active:scale-95 shadow-[0_0_32px_rgba(0,212,165,0.3)]"
          >
            Create Free Account
          </Link>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-10 py-4 rounded-xl border border-warm-wood-light text-parchment-light font-ui font-semibold text-sm hover:border-royal-gold/50 hover:text-royal-gold transition-all"
          >
            Explore Marketplace
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <main className="bg-deep-void text-parchment-light">
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <CTABanner />
    </main>
  );
}

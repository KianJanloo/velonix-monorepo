"use client";

import { useState } from "react";
import Link from "next/link";
import { useSubscriptionTiers, useSubscriptionCheckout } from "@/hooks/useSubscriptions";
import { useCurrentUser } from "@/hooks/useAuth";

const TIER_META: Record<string, {
  label: string; tagline: string; color: string; highlighted: boolean;
  features: string[];
}> = {
  free: {
    label: "Free", tagline: "Start your journey",
    color: "border-warm-wood bg-rich-wood-dark",
    highlighted: false,
    features: [
      "3 game projects",
      "Basic component library",
      "2D preview & export",
      "Marketplace publishing",
      "Community support",
      "25% commission rate",
    ],
  },
  creator: {
    label: "Creator", tagline: "For dedicated designers",
    color: "border-emerald-glow/50 bg-emerald-ghost shadow-[0_0_40px_rgba(0,212,165,0.12)]",
    highlighted: true,
    features: [
      "15 game projects",
      "Full component library",
      "3D preview mode",
      "Analytics dashboard",
      "Priority review queue",
      "Email support",
      "20% commission rate",
    ],
  },
  pro: {
    label: "Pro", tagline: "Scale your studio",
    color: "border-royal-gold/40 bg-rich-wood-dark",
    highlighted: false,
    features: [
      "Unlimited game projects",
      "Custom domain",
      "Advanced analytics",
      "Team collaboration (2 seats)",
      "Rule engine access",
      "Priority support",
      "17% commission rate",
    ],
  },
  studio: {
    label: "Studio", tagline: "For teams & agencies",
    color: "border-warm-wood-light bg-rich-wood-dark",
    highlighted: false,
    features: [
      "Everything in Pro",
      "10 team seats",
      "White-label export",
      "API access",
      "Dedicated account manager",
      "SLA support",
      "15% commission rate",
    ],
  },
};

const TIER_PRICES: Record<string, { monthly: number; yearly: number }> = {
  free:    { monthly: 0,  yearly: 0 },
  creator: { monthly: 12, yearly: 99 },
  pro:     { monthly: 29, yearly: 249 },
  studio:  { monthly: 79, yearly: 699 },
};

export default function PricingPage() {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const { data: tiers, isLoading } = useSubscriptionTiers();
  const checkout = useSubscriptionCheckout();
  const user = useCurrentUser();

  const tierOrder = ["free", "creator", "pro", "studio"];

  function handleUpgrade(tier: string) {
    if (tier === "free") return;
    if (!user) { window.location.href = `/auth/register?plan=${tier}`; return; }
    checkout.mutate({ tier, interval });
  }

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      {/* Header */}
      <div className="py-20 px-6 text-center">
        <p className="font-ui text-xs font-bold tracking-[0.18em] text-emerald-glow uppercase mb-4">Transparent pricing</p>
        <h1 className="font-display text-5xl md:text-6xl font-black tracking-display text-parchment-light mb-4">
          Plans for every creator
        </h1>
        <p className="font-body text-xl text-parchment-mid italic max-w-xl mx-auto mb-10">
          Start free. Upgrade when you&apos;re ready. No hidden fees — ever.
        </p>

        {/* Interval toggle */}
        <div className="inline-flex items-center bg-rich-wood-dark border border-warm-wood rounded-xl p-1 gap-1">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-5 py-2 rounded-lg text-sm font-ui font-semibold transition-all ${interval === "monthly" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-5 py-2 rounded-lg text-sm font-ui font-semibold transition-all ${interval === "yearly" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            Yearly
            <span className="ml-2 text-2xs bg-royal-gold/20 text-royal-gold px-1.5 py-0.5 rounded-full font-ui">Save 30%</span>
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {[1,2,3,4].map(i => <div key={i} className="h-96 rounded-2xl bg-warm-wood/10 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
            {tierOrder.map(tierKey => {
              const meta = TIER_META[tierKey];
              const prices = TIER_PRICES[tierKey];
              if (!meta) return null;

              const isCurrentPlan = user?.subscriptionTier === tierKey;
              const price = interval === "monthly" ? prices?.monthly : prices?.yearly;
              const perPeriod = interval === "monthly" ? "/mo" : "/yr";

              return (
                <div key={tierKey} className={`relative flex flex-col rounded-2xl border p-6 transition-all ${meta.color}`}>
                  {meta.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-glow text-deep-void text-2xs font-ui font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  {isCurrentPlan && (
                    <span className="absolute -top-3 right-4 bg-royal-gold text-deep-void text-2xs font-ui font-bold px-3 py-1 rounded-full">
                      Current plan
                    </span>
                  )}

                  <div className="mb-5">
                    <p className="font-display text-sm font-bold tracking-[0.1em] text-parchment-mid uppercase mb-1">{meta.label}</p>
                    <p className="text-soft-gray-dark text-xs font-ui mb-3">{meta.tagline}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-black text-parchment-light">
                        {price === 0 ? "Free" : `$${price}`}
                      </span>
                      {price !== 0 && <span className="text-soft-gray text-sm font-ui">{perPeriod}</span>}
                    </div>
                  </div>

                  <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                    {meta.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm font-ui text-parchment-mid">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 mt-0.5 text-emerald-glow">
                          <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {tierKey === "free" ? (
                    <Link href="/auth/register" className="w-full py-2.5 rounded-xl text-sm font-ui font-bold text-center border border-warm-wood-light text-parchment-light hover:border-parchment-mid transition-all">
                      {user ? "You're on Free" : "Get started free"}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(tierKey)}
                      disabled={isCurrentPlan || checkout.isPending}
                      className={`w-full py-2.5 rounded-xl text-sm font-ui font-bold transition-all disabled:opacity-60 ${
                        meta.highlighted
                          ? "bg-emerald-glow text-deep-void hover:bg-emerald-bright"
                          : "bg-warm-wood text-parchment-light hover:bg-warm-wood-light"
                      }`}
                    >
                      {isCurrentPlan ? "Current plan" : checkout.isPending ? "Redirecting…" : `Upgrade to ${meta.label}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold tracking-display text-parchment-light text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {[
              { q: "Can I switch plans at any time?", a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades and at the end of your billing cycle for downgrades." },
              { q: "What is the commission rate?", a: "Commission is Velonix's platform cut from each marketplace sale. Free tier is 25%, Creator 20%, Pro 17%, Studio 15%. You always keep the rest." },
              { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee on all paid plans. Contact support within 14 days of your purchase and we'll refund in full, no questions asked." },
              { q: "What happens when I hit my project limit?", a: "You'll be notified and asked to upgrade. Existing projects remain fully accessible — you just can't create new ones until you upgrade or delete some." },
              { q: "Is my payment data secure?", a: "All payments are processed by Stripe, a PCI-DSS Level 1 certified provider. Velonix never stores your card details." },
            ].map(({ q, a }) => (
              <details key={q} className="v-card p-5 group">
                <summary className="font-display text-sm font-semibold tracking-wide text-parchment-light cursor-pointer list-none flex items-center justify-between">
                  {q}
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-soft-gray transition-transform group-open:rotate-45 shrink-0">
                    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </summary>
                <p className="text-soft-gray text-sm font-ui leading-relaxed mt-3">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

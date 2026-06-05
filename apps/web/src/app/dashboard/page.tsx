import type { Metadata } from "next";
import Link from "next/link";
import { DashboardStats } from "@/components/organisms/DashboardStats";
import { GameGrid } from "@/components/organisms/GameGrid";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Header */}
        <div className="flex max-lg:flex-col gap-4 items-center justify-between mb-10">
          <div className="flex flex-col gap-4 max-lg:items-center">
            <h1 className="font-display text-3xl font-bold tracking-display text-parchment-light mb-1">
              Dashboard
            </h1>
            <p className="text-soft-gray font-ui text-sm text-center">
              Manage your games, track earnings, and publish to the marketplace.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/analytics" className="px-4 py-2 rounded-lg border border-warm-wood-light text-parchment-light text-sm font-ui font-semibold hover:border-emerald-glow/50 hover:text-emerald-glow transition-all">
              Analytics
            </Link>
            <Link href="/pricing" className="px-4 py-2 rounded-lg border border-warm-wood-light text-parchment-light text-sm font-ui font-semibold hover:border-royal-gold/50 hover:text-royal-gold transition-all">
              Plans
            </Link>
            <Link href="/studio/new" className="v-btn-primary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="max-lg:hidden"> New Game </span>
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <DashboardStats />

        {/* Divider */}
        <div className="divider-ornamental my-10" />

        {/* Games grid */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light">
            Your Games
          </h2>
          <a href="/marketplace" className="text-emerald-glow text-sm font-ui hover:text-emerald-bright transition-colors">
            View marketplace
          </a>
        </div>
        <GameGrid />
      </div>
    </div>
  );
}

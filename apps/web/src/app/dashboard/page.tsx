import type { Metadata } from "next";
import { DashboardStats } from "@/components/organisms/DashboardStats";
import { GameGrid } from "@/components/organisms/GameGrid";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-display text-parchment-light mb-1">
              Dashboard
            </h1>
            <p className="text-soft-gray font-ui text-sm">
              Manage your games, track earnings, and publish to the marketplace.
            </p>
          </div>
          <a href="/studio/new" className="v-btn-primary">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New Game
          </a>
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

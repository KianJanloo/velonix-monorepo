"use client";

import { useState } from "react";
import { useAdminSubscriptionStats, useAdminSubscribers } from "@/hooks/useAdmin";
import { Pagination } from "@/components/atoms/Pagination";

const TIERS = ["all", "creator", "pro", "studio"] as const;
type TierFilter = (typeof TIERS)[number];

const TIER_BADGE: Record<string, string> = {
  free: "bg-warm-wood text-soft-gray",
  creator: "bg-cyan-spark/10 text-cyan-spark",
  pro: "bg-emerald-ghost text-emerald-glow",
  studio: "bg-royal-gold/10 text-royal-gold",
};

export default function AdminSubscriptionsPage() {
  const [page, setPage] = useState(1);
  const [tier, setTier] = useState<TierFilter>("all");

  const { data: stats, isLoading: statsLoading } = useAdminSubscriptionStats();
  const { data, isLoading } = useAdminSubscribers(page, 20, tier === "all" ? undefined : tier);

  const statCards = [
    { label: "Free", value: stats?.byTier.free ?? 0, color: "text-soft-gray" },
    { label: "Creator", value: stats?.byTier.creator ?? 0, color: "text-cyan-spark" },
    { label: "Pro", value: stats?.byTier.pro ?? 0, color: "text-emerald-glow" },
    { label: "Studio", value: stats?.byTier.studio ?? 0, color: "text-royal-gold" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Subscriptions</h1>
        <span className="text-soft-gray text-sm font-ui">{stats?.paidSubscribers ?? 0} paid subscribers</span>
      </div>

      {/* Tier distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="v-card h-24 animate-pulse" />)
        ) : (
          statCards.map(({ label, value, color }) => (
            <div key={label} className="v-card p-5">
              <p className={`font-display text-3xl font-bold ${color} mb-1`}>{value.toLocaleString()}</p>
              <p className="text-soft-gray text-sm font-ui">{label}</p>
            </div>
          ))
        )}
      </div>

      {/* Tier filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TIERS.map(t => (
          <button
            key={t}
            onClick={() => { setTier(t); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-ui capitalize transition-colors ${
              tier === t
                ? "bg-emerald-ghost text-emerald-glow border border-emerald-glow/30"
                : "border border-warm-wood text-soft-gray hover:text-parchment-light"
            }`}
          >
            {t === "all" ? "All paid" : t}
          </button>
        ))}
      </div>

      {/* Subscriber table */}
      <div className="v-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead className="border-b border-warm-wood">
              <tr>
                {["Subscriber", "Email", "Plan", "Renews / Expires", "Billing", "Joined"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-2xs font-ui font-bold text-soft-gray uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-warm-wood/30">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-warm-wood/30 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length ? data.data.map(sub => (
                <tr key={sub.id} className="border-b border-warm-wood/20 hover:bg-warm-wood/10 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-ui text-parchment-light">{sub.displayName}</p>
                    <p className="text-2xs text-soft-gray">@{sub.username}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-soft-gray font-ui">{sub.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize ${TIER_BADGE[sub.subscriptionTier] ?? TIER_BADGE.free}`}>
                      {sub.subscriptionTier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-2xs text-soft-gray-dark font-mono">
                    {sub.subscriptionExpiresAt ? new Date(sub.subscriptionExpiresAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-2xs font-ui ${sub.hasBilling ? "text-emerald-glow" : "text-soft-gray-dark"}`}>
                      {sub.hasBilling ? "Stripe" : "None"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-2xs text-soft-gray-dark font-mono">{new Date(sub.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-soft-gray text-sm font-ui">No subscribers in this view.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

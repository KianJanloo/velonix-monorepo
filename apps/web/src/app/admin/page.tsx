"use client";

import Link from "next/link";
import { useAdminStats } from "@/hooks/useAdmin";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment-light mb-6">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="v-card h-24 animate-pulse" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.users.total ?? 0, href: "/admin/users", color: "text-emerald-glow" },
    { label: "Total Games", value: stats?.games.total ?? 0, href: "/admin/games", color: "text-royal-gold" },
    { label: "Published", value: stats?.games.published ?? 0, href: "/admin/games?status=published", color: "text-emerald-glow" },
    { label: "Pending Review", value: stats?.games.pendingReview ?? 0, href: "/admin/games?status=reviewing", color: "text-cyan-spark" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Dashboard</h1>
        <span className="text-soft-gray text-xs font-ui">Velonix Admin Panel</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, href, color }) => (
          <Link key={label} href={href} className="v-card p-5 hover:border-warm-wood-light transition-colors">
            <p className={`font-display text-3xl font-bold ${color} mb-1`}>{value.toLocaleString()}</p>
            <p className="text-soft-gray text-sm font-ui">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="v-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Recent Users</h2>
            <Link href="/admin/users" className="text-emerald-glow text-xs font-ui hover:text-emerald-bright">View all →</Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentUsers as { id: string; username: string; displayName: string; role: string; createdAt: string }[] ?? []).map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-warm-wood/40 last:border-0">
                <div>
                  <p className="text-sm font-ui text-parchment-light">{u.displayName}</p>
                  <p className="text-2xs text-soft-gray font-ui">@{u.username}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xs px-2 py-0.5 rounded-full font-ui ${u.role === "admin" ? "bg-crimson-ghost text-crimson-flame" : "bg-warm-wood text-soft-gray"}`}>
                    {u.role}
                  </span>
                  <p className="text-2xs text-soft-gray-dark font-mono mt-1">{new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent games */}
        <div className="v-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Recent Games</h2>
            <Link href="/admin/games" className="text-emerald-glow text-xs font-ui hover:text-emerald-bright">View all →</Link>
          </div>
          <div className="space-y-2">
            {(stats?.recentGames as { id: string; title: string; status: string; creator: { username: string }; createdAt: string }[] ?? []).map(g => (
              <div key={g.id} className="flex items-center justify-between py-2 border-b border-warm-wood/40 last:border-0">
                <div>
                  <p className="text-sm font-ui text-parchment-light">{g.title}</p>
                  <p className="text-2xs text-soft-gray font-ui">by @{g.creator?.username}</p>
                </div>
                <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize ${
                  g.status === "published" ? "bg-emerald-ghost text-emerald-glow" :
                  g.status === "reviewing" ? "bg-[rgba(0,229,255,0.1)] text-cyan-spark" :
                  "bg-warm-wood text-soft-gray"
                }`}>{g.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { StatBlock } from "@/components/molecules/StatBlock";
import { useMyGames } from "@/hooks/useGames";
import { useCurrentUser } from "@/hooks/useAuth";
import type { GameRecord } from "@/types/game";

const COMMISSION_RATES: Record<string, number> = {
  free: 25,
  creator: 20,
  pro: 17,
  studio: 15,
};

function deriveStats(games: GameRecord[], subscriptionTier: string) {
  const published = games.filter((g) => g.status === "published");
  const totalPurchases = games.reduce((s, g) => s + (g.totalPurchases ?? 0), 0);
  const totalViews = games.reduce((s, g) => s + (g.totalViews ?? 0), 0);

  const ratedGames = published.filter(
    (g) => g.averageRating != null && g.totalRatings > 0,
  );
  const avgRating =
    ratedGames.length > 0
      ? ratedGames.reduce((s, g) => s + (g.averageRating ?? 0), 0) /
        ratedGames.length
      : null;
  const totalRatings = ratedGames.reduce((s, g) => s + g.totalRatings, 0);

  const reviewing = games.filter((g) => g.status === "reviewing").length;
  const active = published.length;

  const commissionRate = COMMISSION_RATES[subscriptionTier] ?? 25;
  const tierLabel =
    subscriptionTier === "free"
      ? "Free tier"
      : `${subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)} tier`;

  const viewsDisplay =
    totalViews >= 1000
      ? `${(totalViews / 1000).toFixed(1)}k`
      : String(totalViews);

  return [
    {
      label: "Total Purchases",
      value: totalPurchases.toLocaleString(),
      change: `${published.length} published games`,
      accent: "emerald" as const,
    },
    {
      label: "Marketplace Views",
      value: viewsDisplay,
      change: "All-time views",
      accent: "cyan" as const,
    },
    {
      label: "Active Games",
      value: String(active),
      change: reviewing > 0 ? `${reviewing} in review` : "All published",
      changePositive: reviewing === 0,
      accent: "parchment" as const,
    },
    {
      label: "Avg. Rating",
      value: avgRating ? avgRating.toFixed(1) : "—",
      change: totalRatings > 0 ? `${totalRatings} reviews` : "No reviews yet",
      accent: "gold" as const,
    },
    {
      label: "Total Games",
      value: String(games.length),
      change: `${games.filter((g) => g.status === "draft").length} drafts`,
      accent: "emerald" as const,
    },
    {
      label: "Commission Rate",
      value: `${commissionRate}%`,
      change: tierLabel,
      accent: "gold" as const,
    },
  ];
}

export function DashboardStats() {
  const { data: games, isLoading } = useMyGames();
  const user = useCurrentUser();
  const tier = user?.subscriptionTier ?? "free";

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="v-card p-4 h-20 animate-pulse bg-warm-wood/20"
          />
        ))}
      </div>
    );
  }

  const stats = deriveStats(games ?? [], tier);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <StatBlock key={stat.label} {...stat} />
      ))}
    </div>
  );
}

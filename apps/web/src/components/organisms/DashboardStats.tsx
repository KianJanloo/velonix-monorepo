"use client";

import { StatBlock } from "@/components/molecules/StatBlock";

// In production these would come from useQuery / TanStack Query
const MOCK_STATS = [
  { label: "Total Revenue", value: "$4,218", change: "+18.4% this month", accent: "emerald" as const },
  { label: "Total Sales", value: "1,047", change: "+12 today", accent: "gold" as const },
  { label: "Marketplace Views", value: "32.1k", change: "+5.2% this week", accent: "cyan" as const },
  { label: "Active Games", value: "7", change: "2 in review", changePositive: false, accent: "parchment" as const },
  { label: "Avg. Rating", value: "4.7", change: "342 reviews", accent: "emerald" as const },
  { label: "Commission Rate", value: "17%", change: "Pro tier", accent: "gold" as const },
];

export function DashboardStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {MOCK_STATS.map((stat) => (
        <StatBlock key={stat.label} {...stat} />
      ))}
    </div>
  );
}

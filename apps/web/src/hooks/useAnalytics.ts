"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface CreatorAnalytics {
  totals: {
    totalRevenue: number;
    revenue30d: number;
    totalSales: number;
    uniqueBuyers: number;
    gameCount: number;
    componentCount: number;
  };
  series: { date: string; revenue: number; sales: number }[];
  topGames: { id: string; title: string; sales: number; revenue: number }[];
  topComponents: { id: string; title: string; sales: number; revenue: number }[];
  byCountry: { country: string; revenue: number; sales: number }[];
}

/** Creator sales analytics (revenue/sales over time, top items, regional breakdown). */
export function useCreatorAnalytics(enabled = true) {
  return useQuery({
    queryKey: ["analytics", "creator"],
    queryFn: () => apiClient.get<CreatorAnalytics>("/analytics/creator"),
    enabled,
    staleTime: 60_000,
  });
}

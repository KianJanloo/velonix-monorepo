"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";

export interface PlanConfig {
  tier: string;
  name: string;
  description: string;
  priceMonthly: number; // cents
  priceYearly: number;
  commissionRate: number;
  maxProjects: number | null;
  has3DPreview: boolean;
  hasAnalytics: boolean;
  hasRuleEngine: boolean;
  hasPrioritySupport: boolean;
  features: string[];
  sortOrder: number;
}

/** Public — all subscription plans (admin-managed source of truth). */
export function usePlans() {
  return useQuery<PlanConfig[]>({
    queryKey: ["plans"],
    queryFn: () => apiClient.get<PlanConfig[]>("/plans"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Admin — update a plan's pricing/access. */
export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tier, updatedAt: _updatedAt, ...patch }: Partial<PlanConfig> & { tier: string; updatedAt?: string }) =>
      apiClient.patch<PlanConfig>(`/plans/${tier}`, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["plans"] });
      toast.success("Plan updated.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update plan."),
  });
}

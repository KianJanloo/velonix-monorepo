"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";

interface TierDetail {
  tier: string;
  limits: {
    maxProjects: number;
    commissionRate: number;
    hasAnalytics: boolean;
    has3DPreview: boolean;
    hasCustomDomain: boolean;
    hasTeamCollaboration: boolean;
    hasPrioritySupport: boolean;
  };
  prices: { monthly: string | null; yearly: string | null };
}

export function useSubscriptionTiers() {
  return useQuery<TierDetail[]>({
    queryKey: ["subscription-tiers"],
    queryFn: () => apiClient.get<TierDetail[]>("/subscriptions/tiers"),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSubscriptionCheckout() {
  return useMutation({
    mutationFn: ({ tier, interval }: { tier: string; interval: "monthly" | "yearly" }) =>
      apiClient.post<{ url: string }>("/subscriptions/checkout", { tier, interval }),
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Failed to start checkout. Try again.";
      toast.error(msg);
    },
  });
}

export function useSubscriptionPortal() {
  return useMutation({
    mutationFn: () => apiClient.post<{ url: string }>("/subscriptions/portal"),
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Could not open billing portal.";
      toast.error(msg);
    },
  });
}

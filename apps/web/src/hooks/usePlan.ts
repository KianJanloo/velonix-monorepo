"use client";

import { useCurrentUser } from "@/hooks/useAuth";
import { getPlanLimits, planLabel } from "@/lib/plan";

/** Returns the current user's plan tier, resolved limits, and convenience flags. */
export function usePlan() {
  const user = useCurrentUser();
  const tier = user?.subscriptionTier ?? "free";
  const limits = getPlanLimits(tier);

  return {
    tier,
    label: planLabel(tier),
    limits,
    hasAnalytics: limits.hasAnalytics,
    has3DPreview: limits.has3DPreview,
    hasCustomDomain: limits.hasCustomDomain,
    hasTeamCollaboration: limits.hasTeamCollaboration,
    hasPrioritySupport: limits.hasPrioritySupport,
    maxProjects: limits.maxProjects,
    commissionRate: limits.commissionRate,
    isPaid: tier !== "free",
  };
}

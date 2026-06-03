"use client";

import { useCurrentUser } from "@/hooks/useAuth";
import { usePlans } from "@/hooks/usePlans";
import { getPlanLimits, planLabel } from "@/lib/plan";

/** Returns the current user's plan tier, resolved limits, and convenience flags. */
export function usePlan() {
  const user = useCurrentUser();
  const tier = user?.subscriptionTier ?? "free";
  const { data: plans } = usePlans();

  // Static defaults are the floor; the admin-editable DB config (when loaded)
  // overrides the fields it owns so panel changes take effect live.
  const base = getPlanLimits(tier);
  const config = plans?.find((p) => p.tier === tier);
  const limits = config
    ? {
        ...base,
        maxProjects: config.maxProjects,
        maxPagesPerProject: config.maxPagesPerProject,
        commissionRate: config.commissionRate,
        has3DPreview: config.has3DPreview,
        hasAnalytics: config.hasAnalytics,
        hasPrioritySupport: config.hasPrioritySupport,
      }
    : base;

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

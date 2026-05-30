import { SUBSCRIPTION_LIMITS, type SubscriptionTier, type SubscriptionLimits } from "@velonix/types";

const FREE_LIMITS = SUBSCRIPTION_LIMITS.free;

/** Resolve the limits/features for a given tier string (defensive against unknown values). */
export function getPlanLimits(tier: string | undefined | null): SubscriptionLimits {
  if (tier && tier in SUBSCRIPTION_LIMITS) {
    return SUBSCRIPTION_LIMITS[tier as SubscriptionTier];
  }
  return FREE_LIMITS;
}

export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  creator: "Creator",
  pro: "Pro",
  studio: "Studio",
};

export function planLabel(tier: string | undefined | null): string {
  return PLAN_LABELS[tier ?? "free"] ?? "Free";
}

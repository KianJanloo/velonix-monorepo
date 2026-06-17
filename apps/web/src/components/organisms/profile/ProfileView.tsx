"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import { GameCard } from "@/components/molecules/GameCard";
import { FollowButton } from "@/components/molecules/FollowButton";
import { usePublicProfile } from "@/hooks/useProfile";
import { ApiError } from "@/lib/apiClient";

const TIER_LABEL: Record<string, string> = {
  free: "Creator",
  creator: "Creator",
  pro: "Pro Creator",
  studio: "Studio",
};

export function ProfileView({ username }: { username: string }) {
  const { data: profile, isLoading, error } = usePublicProfile(username);

  if (error instanceof ApiError && error.statusCode === 404) notFound();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-void">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="v-card p-8 mb-8 flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-warm-wood/40 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-warm-wood/40 rounded animate-pulse" />
              <div className="h-4 w-56 bg-warm-wood/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="v-card p-8 mb-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="relative w-20 h-20 rounded-full bg-warm-wood border-2 border-royal-gold/30 flex items-center justify-center shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="font-display text-2xl text-royal-gold font-bold">
                {profile.displayName[0]?.toUpperCase() ?? "V"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold tracking-display text-parchment-light mb-1">
              {profile.displayName}
            </h1>
            <p className="text-soft-gray text-sm font-ui mb-2">
              @{profile.username}
            </p>
            {profile.bio && (
              <p className="text-parchment-mid text-sm font-ui mb-3 max-w-lg">
                {profile.bio}
              </p>
            )}
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              {profile.subscriptionTier !== "free" && (
                <span className="v-badge-premium">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 1l1 2.5h2.5L6.5 5l.5 2.5L5 6.5 3 7.5l.5-2.5L1.5 3.5H4z"
                      fill="currentColor"
                    />
                  </svg>
                  {TIER_LABEL[profile.subscriptionTier] ?? "Creator"}
                </span>
              )}
              <span className="text-2xs text-soft-gray font-ui">
                Joined{" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-emerald-glow">
                {profile.stats.publishedGames}
              </p>
              <p className="text-2xs text-soft-gray font-ui uppercase tracking-wider">
                Games
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-royal-gold">
                {profile.stats.totalSales}
              </p>
              <p className="text-2xs text-soft-gray font-ui uppercase tracking-wider">
                Sales
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-cyan-spark">
                {profile.stats.followersCount}
              </p>
              <p className="text-2xs text-soft-gray font-ui uppercase tracking-wider">
                Followers
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-2xl font-bold text-parchment-mid">
                {profile.stats.followingCount}
              </p>
              <p className="text-2xs text-soft-gray font-ui uppercase tracking-wider">
                Following
              </p>
            </div>
          </div>

          <FollowButton username={profile.username} />
        </div>

        {/* Games */}
        <h2 className="font-display text-lg font-semibold tracking-display text-parchment-light mb-5">
          Published Games
        </h2>
        {profile.games.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="v-card py-16 text-center">
            <p className="font-display text-parchment-mid text-lg mb-2">
              No published games yet
            </p>
            <p className="text-soft-gray text-sm font-ui">
              This creator hasn&apos;t published any games to the marketplace.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

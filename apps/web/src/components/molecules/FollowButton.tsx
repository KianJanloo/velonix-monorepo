"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useFollowStatus, useFollowUser, useUnfollowUser } from "@/hooks/useProfile";

interface FollowButtonProps {
  username: string;
  className?: string;
}

/** Follow/unfollow toggle. Hides itself on the viewer's own profile, and
 * sends signed-out visitors to login instead of silently failing. */
export function FollowButton({ username, className }: FollowButtonProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = !!currentUser;
  const isOwnProfile = currentUser?.username === username;

  const { data: status } = useFollowStatus(username, isAuthenticated && !isOwnProfile);
  const follow = useFollowUser(username);
  const unfollow = useUnfollowUser(username);

  if (isOwnProfile) return null;

  const isFollowing = status?.isFollowing ?? false;
  const pending = follow.isPending || unfollow.isPending;

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/profile/${username}`);
      return;
    }
    if (isFollowing) unfollow.mutate();
    else follow.mutate();
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "px-4 py-2 rounded-lg text-2xs font-ui font-bold tracking-[0.06em] uppercase transition-colors disabled:opacity-60",
        isFollowing
          ? "bg-rich-wood-dark border border-warm-wood text-parchment-light hover:border-crimson-flame hover:text-crimson-flame"
          : "bg-emerald-glow text-deep-void hover:bg-emerald-glow/90",
        className,
      )}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import type { GameSummary } from "@velonix/types";
import type { UpdateProfileDto } from "@velonix/game-engine";

export interface PublicProfile {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  subscriptionTier: string;
  totalSales: number;
  createdAt: string;
  stats: {
    publishedGames: number;
    totalSales: number;
    followersCount: number;
    followingCount: number;
  };
  games: GameSummary[];
}

export interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
}

export function usePublicProfile(username: string) {
  return useQuery<PublicProfile>({
    queryKey: ["profile", username],
    queryFn: () => apiClient.get<PublicProfile>(`/users/${username}`),
    enabled: !!username,
  });
}

/** Whether the current user follows `username`, plus live counts. Requires auth. */
export function useFollowStatus(username: string, enabled: boolean) {
  return useQuery<FollowStatus>({
    queryKey: ["follow-status", username],
    queryFn: () =>
      apiClient.get<FollowStatus>(`/users/${username}/follow-status`),
    enabled: enabled && !!username,
  });
}

export function useFollowUser(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<FollowStatus>(`/users/${username}/follow`),
    onSuccess: (status) => {
      qc.setQueryData(["follow-status", username], status);
      void qc.invalidateQueries({ queryKey: ["profile", username] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't follow this creator.",
      );
    },
  });
}

export function useUnfollowUser(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.delete<FollowStatus>(`/users/${username}/follow`),
    onSuccess: (status) => {
      qc.setQueryData(["follow-status", username], status);
      void qc.invalidateQueries({ queryKey: ["profile", username] });
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't unfollow this creator.",
      );
    },
  });
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (dto: UpdateProfileDto) =>
      apiClient.patch<AuthUser>("/users/me", dto),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success("Profile saved.");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Failed to save profile.";
      toast.error(message);
    },
  });
}

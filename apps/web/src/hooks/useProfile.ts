"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
  stats: { publishedGames: number; totalSales: number };
  games: GameSummary[];
}

export function usePublicProfile(username: string) {
  return useQuery<PublicProfile>({
    queryKey: ["profile", username],
    queryFn: () => apiClient.get<PublicProfile>(`/users/${username}`),
    enabled: !!username,
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

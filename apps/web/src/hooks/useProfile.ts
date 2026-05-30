"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import type { UpdateProfileDto } from "@velonix/game-engine";

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

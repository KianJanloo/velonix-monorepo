"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import type { LoginDto, RegisterDto } from "@velonix/game-engine";

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: LoginDto) =>
      apiClient.post<AuthResponse>("/auth/login", dto),
    onSuccess: ({ accessToken, user }) => {
      setAuth(user, accessToken);
      router.push("/dashboard");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      toast.error(message);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: RegisterDto) =>
      apiClient.post<AuthResponse>("/auth/register", dto),
    onSuccess: ({ accessToken, user }) => {
      setAuth(user, accessToken);
      router.push("/dashboard");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      toast.error(message);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();
  const router = useRouter();

  return () => {
    clearAuth();
    qc.clear();
    router.push("/");
  };
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

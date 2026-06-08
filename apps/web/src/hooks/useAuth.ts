"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import type { ForgetPassDto, LoginDto, RegisterDto, ResetPassDto } from "@velonix/game-engine";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

const API_ROOT =
  (process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001") + "/api/v1";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const params = useSearchParams();

  return useMutation({
    mutationFn: (dto: LoginDto) =>
      apiClient.post<AuthResponse>("/auth/login", dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setAuth(user, accessToken, refreshToken);
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: RegisterDto) =>
      apiClient.post<AuthResponse>("/auth/register", dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setAuth(user, accessToken, refreshToken);
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });
}

export function useForgetPass() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: ForgetPassDto) =>
      apiClient.post<AuthResponse>("/auth/forget-pass", dto),
    onSuccess: () => {
      toast.success('Verification Code sent for your email.')
      router.push("/auth/reset-pass");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });
}

export function useResetPass() {
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: ResetPassDto) =>
      apiClient.post<AuthResponse>("/auth/reset-pass", dto),
    onSuccess: () => {
      router.push("/auth/login");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();
  const router = useRouter();

  return () => {
    // Best-effort server-side revoke; ignore errors
    void apiClient.post("/auth/logout").catch(() => {});
    clearAuth();
    qc.clear();
    router.push("/");
  };
}

/** Redirect the browser to the API's Google OAuth entry point. */
export function loginWithGoogle() {
  window.location.href = `${API_ROOT}/auth/google`;
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

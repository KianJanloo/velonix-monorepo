"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import type {
  ForgetPassDto,
  LoginDto,
  RegisterCompleteDto,
  RegisterDto,
  ResetPassDto,
} from "@velonix/game-engine";

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface TokenResponse {
  token: string;
}

const API_ROOT =
  (process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001") + "/api/v1";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();
  const params = useSearchParams();

  return useMutation({
    mutationFn: (dto: LoginDto & { turnstileToken: string | null }) =>
      apiClient.post<AuthResponse>("/auth/login", dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setAuth(user, accessToken, refreshToken);
      const next = params.get("next");
      router.push(next && next.startsWith("/") ? next : "/dashboard");
    },
    onError: (err) => {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Try again.",
      );
    },
  });
}

export function useRegister() {
  const { setToken, setRegisterEmail } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: RegisterDto) =>
      apiClient.post<TokenResponse>("/auth/register", dto),
    onSuccess: ({ token }, variables) => {
      setToken(token);
      setRegisterEmail(variables.email);
      router.push("/auth/register-complete");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });
}

export function useRegisterComplete() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setToken = useAuthStore((s) => s.setToken);
  const setRegisterEmail = useAuthStore((s) => s.setRegisterEmail);
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: RegisterCompleteDto) =>
      apiClient.post<AuthResponse>("/auth/register/complete", dto),
    onSuccess: ({ accessToken, refreshToken, user }) => {
      setAuth(user, accessToken, refreshToken);
      setToken(null);
      setRegisterEmail(null);
      router.push("/dashboard");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });
}

export function useForgetPass() {
  const router = useRouter();
  const { setToken, setResetEmail } = useAuthStore();

  return useMutation({
    mutationFn: (dto: ForgetPassDto) =>
      apiClient.post<{ token: string }>("/auth/forget-pass", dto),
    onSuccess: ({ token }, variables) => {
      setToken(token);
      setResetEmail(variables.email);
      toast.success("Verification code sent to your email.");
      router.push("/auth/reset-pass");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    },
  });
}

export function useResetPass() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setResetEmail = useAuthStore((s) => s.setResetEmail);

  return useMutation({
    mutationFn: (dto: ResetPassDto) =>
      apiClient.post("/auth/reset-pass", dto),
    onSuccess: () => {
      setToken(null);
      setResetEmail(null);
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

export default function AuthCallbackPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const params = new URLSearchParams(hash);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");

    if (!accessToken || !refreshToken) {
      setError("Sign-in failed. Missing tokens.");
      return;
    }

    setTokens(accessToken, refreshToken);
    // Fetch the user with the new token, then redirect
    apiClient.get<AuthUser>("/auth/me")
      .then((user) => {
        setAuth(user, accessToken, refreshToken);
        router.replace("/dashboard");
      })
      .catch(() => setError("Could not load your account. Please try signing in again."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-deep-void flex items-center justify-center px-4">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-crimson-flame font-ui text-sm mb-3">{error}</p>
            <button onClick={() => router.push("/auth/login")} className="text-emerald-glow font-ui text-sm hover:text-emerald-bright">
              Back to sign in
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-2 border-emerald-glow/30 border-t-emerald-glow rounded-full animate-spin mx-auto mb-4" />
            <p className="text-soft-gray font-ui text-sm">Completing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}

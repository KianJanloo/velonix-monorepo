"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

/**
 * Wraps all /auth/* pages.
 * If the user is already authenticated (token in Zustand persist store)
 * they are immediately bounced to /dashboard so they never land on the
 * login / register pages after a fresh sign-in or registration.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      router.replace("/dashboard");
    }
  }, [accessToken, router]);

  // While hydrating from localStorage the token may briefly be null; render
  // children normally — the effect above will redirect once hydration settles.
  return <>{children}</>;
}

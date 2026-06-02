"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import {
  useAuthStore,
  getAccessToken,
  getRefreshToken,
  type AuthUser,
} from "@/stores/authStore";

/** Routes where an expired session should bounce the user to login. */
const PROTECTED_PREFIXES = ["/studio", "/dashboard", "/settings", "/admin"];

/**
 * App-wide session manager (rendered once at the root):
 *  - On load, once the persisted store hydrates, silently validates the
 *    session by fetching the current user (apiClient refreshes the access
 *    token on a 401 automatically). Refreshes stale persisted user data.
 *  - Listens for `velonix:auth-expired` (emitted when a refresh fails) to
 *    clear cached data and redirect away from protected pages.
 */
export function SessionGuard() {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const bootstrappedRef = useRef(false);

  // Validate / refresh the session on first load.
  useEffect(() => {
    if (!hasHydrated || bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    if (!getRefreshToken()) return; // nothing to validate

    void apiClient
      .get<AuthUser>("/auth/me")
      .then((user) => {
        const at = getAccessToken();
        if (at)
          useAuthStore
            .getState()
            .setAuth(user, at, getRefreshToken() ?? undefined);
      })
      .catch(() => {
        // apiClient already clears auth + emits auth-expired on a hard 401.
      });
  }, [hasHydrated]);

  // React to a session that expired mid-use.
  useEffect(() => {
    function onExpired() {
      useAuthStore.getState().clearAuth();
      qc.clear();
      if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
        router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      }
    }
    window.addEventListener("velonix:auth-expired", onExpired);
    return () => window.removeEventListener("velonix:auth-expired", onExpired);
  }, [pathname, router, qc]);

  return null;
}

"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

/**
 * Client-side auth guard for protected pages.
 * Auth lives in localStorage (Zustand persist), so a server middleware can't
 * see it — this gates rendering and redirects unauthenticated users to login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only decide once the persisted store has hydrated, so we don't bounce a
    // logged-in user to login on a hard refresh before localStorage is read.
    if (hasHydrated && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hasHydrated, user, router, pathname]);

  if (!hasHydrated || !user) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
          <p className="text-soft-gray text-sm font-ui">
            Checking your session…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

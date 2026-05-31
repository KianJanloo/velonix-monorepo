"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/useAuth";

/**
 * Client-side auth guard for protected pages.
 * Auth lives in localStorage (Zustand persist), so a server middleware can't
 * see it — this gates rendering and redirects unauthenticated users to login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait a tick for the persisted store to hydrate
    if (!user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/auth/login?next=${next}`);
    } else {
      setChecked(true);
    }
  }, [user, router, pathname]);

  if (!user || !checked) {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
          <p className="text-soft-gray text-sm font-ui">Checking your session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

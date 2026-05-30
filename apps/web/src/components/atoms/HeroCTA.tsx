"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

/**
 * Landing page primary CTA.
 * Sends authenticated users straight to the studio; unauthenticated users to
 * registration — so clicking "Start Building Free" right after signing in or
 * registering doesn't loop back to the auth pages.
 */
export function HeroCTA() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Link
        href={user ? "/studio/new" : "/auth/register"}
        className="v-btn-primary text-base px-8 py-3"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {user ? "Open Studio" : "Start Building Free"}
      </Link>
      <Link href="/marketplace" className="v-btn-outline text-base px-8 py-3">
        Browse Marketplace
      </Link>
    </div>
  );
}

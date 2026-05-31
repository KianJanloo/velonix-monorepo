"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VelonixLogo } from "@/components/atoms/VelonixLogo";
import { Button } from "@/components/atoms/Button";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { NotificationBell } from "@/components/organisms/NotificationBell";
import { cn } from "@/lib/utils";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useLogout();
  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-200 h-14 bg-rich-wood-dark/90 backdrop-blur-md border-b border-warm-wood">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <VelonixLogo size={28} showWordmark wordmarkSize="sm" />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-ui font-medium transition-colors duration-150",
                pathname.startsWith(href)
                  ? "text-emerald-glow bg-emerald-ghost"
                  : "text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <NotificationBell />
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-warm-wood transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-warm-wood border border-royal-gold/40 flex items-center justify-center shrink-0">
                  <span className="font-display text-xs text-royal-gold font-bold leading-none">
                    {user.displayName[0]?.toUpperCase() ?? "V"}
                  </span>
                </div>
                <span className="text-sm font-ui text-parchment-light hidden sm:block">
                  {user.displayName}
                </span>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-crimson-flame hover:text-crimson-bright">Admin</Button>
                </Link>
              )}
              <Link href="/settings">
                <Button variant="ghost" size="sm">Settings</Button>
              </Link>
              <Button variant="outline" size="sm" className="max-md:hidden" onClick={logout}>
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 3.5v5M3.5 6h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

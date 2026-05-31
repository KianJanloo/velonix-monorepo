"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VelonixLogo } from "@/components/atoms/VelonixLogo";
import { Button } from "@/components/atoms/Button";
import { ThemeToggle } from "@/components/atoms/ThemeToggle";
import { NotificationBell } from "@/components/organisms/NotificationBell";
import { cn } from "@/lib/utils";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";

const PUBLIC_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

const AUTH_LINKS = [{ href: "/dashboard", label: "Dashboard" }];

export function Navbar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const logout = useLogout();
  // Avoid hydration mismatch: auth state is only known on the client (localStorage)
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const authed = mounted && !!user;
  const isAdmin = authed && user?.role === "admin";
  const navLinks = authed ? [...PUBLIC_LINKS, ...AUTH_LINKS] : PUBLIC_LINKS;

  return (
    <header className="sticky top-0 z-200 h-14 bg-rich-wood-dark/90 backdrop-blur-md border-b border-warm-wood">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center gap-4 md:gap-8">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <VelonixLogo size={28} showWordmark wordmarkSize="sm" />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-ui font-medium transition-colors duration-150",
                pathname.startsWith(href)
                  ? "text-emerald-glow bg-emerald-ghost"
                  : "text-soft-gray hover:text-parchment-light hover:bg-warm-wood",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* Theme toggle: desktop only (also available in mobile menu) */}
          <span className="hidden lg:inline-flex">
            <ThemeToggle />
          </span>
          {authed && <NotificationBell />}

          {/* Desktop auth controls */}
          <div className="hidden lg:flex items-center gap-2">
            {authed && user ? (
              <>
                <Link
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-warm-wood transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-warm-wood border border-royal-gold/40 flex items-center justify-center shrink-0">
                    <span className="font-display text-xs text-royal-gold font-bold leading-none">
                      {user.displayName?.[0]?.toUpperCase() ?? "V"}
                    </span>
                  </div>
                  <span className="text-sm font-ui text-parchment-light hidden xl:block">
                    {user.displayName}
                  </span>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-crimson-flame hover:text-crimson-bright"
                    >
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/settings">
                  <Button variant="ghost" size="sm">
                    Settings
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" size="sm">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="6"
                        cy="6"
                        r="5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M6 3.5v5M3.5 6h5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-soft-gray hover:text-parchment-light hover:bg-warm-wood transition-colors"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M4 4l10 10M14 4L4 14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 5h12M3 9h12M3 13h12"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="lg:hidden border-t border-warm-wood bg-rich-wood-dark">
          <nav className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2.5 rounded-lg text-sm font-ui font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "text-emerald-glow bg-emerald-ghost"
                    : "text-soft-gray hover:text-parchment-light hover:bg-warm-wood",
                )}
              >
                {label}
              </Link>
            ))}
            <div className="h-px bg-warm-wood my-2" />
            {/* Appearance */}
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-sm font-ui text-soft-gray">Appearance</span>
              <ThemeToggle />
            </div>
            <div className="h-px bg-warm-wood my-2" />
            {authed && user ? (
              <>
                <Link
                  href={`/profile/${user.username}`}
                  className="px-3 py-2.5 rounded-lg text-sm font-ui text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
                >
                  My Profile
                </Link>
                <Link
                  href="/settings"
                  className="px-3 py-2.5 rounded-lg text-sm font-ui text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
                >
                  Settings
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="px-3 py-2.5 rounded-lg text-sm font-ui text-crimson-flame hover:bg-warm-wood"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="px-3 py-2.5 rounded-lg text-sm font-ui text-left text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="primary" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

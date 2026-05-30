"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { VelonixLogo } from "@/components/atoms/VelonixLogo";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/studio/new", label: "Studio" },
];

export function Navbar() {
  const pathname = usePathname();

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
        <div className="ml-auto flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}

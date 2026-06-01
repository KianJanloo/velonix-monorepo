"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";
import { PromoBanner } from "@/components/organisms/PromoBanner";
import type { PromoEventPlacement } from "@velonix/types";

const NO_SHELL_PREFIXES = ["/studio", "/auth"];

function placementFor(pathname: string): PromoEventPlacement {
  if (pathname === "/") return "landing";
  if (pathname.startsWith("/marketplace")) return "marketplace";
  return "global";
}

interface MainShellProps {
  children: React.ReactNode;
}

export function MainShell({ children }: MainShellProps) {
  const pathname = usePathname();
  const bare = NO_SHELL_PREFIXES.some((p) => pathname.startsWith(p));

  if (bare) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen">
      <PromoBanner placement={placementFor(pathname)} />
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

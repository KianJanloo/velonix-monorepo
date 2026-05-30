"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/organisms/Navbar";
import { Footer } from "@/components/organisms/Footer";

const NO_SHELL_PREFIXES = ["/studio", "/auth"];

interface MainShellProps {
  children: React.ReactNode;
}

export function MainShell({ children }: MainShellProps) {
  const pathname = usePathname();
  const bare = NO_SHELL_PREFIXES.some((p) => pathname.startsWith(p));

  if (bare) return <>{children}</>;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

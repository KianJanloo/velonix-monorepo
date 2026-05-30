"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useAuth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { href: "/admin/users", label: "Users", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-3.31 2.91-6 6.5-6S14 10.69 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { href: "/admin/games", label: "Games", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5.5h13M5.5 1v13" stroke="currentColor" strokeWidth="1" opacity="0.4"/></svg> },
  { href: "/admin/blog", label: "Blog", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5h7M4 7.5h7M4 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-glow/30 border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-void flex">
      {/* Sidebar */}
      <aside className="w-56 bg-rich-wood-dark border-r border-warm-wood flex flex-col shrink-0">
        <div className="h-14 border-b border-warm-wood flex items-center px-5 gap-2">
          <div className="w-6 h-6 rounded-md bg-crimson-flame/20 border border-crimson-flame/40 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1 3h3l-2.5 2 1 3L6 7.5 3.5 9l1-3L2 4h3z" fill="currentColor" className="text-crimson-flame" /></svg>
          </div>
          <span className="font-display text-xs font-bold tracking-[0.1em] text-crimson-flame uppercase">Admin</span>
        </div>

        <nav className="flex-1 p-2">
          {NAV.map(({ href, label, icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-ui transition-colors ${
                  active ? "bg-emerald-ghost text-emerald-glow" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"
                }`}
              >
                <span className={active ? "text-emerald-glow" : "text-soft-gray-dark"}>{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-warm-wood">
          <Link href="/" className="flex items-center gap-2 text-soft-gray-dark text-xs font-ui hover:text-soft-gray transition-colors">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to site
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <header className="h-14 border-b border-warm-wood bg-rich-wood-dark/80 flex items-center px-6">
          <span className="text-parchment-mid text-sm font-ui">
            Signed in as <span className="text-parchment-light font-semibold">{user.displayName}</span>
            <span className="ml-2 text-2xs bg-crimson-ghost border border-crimson-flame/30 text-crimson-flame px-1.5 py-0.5 rounded-full">Admin</span>
          </span>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

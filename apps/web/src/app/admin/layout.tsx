"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useAuth";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { href: "/admin/users", label: "Users", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M1 14c0-3.31 2.91-6 6.5-6S14 10.69 14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
  { href: "/admin/games", label: "Games", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M1 5.5h13M5.5 1v13" stroke="currentColor" strokeWidth="1" opacity="0.4"/></svg> },
  { href: "/admin/blog", label: "Blog", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M4 5h7M4 7.5h7M4 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { href: "/admin/plans", label: "Plans", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1l2 4 4.5.5-3.3 3 .9 4.5-4.1-2.3L3.4 13l.9-4.5L1 5.5 5.5 5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> },
  { href: "/admin/payments", label: "Payments", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 6h13" stroke="currentColor" strokeWidth="1.3"/><path d="M3.5 9.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 4.5A2.5 2.5 0 014.5 2h6A2.5 2.5 0 0113 4.5v6a2.5 2.5 0 01-2.5 2.5h-6A2.5 2.5 0 012 10.5z" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7.5l1.5 1.5L10 5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { href: "/admin/assets", label: "Assets", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8.5" y="1.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1.5" y="8.5" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { href: "/admin/support", label: "Support", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 3.5h11a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2.5v-2.5a1 1 0 01-1-1v-6a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
  { href: "/admin/settings", label: "Settings", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3"/><path d="M7.5 1v2M7.5 12v2M14 7.5h-2M3 7.5H1M12 3l-1.5 1.5M4.5 10.5L3 12M12 12l-1.5-1.5M4.5 4.5L3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> },
  { href: "/admin/events", label: "Events", icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 5.5h13M3 2h9a1.5 1.5 0 011.5 1.5v8A1.5 1.5 0 0112 13H3a1.5 1.5 0 01-1.5-1.5v-8A1.5 1.5 0 013 2z" stroke="currentColor" strokeWidth="1.3"/><path d="M4.5 8.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "admin") {
      router.push("/unauthorized");
    }
  }, [user, router]);

  // Close the mobile drawer on navigation
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-glow/30 border-t-emerald-glow rounded-full animate-spin" />
      </div>
    );
  }

  const SidebarBody = (
    <>
      <div className="h-14 border-b border-warm-wood flex items-center px-5 gap-2 shrink-0">
        <div className="w-6 h-6 rounded-md bg-crimson-flame/20 border border-crimson-flame/40 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l1 3h3l-2.5 2 1 3L6 7.5 3.5 9l1-3L2 4h3z" fill="currentColor" className="text-crimson-flame" /></svg>
        </div>
        <span className="font-display text-xs font-bold tracking-[0.1em] text-crimson-flame uppercase">Admin</span>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
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
      <div className="p-3 border-t border-warm-wood shrink-0">
        <Link href="/" className="flex items-center gap-2 text-soft-gray-dark text-xs font-ui hover:text-soft-gray transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to site
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-deep-void flex">
      {/* Desktop sidebar */}
      <aside className="w-56 bg-rich-wood-dark border-r border-warm-wood flex-col shrink-0 hidden lg:flex">
        {SidebarBody}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-deep-void/70" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-rich-wood-dark border-r border-warm-wood flex flex-col">
            {SidebarBody}
          </aside>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-auto min-w-0">
        <header className="h-14 border-b border-warm-wood bg-rich-wood-dark/80 flex items-center px-4 sm:px-6 gap-3 sticky top-0 z-30">
          <button onClick={() => setDrawerOpen(true)} className="lg:hidden text-soft-gray hover:text-parchment-light" aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <span className="text-parchment-mid text-sm font-ui truncate">
            <span className="hidden sm:inline">Signed in as </span>
            <span className="text-parchment-light font-semibold">{user.displayName}</span>
            <span className="ml-2 text-2xs bg-crimson-ghost border border-crimson-flame/30 text-crimson-flame px-1.5 py-0.5 rounded-full">Admin</span>
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 min-w-0">{children}</main>
      </div>
    </div>
  );
}

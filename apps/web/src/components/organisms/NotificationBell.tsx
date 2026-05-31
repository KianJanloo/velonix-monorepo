"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useNotifications, useMarkAllRead, useMarkRead, useDeleteNotification } from "@/hooks/useNotifications";

const TYPE_ICON: Record<string, React.ReactNode> = {
  game_approved: <span className="text-emerald-glow">✓</span>,
  game_rejected: <span className="text-crimson-flame">!</span>,
  new_review: <span className="text-royal-gold">★</span>,
  new_sale: <span className="text-emerald-glow">$</span>,
  subscription: <span className="text-cyan-spark">↑</span>,
  system: <span className="text-soft-gray">•</span>,
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useNotifications();
  const markAll = useMarkAllRead();
  const markRead = useMarkRead();
  const del = useDeleteNotification();

  const unread = data?.unread ?? 0;
  const items = data?.data ?? [];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-soft-gray hover:text-parchment-light hover:bg-warm-wood transition-colors"
      >
        <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
          <path d="M9 2a5 5 0 00-5 5v3l-1.5 2.5h13L14 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M7 14a2 2 0 004 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-crimson-flame text-white text-[10px] font-ui font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-rich-wood-dark border border-warm-wood rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-warm-wood">
            <span className="font-display text-sm font-bold text-parchment-light">Notifications</span>
            {unread > 0 && (
              <button onClick={() => markAll.mutate()} className="text-2xs text-emerald-glow font-ui hover:text-emerald-bright">Mark all read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-soft-gray text-sm font-ui">No notifications yet</p>
                <p className="text-soft-gray-dark text-2xs font-ui mt-1">We&apos;ll let you know when something happens.</p>
              </div>
            ) : items.map(n => {
              const inner = (
                <div className={`flex gap-3 px-4 py-3 border-b border-warm-wood/40 hover:bg-warm-wood/20 transition-colors ${!n.isRead ? "bg-emerald-subtle" : ""}`}>
                  <div className="w-7 h-7 rounded-full bg-warm-wood flex items-center justify-center text-sm shrink-0 font-bold">{TYPE_ICON[n.type] ?? "•"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-ui font-semibold text-parchment-light">{n.title}</p>
                    <p className="text-2xs text-soft-gray font-ui line-clamp-2 mt-0.5">{n.body}</p>
                    <p className="text-2xs text-soft-gray-dark font-ui mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); del.mutate(n.id); }} className="text-soft-gray-dark hover:text-crimson-flame text-2xs shrink-0">✕</button>
                </div>
              );
              return n.linkUrl ? (
                <Link key={n.id} href={n.linkUrl} onClick={() => { if (!n.isRead) markRead.mutate(n.id); setOpen(false); }}>{inner}</Link>
              ) : (
                <div key={n.id} onClick={() => { if (!n.isRead) markRead.mutate(n.id); }} className="cursor-pointer">{inner}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

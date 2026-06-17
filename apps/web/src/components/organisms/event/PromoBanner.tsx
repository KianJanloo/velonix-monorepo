"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useActiveEvents } from "@/hooks/useEvents";
import type { PromoEvent, PromoEventPlacement, PromoEventVariant } from "@velonix/types";

const VARIANT_STYLE: Record<PromoEventVariant, string> = {
  promo: "bg-gradient-to-r from-[#7c5cff] to-[#00b8d4] text-white",
  sale: "bg-gradient-to-r from-[#ff3b5c] to-[#f5c451] text-deep-void",
  info: "bg-rich-wood-mid text-parchment-light border-b border-warm-wood",
  warning: "bg-royal-gold text-deep-void",
};

const DISMISS_KEY = "velonix:dismissed-events";

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) ?? "[]"); } catch { return []; }
}

/**
 * Renders the highest-priority active promo event for a placement as a banner.
 * Dismissals are remembered per-event in localStorage.
 */
export function PromoBanner({ placement = "global" }: { placement?: PromoEventPlacement }) {
  const { data: events } = useActiveEvents(placement);
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => setDismissed(readDismissed()), []);

  const event: PromoEvent | undefined = events?.find((e) => !dismissed.includes(e.id));
  if (!event) return null;

  function dismiss(id: string) {
    const next = Array.from(new Set([...readDismissed(), id]));
    localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    setDismissed(next);
  }

  const isExternal = !!event.ctaUrl && /^https?:\/\//.test(event.ctaUrl);

  return (
    <div className={`relative ${VARIANT_STYLE[event.variant]}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-center gap-3 text-center">
        <p className="text-sm font-ui">
          <span className="font-bold">{event.title}</span>
          <span className="opacity-90"> — {event.message}</span>
        </p>
        {event.ctaLabel && event.ctaUrl && (
          isExternal ? (
            <a href={event.ctaUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-2xs font-ui font-bold underline underline-offset-2 hover:opacity-80">
              {event.ctaLabel} →
            </a>
          ) : (
            <Link href={event.ctaUrl}
              className="shrink-0 text-2xs font-ui font-bold underline underline-offset-2 hover:opacity-80">
              {event.ctaLabel} →
            </Link>
          )
        )}
      </div>
      {event.dismissible && (
        <button onClick={() => dismiss(event.id)} aria-label="Dismiss"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-black/10">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      )}
    </div>
  );
}

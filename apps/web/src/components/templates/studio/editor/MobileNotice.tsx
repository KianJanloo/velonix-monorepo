"use client";

import Link from "next/link";

import type { StudioEditor } from "./useStudioEditor";

export function MobileNotice({ ed }: { ed: StudioEditor }) {
  const {
    setMode,
    game,
  } = ed;

  return (
      <div className="min-h-screen bg-deep-void flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-warm-wood/40 border border-warm-wood flex items-center justify-center">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            className="text-royal-gold"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            <path
              d="M8 20h8M12 17v3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <h1 className="font-display text-xl font-bold text-parchment-light mb-2">
            Studio editing is desktop-only
          </h1>

          <p className="text-soft-gray text-sm font-ui max-w-xs">
            The design canvas needs a larger screen. You can still preview your
            game here, or open the Studio on a desktop to edit.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => setMode("preview_2d")}
            className="w-full py-3 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm"
          >
            Preview Game
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3 rounded-xl border border-warm-wood text-parchment-light font-ui font-semibold text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
  );
}

"use client";

import { Suspense, lazy } from "react";
import type { BoardPreviewProps } from "./BoardPreview";

// Code-split the heavy three.js scene out of the initial bundle. It only loads
// when a BoardPreview actually mounts (e.g. the demo-video studio).
const Inner = lazy(() => import("./BoardPreview").then((m) => ({ default: m.BoardPreview })));

function Skeleton({ height, className }: { height: number; className?: string | undefined }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#0a0a0a] ${className ?? ""}`} style={{ height }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
      </div>
    </div>
  );
}

/** Suspense-wrapped, lazily-loaded BoardPreview with a loading skeleton. */
export function LazyBoardPreview(props: BoardPreviewProps) {
  return (
    <Suspense fallback={<Skeleton height={props.height ?? 480} className={props.className} />}>
      <Inner {...props} />
    </Suspense>
  );
}

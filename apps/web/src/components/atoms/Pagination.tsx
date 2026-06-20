"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number;
}

const btnBase =
  "flex items-center justify-center rounded-lg font-ui text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

const btnOutline =
  "bg-transparent text-parchment-light border border-warm-wood-light hover:bg-warm-wood hover:border-soft-gray focus-visible:ring-emerald-glow";

const btnActive =
  "bg-emerald-ghost text-emerald-glow border border-emerald-glow/30 hover:bg-emerald-ghost hover:text-emerald-bright";

function range(start: number, end: number) {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
}

function generatePages(current: number, total: number, siblings: number) {
  const totalPageNumbers = siblings * 2 + 5;

  if (total <= totalPageNumbers) {
    return range(1, total);
  }

  const leftSiblingIndex = Math.max(current - siblings, 1);
  const rightSiblingIndex = Math.min(current + siblings, total);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = 3 + 2 * siblings;
    const leftRange = range(1, leftItemCount);
    return [...leftRange, "ellipsis-right", total] as const;
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblings;
    const rightRange = range(total - rightItemCount + 1, total);
    return [1, "ellipsis-left", ...rightRange] as const;
  }

  const middleRange = range(leftSiblingIndex, rightSiblingIndex);
  return [1, "ellipsis-left", ...middleRange, "ellipsis-right", total] as const;
}

export function Pagination({ page, totalPages, onPageChange, className, siblingCount = 1 }: PaginationProps) {
  const pages = useMemo(() => generatePages(page, totalPages, siblingCount), [page, totalPages, siblingCount]);

  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-1.5 mt-6", className)}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={cn(btnBase, btnOutline, "px-3 py-1.5")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span className="hidden sm:inline">Prev</span>
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (typeof p === "string") {
            return (
              <span key={`ellipsis-${idx}`} className="flex items-center justify-center w-9 h-9 text-soft-gray-dark font-ui text-sm">
                ...
              </span>
            );
          }
          const isActive = p === page;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(btnBase, isActive ? btnActive : btnOutline, "w-9 h-9")}
            >
              {p}
            </button>
          );
        })}
      </div>

      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={cn(btnBase, btnOutline, "px-3 py-1.5")}
      >
        <span className="hidden sm:inline">Next</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

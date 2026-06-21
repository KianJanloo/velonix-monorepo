"use client";

import { useMemo, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ── Page range helper ───────────────────────────────────────────────────────

type PageItem = number | "ellipsis-left" | "ellipsis-right";

function range(start: number, end: number): number[] {
  const length = end - start + 1;
  return Array.from({ length }, (_, i) => start + i);
}

function generatePages(
  current: number,
  total: number,
  siblings: number,
): PageItem[] {
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
    return [...range(1, leftItemCount), "ellipsis-right", total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = 3 + 2 * siblings;
    return [1, "ellipsis-left", ...range(total - rightItemCount + 1, total)];
  }

  return [
    1,
    "ellipsis-left",
    ...range(leftSiblingIndex, rightSiblingIndex),
    "ellipsis-right",
    total,
  ];
}

// ── Variants ─────────────────────────────────────────────────────────────────

const pageButtonVariants = cva(
  "inline-flex items-center justify-center rounded-lg font-ui text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
  {
    variants: {
      variant: {
        outline:
          "bg-transparent text-parchment-light border border-warm-wood-light hover:bg-warm-wood hover:border-soft-gray focus-visible:ring-royal-gold",
        active:
          "bg-royal-gold text-deep-void border border-royal-gold hover:bg-royal-gold-dark hover:shadow-royal-gold-dark focus-visible:ring-royal-gold",
      },
      size: {
        nav: "gap-1.5 px-3 py-1.5",
        page: "w-9 h-9",
      },
    },
    defaultVariants: { variant: "outline", size: "page" },
  },
);

// ── Component ────────────────────────────────────────────────────────────────

export interface PaginationProps extends VariantProps<
  typeof pageButtonVariants
> {
  /** Current active page (1-indexed). */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** How many page numbers to show on each side of the current page. */
  siblingCount?: number;
  className?: string;
  /** Hide the Prev/Next "Prev"/"Next" labels and show icon-only buttons at all breakpoints. */
  compact?: boolean;
}

export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (
    {
      page,
      totalPages,
      onPageChange,
      siblingCount = 1,
      className,
      compact = false,
    },
    ref,
  ) => {
    const pages = useMemo(
      () => generatePages(page, totalPages, siblingCount),
      [page, totalPages, siblingCount],
    );

    if (totalPages <= 1) return null;

    const canGoPrev = page > 1;
    const canGoNext = page < totalPages;

    return (
      <nav
        ref={ref}
        role="navigation"
        aria-label="Pagination"
        className={cn("flex items-center justify-center gap-1.5 my-4", className)}
      >
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => canGoPrev && onPageChange(page - 1)}
          aria-label="Go to previous page"
          className={cn(
            pageButtonVariants({ variant: "outline", size: "nav" }),
          )}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {/* {!compact && <span className="hidden sm:inline">Prev</span>} */}
        </button>

        <div className="flex items-center gap-1">
          {pages.map((p) => {
            if (typeof p !== "number") {
              return (
                <span
                  key={p}
                  aria-hidden="true"
                  className="flex items-center justify-center w-9 h-9 text-soft-gray-dark font-ui text-sm select-none"
                >
                  &#8230;
                </span>
              );
            }
            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-label={`Go to page ${p}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  pageButtonVariants({
                    variant: isActive ? "active" : "outline",
                    size: "page",
                  }),
                )}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => canGoNext && onPageChange(page + 1)}
          aria-label="Go to next page"
          className={cn(
            pageButtonVariants({ variant: "outline", size: "nav" }),
          )}
        >
          {/* {!compact && <span className="hidden sm:inline">Next</span>} */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </nav>
    );
  },
);
Pagination.displayName = "Pagination";

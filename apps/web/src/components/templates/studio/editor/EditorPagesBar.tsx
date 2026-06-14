"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  PAGE_MIN,
  PAGE_MAX,
  PAGE_SIZE_PRESETS,
} from "../core";
import type { StudioEditor } from "./useStudioEditor";

// ── Constants ─────────────────────────────────────────────────────────────────

/** Below this count, show the full strip. At or above, collapse to search popover. */
const COLLAPSE_THRESHOLD = 12;

// ── Derived link data ─────────────────────────────────────────────────────────

function useLinkData(pages: StudioEditor["pages"]) {
  return useMemo(() => {
    const linkedPageIds = new Set<string>();
    const outgoing: Record<string, number> = {};

    for (const p of pages) {
      outgoing[p.id] = 0;
      for (const c of p.components) {
        if (c.linkToPageId) {
          linkedPageIds.add(c.linkToPageId);
          outgoing[p.id]!++;
        }
      }
    }
    return { linkedPageIds, outgoing };
  }, [pages]);
}

// ── Single page chip ──────────────────────────────────────────────────────────

function PageChip({
  p,
  active,
  renamingPageId,
  canDelete,
  effectiveReadOnly,
  linkedIn,
  linkedOut,
  onSwitch,
  onRename,
  onDelete,
  onStartRename,
  onEndRename,
}: {
  p: { id: string; name: string };
  active: boolean;
  renamingPageId: string | null;
  canDelete: boolean;
  effectiveReadOnly: boolean;
  linkedIn: boolean;
  linkedOut: number;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onStartRename: () => void;
  onEndRename: () => void;
}) {
  return (
    <div
      onClick={onSwitch}
      className={`group flex items-center gap-1 pl-2 pr-1 h-6 rounded-md shrink-0 cursor-pointer transition-colors select-none ${
        active
          ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/30"
          : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"
      }`}
    >
      {renamingPageId === p.id ? (
        <input
          autoFocus
          defaultValue={p.name}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => { onRename(e.target.value); onEndRename(); }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape")
              (e.target as HTMLInputElement).blur();
          }}
          className="w-24 bg-deep-void/60 border border-emerald-glow/40 rounded px-1 text-2xs text-parchment-light outline-none"
        />
      ) : (
        <span
          className="text-2xs font-ui whitespace-nowrap flex items-center gap-1"
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (!effectiveReadOnly) onStartRename();
          }}
        >
          {p.name}

          {/* Incoming link badge */}
          {linkedIn && (
            <span
              title="A component links to this page"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 12, height: 12, borderRadius: "50%",
                background: "rgba(61,220,151,0.25)", border: "1px solid rgba(61,220,151,0.5)",
                flexShrink: 0,
              }}
            >
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                <path d="M1.5 3.5h4M4 1.5l1.5 2-1.5 2" stroke="#3ddc97"
                  strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )}

          {/* Outgoing link badge */}
          {linkedOut > 0 && (
            <span
              title={`${linkedOut} linked component${linkedOut === 1 ? "" : "s"}`}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 14, height: 12, borderRadius: 6,
                background: "rgba(245,196,81,0.2)", border: "1px solid rgba(245,196,81,0.4)",
                color: "#f5c451", fontSize: 8, fontFamily: "monospace",
                fontWeight: 700, padding: "0 3px", flexShrink: 0,
              }}
            >
              {linkedOut}⇢
            </span>
          )}
        </span>
      )}

      {/* Delete button */}
      {canDelete && !effectiveReadOnly && (
        <ConfirmDialog
          title="Delete page?"
          description={`"${p.name}" and all its components will be permanently removed.`}
          confirmLabel="Delete page"
          variant="danger"
          onConfirm={onDelete}
        >
          {(open) => (
            <button
              title="Delete page"
              onClick={(e) => { e.stopPropagation(); open(); }}
              className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-crimson-flame p-0.5 transition-opacity"
            >
              <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor"
                  strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}

// ── Search popover (used when pages ≥ COLLAPSE_THRESHOLD) ─────────────────────

function PageSearchPopover({
  pages,
  activePageId,
  renamingPageId,
  effectiveReadOnly,
  linkedPageIds,
  outgoing,
  onSwitch,
  onRename,
  onDelete,
  onStartRename,
  onEndRename,
  onClose,
}: {
  pages: { id: string; name: string }[];
  activePageId: string;
  renamingPageId: string | null;
  effectiveReadOnly: boolean;
  linkedPageIds: Set<string>;
  outgoing: Record<string, number>;
  onSwitch: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onStartRename: (id: string) => void;
  onEndRename: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Auto-focus search
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return pages;
    return pages.filter((p) => p.name.toLowerCase().includes(q));
  }, [pages, query]);

  // Group into rows of 10 for visual scanning
  const activePage = pages.find((p) => p.id === activePageId);
  const activeIndex = pages.indexOf(activePage!) + 1;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-1 w-72 bg-rich-wood-dark border border-warm-wood rounded-xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-warm-wood/60">
        <span className="text-2xs font-ui font-semibold text-parchment-mid">
          Pages — {pages.length} total
        </span>
        <span className="text-[10px] text-soft-gray-dark font-mono">
          {activeIndex}/{pages.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-2 pt-2 pb-1">
        <div className="flex items-center gap-1.5 bg-rich-wood-mid border border-warm-wood rounded-lg px-2 py-1.5 focus-within:border-emerald-glow transition-colors">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-soft-gray-dark shrink-0">
            <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6.5 6.5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            className="flex-1 bg-transparent text-2xs text-parchment-light placeholder-soft-gray-dark outline-none font-ui"
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-soft-gray-dark hover:text-parchment-light">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Page list — virtualised window of 200px height */}
      <div className="overflow-y-auto max-h-52 px-1 pb-2">
        {filtered.length === 0 ? (
          <p className="text-center text-soft-gray-dark text-2xs font-ui py-4">No pages match</p>
        ) : (
          filtered.map((p) => {
            const active = p.id === activePageId;
            const globalIdx = pages.indexOf(p);
            return (
              <div
                key={p.id}
                onClick={() => { onSwitch(p.id); onClose(); }}
                className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                  active ? "bg-emerald-ghost" : "hover:bg-warm-wood/40"
                }`}
              >
                {/* Index number */}
                <span className="text-[10px] font-mono text-soft-gray-dark w-6 shrink-0 text-right">
                  {globalIdx + 1}
                </span>

                {/* Name (inline rename) */}
                {renamingPageId === p.id ? (
                  <input
                    autoFocus
                    defaultValue={p.name}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => { onRename(p.id, e.target.value); onEndRename(); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape")
                        (e.target as HTMLInputElement).blur();
                    }}
                    className="flex-1 bg-deep-void/60 border border-emerald-glow/40 rounded px-1 text-2xs text-parchment-light outline-none"
                  />
                ) : (
                  <span
                    className={`flex-1 text-2xs font-ui truncate ${active ? "text-emerald-glow font-semibold" : "text-parchment-mid"}`}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!effectiveReadOnly) onStartRename(p.id);
                    }}
                  >
                    {p.name}
                  </span>
                )}

                {/* Link badges */}
                <div className="flex items-center gap-1 shrink-0">
                  {linkedPageIds.has(p.id) && (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3ddc97", display: "inline-block" }} title="Has incoming link" />
                  )}
                  {(outgoing[p.id] ?? 0) > 0 && (
                    <span style={{ fontSize: 8, color: "#f5c451", fontFamily: "monospace", fontWeight: 700 }} title="Has outgoing links">
                      {outgoing[p.id]}⇢
                    </span>
                  )}
                </div>

                {/* Delete */}
                {pages.length > 1 && !effectiveReadOnly && (
                  <ConfirmDialog
                    title="Delete page?"
                    description={`"${p.name}" and all its components will be permanently removed.`}
                    confirmLabel="Delete page"
                    variant="danger"
                    onConfirm={() => onDelete(p.id)}
                  >
                    {(open) => (
                      <button
                        onClick={(e) => { e.stopPropagation(); open(); }}
                        className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-crimson-flame p-0.5 transition-opacity shrink-0"
                        title="Delete page"
                      >
                        <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                          <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                        </svg>
                      </button>
                    )}
                  </ConfirmDialog>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick-jump hint */}
      <div className="border-t border-warm-wood/40 px-3 py-1.5">
        <p className="text-[10px] text-soft-gray-dark font-ui">
          Double-click a name to rename · click to jump
        </p>
      </div>
    </div>
  );
}

// ── Mini page counter button (shown when collapsed) ───────────────────────────

function PageCounter({
  pages,
  activePageId,
  onClick,
}: {
  pages: { id: string; name: string }[];
  activePageId: string;
  onClick: () => void;
}) {
  const activeIdx = pages.findIndex((p) => p.id === activePageId);
  const activeName = pages[activeIdx]?.name ?? "—";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 h-6 px-2.5 rounded-md bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/30 text-2xs font-ui font-semibold shrink-0 hover:bg-emerald-glow hover:text-deep-void transition-colors"
      title="Browse all pages"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
        <path d="M3 4h4M3 6h2.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>
      <span className="max-w-[80px] truncate">{activeName}</span>
      <span className="text-[10px] text-emerald-glow/70 font-mono font-normal">
        {activeIdx + 1}/{pages.length}
      </span>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className="opacity-60">
        <path d="M1.5 3L4 5.5 6.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── Prev / Next arrows (shown when collapsed) ─────────────────────────────────

function PageArrows({
  pages,
  activePageId,
  onSwitch,
}: {
  pages: { id: string; name: string }[];
  activePageId: string;
  onSwitch: (id: string) => void;
}) {
  const idx = pages.findIndex((p) => p.id === activePageId);

  return (
    <>
      <button
        onClick={() => idx > 0 && onSwitch(pages[idx - 1]!.id)}
        disabled={idx === 0}
        title="Previous page"
        className="h-6 w-6 rounded-md flex items-center justify-center text-soft-gray hover:text-parchment-light hover:bg-warm-wood disabled:opacity-25 disabled:hover:bg-transparent transition-colors shrink-0"
      >
        <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
          <path d="M6 1.5L2.5 5 6 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => idx < pages.length - 1 && onSwitch(pages[idx + 1]!.id)}
        disabled={idx === pages.length - 1}
        title="Next page"
        className="h-6 w-6 rounded-md flex items-center justify-center text-soft-gray hover:text-parchment-light hover:bg-warm-wood disabled:opacity-25 disabled:hover:bg-transparent transition-colors shrink-0"
      >
        <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
          <path d="M2 1.5L5.5 5 2 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}

// ── Main bar ──────────────────────────────────────────────────────────────────

export function EditorPagesBar({ ed }: { ed: StudioEditor }) {
  const {
    pages,
    activePageId,
    canvasW,
    canvasH,
    renamingPageId,
    setRenamingPageId,
    switchPage,
    maxPages,
    atPageLimit,
    addPage,
    deletePage,
    renamePage,
    resizePage,
    setPageSize,
    effectiveReadOnly,
  } = ed;

  const [popoverOpen, setPopoverOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  const { linkedPageIds, outgoing } = useLinkData(pages);

  const collapsed = pages.length >= COLLAPSE_THRESHOLD;

  // Auto-scroll active page chip into view
  useEffect(() => {
    if (collapsed || !stripRef.current) return;
    const active = stripRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activePageId, collapsed]);

  const closePopover = useCallback(() => setPopoverOpen(false), []);

  return (
    <div className="h-9 bg-rich-wood-dark border-b border-warm-wood flex items-center px-2 gap-1 shrink-0 z-30 relative">

      {/* ── Collapsed mode: counter + arrows + popover ── */}
      {collapsed ? (
        <>
          <span className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-wider mr-1 shrink-0">
            Pages
          </span>

          <div className="relative">
            <PageCounter
              pages={pages}
              activePageId={activePageId}
              onClick={() => setPopoverOpen((v) => !v)}
            />
            {popoverOpen && (
              <PageSearchPopover
                pages={pages}
                activePageId={activePageId}
                renamingPageId={renamingPageId}
                effectiveReadOnly={effectiveReadOnly}
                linkedPageIds={linkedPageIds}
                outgoing={outgoing}
                onSwitch={switchPage}
                onRename={renamePage}
                onDelete={deletePage}
                onStartRename={(id) => setRenamingPageId(id)}
                onEndRename={() => setRenamingPageId(null)}
                onClose={closePopover}
              />
            )}
          </div>

          <PageArrows pages={pages} activePageId={activePageId} onSwitch={switchPage} />
        </>
      ) : (
        /* ── Full strip mode ── */
        <>
          <span className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-wider mr-1 shrink-0">
            Pages
          </span>

          <div
            ref={stripRef}
            className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-none"
          >
            {pages.map((p) => (
              <PageChip
                key={p.id}
                p={p}
                active={p.id === activePageId}
                renamingPageId={renamingPageId}
                canDelete={pages.length > 1}
                effectiveReadOnly={effectiveReadOnly}
                linkedIn={linkedPageIds.has(p.id)}
                linkedOut={outgoing[p.id] ?? 0}
                onSwitch={() => switchPage(p.id)}
                onRename={(name) => renamePage(p.id, name)}
                onDelete={() => deletePage(p.id)}
                onStartRename={() => setRenamingPageId(p.id)}
                onEndRename={() => setRenamingPageId(null)}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Add page button (always visible) ── */}
      {!effectiveReadOnly && (
        <button
          onClick={addPage}
          disabled={atPageLimit}
          title={atPageLimit ? `Plan limit: ${maxPages} pages` : "Add page"}
          className="h-6 px-2 rounded-md text-2xs font-ui text-soft-gray hover:text-parchment-light hover:bg-warm-wood shrink-0 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          + Page{" "}
          {maxPages !== null && (
            <span className="text-soft-gray-dark">({pages.length}/{maxPages})</span>
          )}
        </button>
      )}

      {/* ── Canvas size controls ── */}
      {!effectiveReadOnly && (
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <select
            value=""
            title="Size preset"
            onChange={(e) => {
              const pre = PAGE_SIZE_PRESETS[Number(e.target.value)];
              if (pre) setPageSize(activePageId, pre.w, pre.h);
            }}
            className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 text-2xs text-parchment-light outline-none"
          >
            <option value="" disabled>Size…</option>
            {PAGE_SIZE_PRESETS.map((pre, i) => (
              <option key={pre.label} value={i}>
                {pre.label} ({pre.w}×{pre.h})
              </option>
            ))}
          </select>

          <input
            type="number"
            value={canvasW}
            min={PAGE_MIN}
            max={PAGE_MAX}
            onChange={(e) => resizePage(activePageId, "width", Number(e.target.value))}
            className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 w-14 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
          />
          <span className="text-soft-gray-dark text-2xs">×</span>
          <input
            type="number"
            value={canvasH}
            min={PAGE_MIN}
            max={PAGE_MAX}
            onChange={(e) => resizePage(activePageId, "height", Number(e.target.value))}
            className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 w-14 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
          />
          <span className="text-soft-gray-dark text-[10px]">mm</span>
        </div>
      )}
    </div>
  );
}

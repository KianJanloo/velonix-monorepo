"use client";

import {
  ConfirmDialog,
} from "@/components/ui/ConfirmDialog";

import {
  PAGE_MIN,
  PAGE_MAX,
  PAGE_SIZE_PRESETS,
} from "../core";

import type { StudioEditor } from "./useStudioEditor";

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

  // Build a set of page IDs that have at least one incoming link from any page.
  const linkedPageIds = new Set<string>(
    pages.flatMap((p) =>
      p.components
        .map((c) => c.linkToPageId)
        .filter((id): id is string => !!id),
    ),
  );

  // Count outgoing links per page (how many components on this page link elsewhere).
  const outgoingLinkCount: Record<string, number> = {};
  for (const p of pages) {
    outgoingLinkCount[p.id] = p.components.filter((c) => !!c.linkToPageId).length;
  }

  return (
    <>
      {/* Pages bar — switch / add / rename / resize canvases */}

      <div className="h-9 bg-rich-wood-dark border-b border-warm-wood flex items-center px-2 gap-1 shrink-0 overflow-x-auto z-30">
        <span className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-wider mr-1 shrink-0">
          Pages
        </span>

        {pages.map((p) => {
          const active = p.id === activePageId;

          return (
            <div
              key={p.id}
              onClick={() => switchPage(p.id)}
              className={`group flex items-center gap-1 pl-2 pr-1 h-6 rounded-md shrink-0 cursor-pointer transition-colors ${active ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/30" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"}`}
            >
              {renamingPageId === p.id ? (
                <input
                  autoFocus
                  defaultValue={p.name}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    renamePage(p.id, e.target.value);

                    setRenamingPageId(null);
                  }}
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

                    if (!effectiveReadOnly) setRenamingPageId(p.id);
                  }}
                >
                  {p.name}
                  {/* Incoming-link indicator: another component links to this page */}
                  {linkedPageIds.has(p.id) && (
                    <span
                      title="Another component links here"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: "rgba(61,220,151,0.25)",
                        border: "1px solid rgba(61,220,151,0.5)",
                        flexShrink: 0,
                      }}
                    >
                      <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                        <path
                          d="M1.5 3.5h4M4 1.5l1.5 2-1.5 2"
                          stroke="#3ddc97"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                  {/* Outgoing-link indicator: this page has components that link elsewhere */}
                  {(outgoingLinkCount[p.id] ?? 0) > 0 && (
                    <span
                      title={`${outgoingLinkCount[p.id]} linked component${outgoingLinkCount[p.id] === 1 ? "" : "s"}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 14,
                        height: 12,
                        borderRadius: 6,
                        background: "rgba(245,196,81,0.2)",
                        border: "1px solid rgba(245,196,81,0.4)",
                        color: "#f5c451",
                        fontSize: 8,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        padding: "0 3px",
                        flexShrink: 0,
                      }}
                    >
                      {outgoingLinkCount[p.id]}⇢
                    </span>
                  )}
                </span>
              )}

              {pages.length > 1 && !effectiveReadOnly && (
                <ConfirmDialog
                  title="Delete page?"
                  description={`"${p.name}" and all its components will be permanently removed. This cannot be undone.`}
                  confirmLabel="Delete page"
                  variant="danger"
                  onConfirm={() => deletePage(p.id)}
                >
                  {(open) => (
                    <button
                      title="Delete page"
                      onClick={(e) => {
                        e.stopPropagation();

                        open();
                      }}
                      className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-crimson-flame p-0.5 transition-opacity"
                    >
                      <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1 1l6 6M7 1L1 7"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </ConfirmDialog>
              )}
            </div>
          );
        })}

        {!effectiveReadOnly && (
          <button
            onClick={addPage}
            disabled={atPageLimit}
            title={atPageLimit ? `Plan limit: ${maxPages} pages` : "Add page"}
            className="h-6 px-2 rounded-md text-2xs font-ui text-soft-gray hover:text-parchment-light hover:bg-warm-wood shrink-0 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            + Page{" "}
            {maxPages !== null && (
              <span className="text-soft-gray-dark">
                ({pages.length}/{maxPages})
              </span>
            )}
          </button>
        )}

        {/* Active page size */}

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
              <option value="" disabled>
                Size…
              </option>

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
              onChange={(e) =>
                resizePage(activePageId, "width", Number(e.target.value))
              }
              className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 w-14 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
            />

            <span className="text-soft-gray-dark text-2xs">×</span>

            <input
              type="number"
              value={canvasH}
              min={PAGE_MIN}
              max={PAGE_MAX}
              onChange={(e) =>
                resizePage(activePageId, "height", Number(e.target.value))
              }
              className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 w-14 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
            />

            <span className="text-soft-gray-dark text-[10px]">mm</span>
          </div>
        )}
      </div>

    </>
  );
}

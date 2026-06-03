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
                  className="text-2xs font-ui whitespace-nowrap"
                  onDoubleClick={(e) => {
                    e.stopPropagation();

                    if (!effectiveReadOnly) setRenamingPageId(p.id);
                  }}
                >
                  {p.name}
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

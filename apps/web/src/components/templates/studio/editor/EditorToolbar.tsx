"use client";

import Link from "next/link";

import {
  PresenceAvatar,
} from "../dialogs";

import { ComponentDesignerModal } from "../designer/ComponentDesignerModal";
import { emptyBoxDesign } from "../designer/designer-model";

import type { StudioEditor } from "./useStudioEditor";

export function EditorToolbar({ ed }: { ed: StudioEditor }) {
  const {
    gameId,
    isNew,
    mode,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnap,
    isDirty,
    isSaving,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomPercent,
    plan,
    setGuideOpen,
    pastRef,
    futureRef,
    leftOpen,
    setLeftOpen,
    game,
    publish,
    myRole,
    collabEnabled,
    setShareOpen,
    setTutorialOpen,
    setMarketOpen,
    moreOpen,
    setMoreOpen,
    boxDesign,
    setBoxDesign,
    boxDesignerOpen,
    setBoxDesignerOpen,
    canGroup,
    canUngroup,
    groupSelection,
    ungroupSelection,
    undo,
    redo,
    presence,
    collabConnected,
    effectiveReadOnly,
    handlePublish,
    handleSave,
    handleMode,
  } = ed;

  return (
    <>
      {/* Toolbar */}

      <header className="min-h-11 bg-rich-wood-dark border-b border-warm-wood flex items-center px-2 gap-1 shrink-0 z-40 overflow-x-auto flex-wrap">
        <Link
          href="/dashboard"
          title="Dashboard"
          className="font-display text-royal-gold text-sm font-bold mr-1 hover:text-royal-gold-bright shrink-0"
        >
          ✦
        </Link>

        <span className="text-2xs text-soft-gray font-ui truncate max-w-[120px] hidden sm:block mr-1 shrink-0">
          {game?.title ?? (isNew ? "New Game" : gameId.slice(0, 8))}
        </span>

        {/* ── Select / Pan ── */}
        <button
          data-tutorial="tool-select"
          title="Select & move (V)"
          onClick={() => { ed.setActiveTool("select"); ed.draw?.setDrawTool(null); }}
          className={`v-tool-btn shrink-0 ${ed.activeTool === "select" && !ed.draw?.activeTool ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 1.5l8.5 5-3.3.7 2 3.3-1.4.8-2-3.3-2.3 2.4V1.5z" fill="currentColor" />
          </svg>
        </button>
        <button
          data-tutorial="tool-hand"
          title="Pan / hand tool (H)"
          onClick={() => { ed.setActiveTool("hand"); ed.draw?.setDrawTool(null); }}
          className={`v-tool-btn shrink-0 ${ed.activeTool === "hand" ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M3.5 6.5V2.8a1 1 0 012 0V6M5.5 6V2a1 1 0 012 0v4M7.5 6.2V2.6a1 1 0 012 0V7M9.5 7V5.3a1 1 0 012 0V8c0 2.5-1.7 4-3.8 4H6.2C4.4 12 3 10.7 2.3 9.2L1.2 6.8c-.3-.6 0-1.2.6-1.4.5-.2 1 0 1.3.5l1 1.6"
              stroke="currentColor" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="w-px h-5 bg-warm-wood shrink-0" />

        {/* ── Drawing tools ── */}
        {ed.draw && (
          <>
            {ed.draw.activeTool && (
              <button
                title="Stop drawing — back to select (V)"
                onClick={() => { ed.draw!.setDrawTool(null); ed.setActiveTool("select"); }}
                className="v-tool-btn shrink-0 text-crimson-flame"
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {(
              [
                {
                  id: "pencil" as const,
                  label: "Pencil (draw freehand)",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M9.5 1.5l2 2-7 7-2.5.5.5-2.5 7-7z"
                        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                      <path d="M8 3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  id: "highlighter" as const,
                  label: "Highlighter",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="2" y="4" width="9" height="5" rx="2"
                        stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.2" />
                      <path d="M6.5 9v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  ),
                },
                {
                  id: "arrow" as const,
                  label: "Arrow",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 11L10 3M7 3h3v3"
                        stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
                {
                  id: "rect" as const,
                  label: "Rectangle",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="2" y="2" width="9" height="9" rx="1.5"
                        stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  ),
                },
                {
                  id: "eraser" as const,
                  label: "Eraser",
                  icon: (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M2 10l2.5-6.5 4.5 4.5L3.5 12H11"
                        stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ),
                },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                data-tutorial={t.id === "pencil" ? "tool-pencil" : undefined}
                title={t.label}
                onClick={() => {
                  if (ed.draw!.activeTool === t.id) {
                    ed.draw!.setDrawTool(null);
                  } else {
                    ed.draw!.setDrawTool(t.id);
                  }
                }}
                className={`v-tool-btn shrink-0 ${ed.draw.activeTool === t.id ? "active" : ""}`}
              >
                {t.icon}
              </button>
            ))}

            {/* Draw colour swatch */}
            {ed.draw.activeTool && ed.draw.activeTool !== "eraser" && (
              <label
                title="Drawing colour"
                className="w-5 h-5 rounded-md border border-warm-wood cursor-pointer shrink-0 overflow-hidden"
                style={{ background: ed.draw.color }}
              >
                <input
                  type="color"
                  value={ed.draw.color}
                  onChange={(e) => ed.draw!.setDrawColor(e.target.value)}
                  className="opacity-0 w-0 h-0"
                />
              </label>
            )}

            {/* Undo last stroke */}
            <button
              title="Undo last drawing stroke"
              onClick={() => ed.draw!.undoLastStroke(ed.activePageId)}
              className="v-tool-btn shrink-0"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M2 6.5A3.5 3.5 0 018 3h1.5" stroke="currentColor"
                  strokeWidth="1.2" strokeLinecap="round" />
                <path d="M2 3.5L2 6.5 5 6.5" stroke="currentColor"
                  strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Clear all drawing */}
            <button
              title="Clear all drawing on this page"
              onClick={() => ed.draw!.clearStrokes(ed.activePageId)}
              className="v-tool-btn shrink-0 text-crimson-flame/60 hover:text-crimson-flame"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1.5 1.5l8 8M9.5 1.5l-8 8"
                  stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}

        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        <button
          title="Undo (⌘Z)"
          disabled={pastRef.current.length === 0}
          className="v-tool-btn disabled:opacity-30 shrink-0"
          onClick={undo}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M3 8A4 4 0 019 4h2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            <path
              d="M3 4.5l-.5 3.5L6 9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          title="Redo (⌘⇧Z)"
          disabled={futureRef.current.length === 0}
          className="v-tool-btn disabled:opacity-30 shrink-0"
          onClick={redo}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M10 8A4 4 0 004 4H2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            <path
              d="M10 4.5l.5 3.5L7 9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        <button
          title="Grid"
          onClick={toggleGrid}
          className={`v-tool-btn shrink-0 ${showGrid ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M1 4.5h11M1 8.5h11M4.5 1v11M8.5 1v11"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>

        <button
          title="Snap"
          onClick={toggleSnap}
          className={`v-tool-btn shrink-0 ${snapToGrid ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle
              cx="6.5"
              cy="6.5"
              r="2"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <path
              d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          title="Layers"
          onClick={() => setLeftOpen((v) => !v)}
          className={`v-tool-btn shrink-0 lg:hidden ${leftOpen ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect
              x="1"
              y="1"
              width="4"
              height="11"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <path
              d="M7 1h5M7 5h5M7 9h5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        <button
          title="Group (⌘G) — select 2+ first"
          disabled={!canGroup || effectiveReadOnly}
          onClick={groupSelection}
          className="v-tool-btn shrink-0 disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <rect
              x="6.5"
              y="6.5"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <path
              d="M6.5 4h2.5a1 1 0 011 1V6.5"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>
        </button>

        <button
          title="Ungroup (⌘⇧G)"
          disabled={!canUngroup || effectiveReadOnly}
          onClick={ungroupSelection}
          className="v-tool-btn shrink-0 disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="4.5"
              height="4.5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <rect
              x="7"
              y="7"
              width="4.5"
              height="4.5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="1.6 1.4"
            />
          </svg>
        </button>

        {/* Mode */}

        <div className="ml-auto flex items-center gap-0.5 bg-warm-wood rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => handleMode("design")}
            className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "design" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            Design
          </button>

          <button
            onClick={() => handleMode("preview_2d")}
            className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold ${(mode as string) === "preview_2d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            Preview
          </button>

          <button
            onClick={() => handleMode("playtest")}
            title="Playtest — drag pieces, track turns, roll dice"
            className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold ${(mode as string) === "playtest" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            Playtest
          </button>

          <button
            onClick={() => handleMode("preview_3d")}
            title={
              plan.has3DPreview ? "3D Preview" : "3D preview — upgrade required"
            }
            className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold flex items-center gap-1 ${(mode as string) === "preview_3d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            3D{" "}
            {!plan.has3DPreview && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <rect
                  x="2.5"
                  y="5.5"
                  width="7"
                  height="5"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />

                <path
                  d="M4 5.5V4a2 2 0 014 0v1.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center gap-0.5 mx-1.5 shrink-0">
          <button onClick={zoomOut} className="v-tool-btn font-mono text-xs">
            −
          </button>

          <button
            onClick={resetZoom}
            className="font-mono text-2xs text-soft-gray bg-warm-wood px-1.5 py-1 rounded min-w-[40px] text-center hover:text-parchment-light"
          >
            {zoomPercent}%
          </button>

          <button onClick={zoomIn} className="v-tool-btn font-mono text-xs">
            +
          </button>
        </div>

        {/* Live presence */}

        {collabEnabled && presence.length > 0 && (
          <div
            className="flex items-center -space-x-1.5 mr-1 shrink-0"
            title={`${presence.length} in this studio${collabConnected ? " · live" : ""}`}
          >
            {presence.slice(0, 4).map((m) => (
              <PresenceAvatar key={m.socketId} member={m} />
            ))}

            {presence.length > 4 && (
              <span className="w-6 h-6 rounded-full bg-warm-wood border border-rich-wood-dark flex items-center justify-center text-[9px] font-ui text-parchment-light z-10">
                +{presence.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {effectiveReadOnly ? (
            <span className="text-2xs font-ui font-semibold text-royal-gold bg-[rgba(245,196,81,0.12)] px-2 py-1 rounded">
              View only
            </span>
          ) : (
            <>
              <span
                className={`text-2xs font-ui hidden md:inline ${isSaving ? "text-royal-gold" : isDirty ? "text-soft-gray-dark" : "text-emerald-glow"}`}
              >
                {isSaving ? "Saving…" : isDirty ? "Unsaved" : "Saved"}
              </span>

              <button
                data-tutorial="save-btn"
                onClick={() => void handleSave()}
                className="v-tool-btn text-2xs font-ui px-2"
                title="Save (⌘S)"
              >
                Save
              </button>
            </>
          )}

          {/* More — secondary actions tucked away to keep the bar uncluttered */}

          <div className="relative shrink-0">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`v-tool-btn ${moreOpen ? "active" : ""}`}
              title="More — marketplace, guide, share, help"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="3" cy="7.5" r="1.2" fill="currentColor" />

                <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />

                <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
              </svg>
            </button>

            {moreOpen && (
              <>
                <div
                  className="fixed inset-0 z-[55]"
                  onPointerDown={() => setMoreOpen(false)}
                />

                {/* Fixed (not absolute) so it escapes the toolbar's overflow-x clip */}

                <div className="fixed right-2 top-12 z-[56] w-48 bg-rich-wood-dark border border-warm-wood rounded-lg shadow-2xl py-1">
                  <button
                    onClick={() => {
                      setMoreOpen(false);

                      setMarketOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 4.5h10l-.8 6a1 1 0 01-1 .9H3.8a1 1 0 01-1-.9L2 4.5z"
                        stroke="currentColor"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M4.7 4.5a2.3 2.3 0 014.6 0"
                        stroke="currentColor"
                        strokeWidth="1.1"
                      />
                    </svg>
                    Component marketplace
                  </button>

                  {!isNew && (
                    <button
                      onClick={() => {
                        setMoreOpen(false);
                        setBoxDesignerOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M1.5 4.5L7 1.5l5.5 3v6L7 13.5 1.5 10.5v-6z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                        <path d="M1.5 4.5L7 7.5l5.5-3M7 7.5v6" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
                      </svg>
                      Design game box
                    </button>
                  )}

                  {!isNew && (
                    <button
                      onClick={() => {
                        setMoreOpen(false);

                        setGuideOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 2.5h6a1.5 1.5 0 011.5 1.5v7.5H4a1.5 1.5 0 01-1.5-1.5v-7.5z"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />

                        <path
                          d="M4.5 5h4M4.5 7h4M4.5 9h2.5"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                      </svg>
                      Rule guide &amp; scenarios
                    </button>
                  )}

                  {!isNew &&
                    myRole === "owner" &&
                    plan.hasTeamCollaboration && (
                      <button
                        onClick={() => {
                          setMoreOpen(false);

                          setShareOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <circle
                            cx="7"
                            cy="4"
                            r="2.2"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />

                          <path
                            d="M2.5 12a4.5 4.5 0 019 0"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />

                          <path
                            d="M11.5 3.5v3M13 5h-3"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Invite collaborators
                      </button>
                    )}

                  <div className="h-px bg-warm-wood my-1" />

                  <button
                    onClick={() => {
                      setMoreOpen(false);

                      setTutorialOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <circle
                        cx="7"
                        cy="7"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />

                      <path
                        d="M5.4 5.3a1.7 1.7 0 013.2.6c0 1.1-1.6 1.4-1.6 2.4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />

                      <circle cx="7" cy="10.3" r="0.7" fill="currentColor" />
                    </svg>
                    How the studio works
                  </button>
                </div>
              </>
            )}
          </div>

          {myRole === "owner" && (
            <button
              data-tutorial="publish-btn"
              onClick={handlePublish}
              disabled={publish.isPending || game?.status === "reviewing"}
              className="px-3 py-1 rounded-md bg-emerald-glow text-deep-void text-xs font-ui font-bold hover:bg-emerald-bright disabled:opacity-50"
            >
              {game?.status === "reviewing" ? "In Review" : "Publish"}
            </button>
          )}
        </div>
      </header>

      {boxDesignerOpen && (
        <ComponentDesignerModal
          mode="box"
          design={boxDesign ?? emptyBoxDesign()}
          onSaveBoxDesign={setBoxDesign}
          onClose={() => setBoxDesignerOpen(false)}
        />
      )}
    </>
  );
}

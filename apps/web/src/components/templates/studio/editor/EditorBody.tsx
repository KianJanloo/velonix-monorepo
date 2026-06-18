"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  toast,
} from "sonner";

import {
  GroupBar,
  PropertiesPanel,
  StylePanel,
  LayersPanel,
  PartsPanel,
  AssetsPanel,
  RulesPanel,
  GeneratorPanel,
  AIBalancerPanel,
  VoiceNotesPanel,
} from "../panels";

import {
  MM_TO_PX,
  GRID_MM,
  CompView,
  groupBoundingBox,
} from "../core";

import { AlignmentGuides } from "./AlignmentGuides";
import { DrawingLayer } from "./DrawingLayer";
import { ComponentDesignerModal } from "../designer/ComponentDesignerModal";
import { emptyComponentDesign } from "../designer/designer-model";

import type { StudioEditor } from "./useStudioEditor";

export function EditorBody({ ed }: { ed: StudioEditor }) {
  const {
    leftPanelTab,
    setLeftPanelTab,
    rightPanelTab,
    setRightPanelTab,
    showGrid,
    storeZoom,
    plan,
    activeTool,
    activePage,
    components,
    canvasW,
    canvasH,
    marquee,
    rules,
    setRules,
    guide,
    assets,
    setAssets,
    voiceNotes,
    setVoiceNotes,
    componentDesigns,
    setComponentDesigns,
    designerTarget,
    setDesignerTarget,
    renamingId,
    setRenamingId,
    selectedId,
    setSelectedId,
    panX,
    panY,
    leftOpen,
    setLeftOpen,
    rightOpen,
    setRightOpen,
    leftPanelWidth,
    setLeftPanelWidth,
    rightPanelWidth,
    setRightPanelWidth,
    selectedComp,
    setMultiIds,
    selectionIds,
    canGroup,
    canUngroup,
    updateComp,
    addComp,
    deleteSelected,
    deleteComp,
    duplicateSelected,
    groupSelection,
    ungroupById,
    ungroupSelection,
    moveZ,
    onCompPointerDown,
    onResizeStart,
    onRotateStart,
    onCanvasPointerDown,
    onPointerMove,
    onPointerUp,
    effectiveReadOnly,
    onWheel,
    openCompMenu,
    openCanvasMenu,
    toolCursor,
    reversed,
    pages,
    switchPage,
    spacingGuidesRef,
    altActiveRef,
    rotateGroup,
  } = ed;

  // Force a re-render every pointer-move frame so spacing guides stay in sync
  const [, forceGuideRender] = useState(0);

  // ── Performance: large-game support (hundreds of components) ────────────
  // O(1) selection lookups instead of selectionIds.includes(c.id) per item.
  const selectionSet = useMemo(() => new Set(selectionIds), [selectionIds]);

  // Stable callback refs so CompView's React.memo can actually skip
  // re-rendering unaffected siblings while one component is being dragged.
  // Re-creating these inline inside .map() (as before) handed every
  // CompView a "new" prop every render and defeated memoization entirely.
  const handleTextChange = useCallback(
    (id: string, text: string) => updateComp(id, { text }, false),
    [updateComp],
  );
  const handleNavigateToPage = useCallback(
    (pageId: string) => {
      const target = pages.find((p) => p.id === pageId);
      switchPage(pageId);
      toast.success(`Jumped to "${target?.name ?? "page"}"`);
    },
    [pages, switchPage],
  );

  // Viewport culling: with hundreds of components on a page, mounting an
  // absolutely-positioned, interactive <CompView> div for every single one
  // (most of them off-screen) is the dominant cost, both for initial paint
  // and for React's reconciliation pass on every store update. We only
  // render components whose bounding box intersects the visible viewport
  // (plus a margin so panning doesn't pop content in/out abruptly).
  // Selected components are always kept mounted so drag/resize/rotate
  // handles never disappear mid-gesture even if dragged off-screen.
  // Below a small component count this is a no-op (everything renders),
  // so normal-sized games are completely unaffected.
  const canvasRef = useRef<HTMLElement | null>(null);
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (e) setViewportSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const CULL_THRESHOLD = 150;

  // Drag-to-resize for the left/right side panels.
  const startPanelResize = useCallback(
    (side: "left" | "right") => (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = side === "left" ? leftPanelWidth : rightPanelWidth;
      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        if (side === "left") setLeftPanelWidth(startWidth + dx);
        else setRightPanelWidth(startWidth - dx);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [leftPanelWidth, rightPanelWidth, setLeftPanelWidth, setRightPanelWidth],
  );

  const visibleComponents = useMemo(() => {
    if (components.length <= CULL_THRESHOLD || viewportSize.w === 0) return components;
    const MARGIN_MM = 150;
    const z = storeZoom * MM_TO_PX;
    const minX = -panX / z - MARGIN_MM;
    const minY = -panY / z - MARGIN_MM;
    const maxX = minX + viewportSize.w / z + MARGIN_MM * 2;
    const maxY = minY + viewportSize.h / z + MARGIN_MM * 2;
    return components.filter((c) => {
      if (selectionSet.has(c.id)) return true;
      return c.x <= maxX && c.x + c.width >= minX && c.y <= maxY && c.y + c.height >= minY;
    });
  }, [components, viewportSize, panX, panY, storeZoom, selectionSet]);

  const wrappedPointerMove = useCallback(
    (e: React.PointerEvent) => {
      onPointerMove(e);
      // Only force re-render when Alt is held (guides are visible)
      if (e.altKey || altActiveRef.current) {
        forceGuideRender((n) => n + 1);
      }
    },
    [onPointerMove, altActiveRef],
  );

  return (
    <>
      {/* Body */}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel */}

        <aside
          style={{ width: leftOpen ? leftPanelWidth : 0 }}
          className="bg-rich-wood-dark border-r border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:z-30 max-lg:h-full relative"
        >
          <div className="flex border-b border-warm-wood shrink-0 overflow-x-auto" data-tutorial="left-tabs">
            {(["layers", "components", "assets", "generator"] as const).map((tab) => (
              <button
                key={tab}
                data-tutorial={tab === "components" ? "parts-tab" : tab === "layers" ? "layers-tab" : undefined}
                onClick={() => setLeftPanelTab(tab)}
                className={`flex-1 py-2 px-1 text-2xs font-ui font-bold tracking-[0.04em] uppercase border-b-2 -mb-px whitespace-nowrap ${leftPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}
              >
                {tab === "layers"
                  ? "Layers"
                  : tab === "components"
                    ? "Parts"
                    : tab === "assets"
                      ? "Assets"
                      : "Gen"}
              </button>
            ))}
          </div>

          {leftOpen && (
            <div
              onPointerDown={startPanelResize("left")}
              className="absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-emerald-glow/40 active:bg-emerald-glow/60 z-10"
            />
          )}

          <div className="flex-1 overflow-y-auto min-h-0">
            {leftPanelTab === "layers" && (
              <LayersPanel
                components={reversed}
                total={components.length}
                selectedId={selectedId}
                renamingId={renamingId}
                onSelect={(id) => {
                  setSelectedId(id);

                  setMultiIds([]);
                }}
                onStartRename={setRenamingId}
                onChange={updateComp}
                onDelete={deleteComp}
                onMove={moveZ}
                onUngroup={ungroupById}
              />
            )}

            {leftPanelTab === "components" && (
              <PartsPanel onAdd={(t) => addComp(t)} />
            )}

            {leftPanelTab === "assets" && (
              <AssetsPanel
                assets={assets}
                appliedUrl={selectedComp?.image}
                hasSelection={!!selectedComp}
                onUploaded={(url) => {
                  setAssets((a) => (a.includes(url) ? a : [url, ...a]));
                }}
                onApply={(url) => {
                  if (!selectedComp) {
                    toast.error("Select a component first.");

                    return;
                  }

                  updateComp(selectedComp.id, { image: url });

                  toast.success("Image applied to component.");
                }}
                onRemoveFromComp={() => {
                  if (selectedComp) updateComp(selectedComp.id, { image: "" });
                }}
                onDeleteAsset={(url) =>
                  setAssets((a) => a.filter((x) => x !== url))
                }
              />
            )}

            {leftPanelTab === "generator" && (
              <GeneratorPanel
                components={components}
                selectionIds={selectionIds}
                onApply={(updates) => {
                  updates.forEach(({ id, text, name }) => {
                    updateComp(id, { text, name }, false);
                  });
                  toast.success(
                    `Applied generated text to ${updates.length} component${updates.length !== 1 ? "s" : ""}.`
                  );
                }}
              />
            )}
          </div>
        </aside>

        {/* Canvas */}

        <main
          ref={canvasRef}
          data-canvas
          data-tutorial="canvas"
          className="flex-1 relative overflow-hidden"
          style={{
            cursor: activeTool === "hand" ? "grab" : toolCursor,

            backgroundColor: "#0c0c0c",
          }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={wrappedPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          onContextMenu={openCanvasMenu}
        >
          {showGrid && (
            <div
              data-canvasbg
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(58,42,31,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(58,42,31,0.4) 1px,transparent 1px)",

                backgroundSize: `${GRID_MM * MM_TO_PX * storeZoom}px ${GRID_MM * MM_TO_PX * storeZoom}px`,

                backgroundPosition: `${panX}px ${panY}px`,
              }}
            />
          )}

          {/* Rubber-band marquee */}

          {marquee && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: marquee.x,

                top: marquee.y,

                width: marquee.w,

                height: marquee.h,

                border: "1px solid #7c5cff",

                background: "rgba(124,92,255,0.12)",

                borderRadius: 2,
              }}
            />
          )}

          <div
            style={{
              position: "absolute",

              transformOrigin: "0 0",

              transform: `translate(${panX}px,${panY}px) scale(${storeZoom})`,
            }}
          >
            <div
              data-canvasbg
              style={{
                position: "relative",

                width: canvasW * MM_TO_PX,

                height: canvasH * MM_TO_PX,

                backgroundColor: "#111214",

                border: "1px solid rgba(58,42,31,0.6)",

                boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
              }}
            >
              <div
                style={{
                  position: "absolute",

                  top: -20,

                  left: 0,

                  color: "rgba(168,162,158,0.4)",

                  fontSize: 10,

                  fontFamily: "monospace",
                }}
              >
                {activePage.name} · {canvasW} × {canvasH} mm
              </div>

              {/* Group bounding boxes — one frame per unique groupId */}
              {(() => {
                const groupMap = new Map<string, typeof components>();
                for (const c of components) {
                  if (!c.groupId || !c.visible) continue;
                  if (!groupMap.has(c.groupId)) groupMap.set(c.groupId, []);
                  groupMap.get(c.groupId)!.push(c);
                }

                const isGroupSelected = (gid: string) =>
                  components.some((c) => c.groupId === gid && selectionSet.has(c.id));

                return Array.from(groupMap.entries()).map(([gid, members]) => {
                  const bb = groupBoundingBox(members);
                  if (!bb) return null;

                  const selected = isGroupSelected(gid);
                  const PAD = 4; // px padding around box
                  const left = bb.x * MM_TO_PX - PAD;
                  const top = bb.y * MM_TO_PX - PAD;
                  const width = bb.w * MM_TO_PX + PAD * 2;
                  const height = bb.h * MM_TO_PX + PAD * 2;

                  // Detect nesting depth for colour
                  const depth = members[0]?.parentGroupId ? 1 : 0;
                  const borderColor = depth > 0
                    ? "rgba(245,196,81,0.55)"   // gold for nested
                    : "rgba(124,92,255,0.45)";  // violet for root

                  return (
                    <div
                      key={gid}
                      className="absolute pointer-events-none"
                      style={{
                        left,
                        top,
                        width,
                        height,
                        border: `1.5px dashed ${borderColor}`,
                        borderRadius: 4,
                        boxSizing: "border-box",
                      }}
                    >
                      {/* Group label */}
                      <div
                        style={{
                          position: "absolute",
                          top: -18,
                          left: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          pointerEvents: selected ? "auto" : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: "var(--font-ui)",
                            color: borderColor,
                            background: "rgba(10,10,10,0.8)",
                            padding: "1px 5px",
                            borderRadius: 3,
                            whiteSpace: "nowrap",
                            userSelect: "none",
                          }}
                        >
                          {depth > 0 ? "⤷ Nested group" : "Group"} · {members.length}
                        </span>

                        {/* Rotate group −15° / +15° buttons */}
                        {selected && !effectiveReadOnly && (
                          <>
                            <button
                              style={{
                                fontSize: 9,
                                fontFamily: "var(--font-ui)",
                                color: borderColor,
                                background: "rgba(10,10,10,0.85)",
                                border: `1px solid ${borderColor}`,
                                borderRadius: 3,
                                padding: "1px 5px",
                                cursor: "pointer",
                                pointerEvents: "auto",
                              }}
                              title="Rotate group −15°"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); rotateGroup(gid, -15); }}
                            >
                              ↺ −15°
                            </button>
                            <button
                              style={{
                                fontSize: 9,
                                fontFamily: "var(--font-ui)",
                                color: borderColor,
                                background: "rgba(10,10,10,0.85)",
                                border: `1px solid ${borderColor}`,
                                borderRadius: 3,
                                padding: "1px 5px",
                                cursor: "pointer",
                                pointerEvents: "auto",
                              }}
                              title="Rotate group +15°"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); rotateGroup(gid, 15); }}
                            >
                              ↻ +15°
                            </button>
                          </>
                        )}
                      </div>

                      {/* Corner resize dots for visual feedback */}
                      {selected && (
                        <>
                          {[
                            { top: -3, left: -3 },
                            { top: -3, right: -3 },
                            { bottom: -3, left: -3 },
                            { bottom: -3, right: -3 },
                          ].map((style, i) => (
                            <div
                              key={i}
                              style={{
                                position: "absolute",
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: borderColor,
                                ...style,
                              }}
                            />
                          ))}
                        </>
                      )}
                    </div>
                  );
                });
              })()}

              {visibleComponents.map((c) => (
                <CompView
                  key={c.id}
                  comp={c}
                  selected={selectionSet.has(c.id)}
                  primary={selectedId === c.id}
                  editable={!effectiveReadOnly}
                  onPointerDown={onCompPointerDown}
                  onResizeStart={onResizeStart}
                  onRotateStart={onRotateStart}
                  onContextMenu={openCompMenu}
                  onTextChange={handleTextChange}
                  onNavigateToPage={c.linkToPageId ? handleNavigateToPage : undefined}
                />
              ))}

              {/* Alignment + spacing guides */}
              <AlignmentGuides
                guides={[]}
                spacingGuides={spacingGuidesRef.current}
                canvasW={canvasW}
                canvasH={canvasH}
                zoom={storeZoom}
                altActive={altActiveRef.current}
                draggedComp={
                  altActiveRef.current && selectedComp
                    ? { x: selectedComp.x, y: selectedComp.y, width: selectedComp.width, height: selectedComp.height }
                    : null
                }
              />

              {/* Collaborative drawing layer */}
              {ed.draw && (
                <DrawingLayer
                  pageId={activePage.id}
                  strokes={ed.draw.strokes}
                  activeStroke={ed.draw.activeStroke}
                  activeTool={ed.draw.activeTool}
                  color={ed.draw.color}
                  width={ed.draw.width}
                  opacity={ed.draw.opacity}
                  canvasW={canvasW * MM_TO_PX}
                  canvasH={canvasH * MM_TO_PX}
                  panX={panX}
                  panY={panY}
                  zoom={storeZoom}
                  onPointerDown={ed.draw.onDrawPointerDown}
                  onPointerMove={ed.draw.onDrawPointerMove}
                  onPointerUp={ed.draw.onDrawPointerUp}
                />
              )}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 text-2xs text-soft-gray-dark font-mono bg-rich-wood-dark/80 rounded px-2 py-1 pointer-events-none">
            {selectedComp
              ? `${selectedComp.name} · ${Math.round(selectedComp.x)},${Math.round(selectedComp.y)} · ${selectedComp.width}×${selectedComp.height}mm`
              : `${canvasW}×${canvasH}mm`}
          </div>

          <div className="absolute bottom-3 right-3 text-2xs text-soft-gray-dark font-ui bg-rich-wood-dark/70 rounded px-2 py-1 pointer-events-none hidden lg:block">
            drag to box-select · shift+click to add · ⌘G group · ctrl+click link to jump ·{" "}
            <span className="text-royal-gold/70">alt+drag = spacing guides</span> · right-click for menu
          </div>

          {/* Panel collapse toggles (desktop) */}

          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-l-0 border-warm-wood rounded-r-lg items-center justify-center text-soft-gray hover:text-parchment-light z-10 hidden lg:flex"
          >
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
              <path
                d={leftOpen ? "M5.5 1L2 5l3.5 4" : "M1.5 1L5 5l-3.5 4"}
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            onClick={() => setRightOpen((v) => !v)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-r-0 border-warm-wood rounded-l-lg items-center justify-center text-soft-gray hover:text-parchment-light z-10 hidden lg:flex"
          >
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
              <path
                d={rightOpen ? "M1.5 1L5 5l-3.5 4" : "M5.5 1L2 5l3.5 4"}
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </main>

        {/* Right panel */}

        <aside
          style={{ width: rightOpen ? rightPanelWidth : 0 }}
          className="bg-rich-wood-dark border-l border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:right-0 max-lg:z-30 max-lg:h-full relative"
        >
          {rightOpen && (
            <div
              data-tutorial="resize-handle"
              onPointerDown={startPanelResize("right")}
              className="absolute top-0 left-0 h-full w-1.5 cursor-col-resize hover:bg-emerald-glow/40 active:bg-emerald-glow/60 z-10"
            />
          )}

          <div className="flex border-b border-warm-wood shrink-0 overflow-x-auto" data-tutorial="right-tabs">
            {(["properties", "styling", "notes", "rules", "ai"] as const).map((tab) => (
              <button
                key={tab}
                data-tutorial={tab === "rules" ? "tab-rules" : undefined}
                onClick={() => setRightPanelTab(tab)}
                className={`flex-1 py-2 px-1 text-2xs font-ui font-bold tracking-[0.04em] uppercase border-b-2 -mb-px whitespace-nowrap ${rightPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}
              >
                {tab === "properties"
                  ? "Props"
                  : tab === "styling"
                    ? "Style"
                    : tab === "notes"
                      ? "Notes"
                      : tab === "rules"
                        ? "Rules"
                        : "AI"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {!selectedComp && rightPanelTab !== "rules" && rightPanelTab !== "ai" && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-soft-gray-dark"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />

                  <path
                    d="M9 12h6M12 9v6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>

                <p className="text-2xs text-soft-gray-dark font-ui">
                  Select a component
                </p>
              </div>
            )}

            {rightPanelTab === "properties" && selectedComp && (
              <div className="space-y-3">
                {selectedComp.type !== "text" && selectedComp.type !== "line" && !effectiveReadOnly && (
                  <button
                    onClick={() => setDesignerTarget({ compId: selectedComp.id, mode: selectedComp.type === "die" || selectedComp.type === "cube" ? "dice" : "face" })}
                    className="w-full px-3 py-2 text-2xs font-ui font-bold rounded-lg bg-royal-gold/15 text-royal-gold border border-royal-gold/30 hover:bg-royal-gold/25"
                  >
                    🎨 {selectedComp.type === "die" || selectedComp.type === "cube" ? "Design dice faces" : "Design artwork"}
                  </button>
                )}

                {(canGroup || canUngroup) && !effectiveReadOnly && (
                  <GroupBar
                    count={selectionIds.length}
                    canGroup={canGroup}
                    canUngroup={canUngroup}
                    onGroup={groupSelection}
                    onUngroup={ungroupSelection}
                    hasNestedGroups={selectionIds.some(
                      (id) => !!components.find((c) => c.id === id)?.groupId
                    )}
                  />
                )}

                <PropertiesPanel
                  comp={selectedComp}
                  multiCount={selectionIds.length}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  pages={pages}
                  onNavigate={(pageId) => switchPage(pageId)}
                  onChange={(p) => updateComp(selectedComp.id, p, false)}
                  onDup={duplicateSelected}
                  onDel={deleteSelected}
                  onZ={(d) => moveZ(selectedComp.id, d)}
                />
              </div>
            )}

            {rightPanelTab === "styling" && selectedComp && (
              <StylePanel
                comp={selectedComp}
                onChange={(p) => updateComp(selectedComp.id, p, false)}
              />
            )}

            {rightPanelTab === "notes" && selectedComp && (
              <VoiceNotesPanel
                notes={voiceNotes[selectedComp.id] ?? []}
                onChange={(notes) =>
                  setVoiceNotes((prev) => ({ ...prev, [selectedComp.id]: notes }))
                }
              />
            )}

            {rightPanelTab === "rules" && (
              <RulesPanel
                hasEngine={plan.hasTeamCollaboration}
                rules={rules}
                onAdd={(rule) =>
                  setRules((rs) => [
                    ...rs,

                    {
                      ...rule,

                      id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    },
                  ])
                }
                onUpdate={(id, patch) =>
                  setRules((rs) =>
                    rs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
                  )
                }
                onDelete={(id) =>
                  setRules((rs) => rs.filter((r) => r.id !== id))
                }
                pages={pages}
              />
            )}

            {rightPanelTab === "ai" && (
              <AIBalancerPanel
                components={components}
                rules={rules}
                guide={guide}
                pages={pages}
                isPro={plan.hasAnalytics}
              />
            )}
          </div>
        </aside>
      </div>

      {designerTarget && (() => {
        const target = components.find((c) => c.id === designerTarget.compId);
        if (!target) return null;
        return (
          <ComponentDesignerModal
            mode={designerTarget.mode}
            comp={target}
            design={componentDesigns[designerTarget.compId] ?? emptyComponentDesign()}
            onSaveComponentDesign={(design, patch) => {
              setComponentDesigns((prev) => ({ ...prev, [designerTarget.compId]: design }));
              if (Object.keys(patch).length > 0) updateComp(designerTarget.compId, patch);
            }}
            onClose={() => setDesignerTarget(null)}
          />
        );
      })()}
    </>
  );
}

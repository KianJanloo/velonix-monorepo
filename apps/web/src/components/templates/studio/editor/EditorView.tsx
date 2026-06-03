"use client";



import type { StudioEditor } from "./useStudioEditor";
import { EditorToolbar } from "./EditorToolbar";
import { EditorPagesBar } from "./EditorPagesBar";
import { EditorBody } from "./EditorBody";

export function EditorView({ ed }: { ed: StudioEditor }) {
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

      {/* Body */}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel */}

        <aside
          className={`${leftOpen ? "w-52" : "w-0"} bg-rich-wood-dark border-r border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:z-30 max-lg:h-full`}
        >
          <div className="flex border-b border-warm-wood shrink-0">
            {(["layers", "components", "assets"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftPanelTab(tab)}
                className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase border-b-2 -mb-px ${leftPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}
              >
                {tab === "layers"
                  ? "Layers"
                  : tab === "components"
                    ? "Parts"
                    : "Assets"}
              </button>
            ))}
          </div>

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
          </div>
        </aside>

        {/* Canvas */}

        <main
          data-canvas
          className="flex-1 relative overflow-hidden"
          style={{
            cursor: activeTool === "hand" ? "grab" : toolCursor,

            backgroundColor: "#0c0c0c",
          }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
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

              {components.map((c) => (
                <CompView
                  key={c.id}
                  comp={c}
                  selected={selectionIds.includes(c.id)}
                  primary={selectedId === c.id}
                  editable={!effectiveReadOnly}
                  onPointerDown={onCompPointerDown}
                  onResizeStart={onResizeStart}
                  onRotateStart={onRotateStart}
                  onContextMenu={openCompMenu}
                  onTextChange={(id, text) => updateComp(id, { text }, false)}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 text-2xs text-soft-gray-dark font-mono bg-rich-wood-dark/80 rounded px-2 py-1 pointer-events-none">
            {selectedComp
              ? `${selectedComp.name} · ${Math.round(selectedComp.x)},${Math.round(selectedComp.y)} · ${selectedComp.width}×${selectedComp.height}mm`
              : `${canvasW}×${canvasH}mm`}
          </div>

          <div className="absolute bottom-3 right-3 text-2xs text-soft-gray-dark font-ui bg-rich-wood-dark/70 rounded px-2 py-1 pointer-events-none hidden lg:block">
            drag to box-select · shift-click to add · ⌘G group / ⌘⇧G ungroup ·
            right-click for menu
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
          className={`${rightOpen ? "w-60" : "w-0"} bg-rich-wood-dark border-l border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:right-0 max-lg:z-30 max-lg:h-full`}
        >
          <div className="flex border-b border-warm-wood shrink-0">
            {(["properties", "styling", "rules"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanelTab(tab)}
                className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase border-b-2 -mb-px ${rightPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}
              >
                {tab === "properties"
                  ? "Props"
                  : tab === "styling"
                    ? "Style"
                    : "Rules"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {!selectedComp && rightPanelTab !== "rules" && (
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
                {(canGroup || canUngroup) && !effectiveReadOnly && (
                  <GroupBar
                    count={selectionIds.length}
                    canGroup={canGroup}
                    canUngroup={canUngroup}
                    onGroup={groupSelection}
                    onUngroup={ungroupSelection}
                  />
                )}

                <PropertiesPanel
                  comp={selectedComp}
                  multiCount={selectionIds.length}
                  canvasW={canvasW}
                  canvasH={canvasH}
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
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}


      <EditorToolbar ed={ed} />



      <EditorPagesBar ed={ed} />

      <EditorBody ed={ed} />
    </div>
  );
}

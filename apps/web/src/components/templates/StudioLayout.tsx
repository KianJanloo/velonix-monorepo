"use client";

import dynamic from "next/dynamic";
import { useStudioStore, selectCanUndo, selectCanRedo, selectZoomPercent } from "@/stores/studioStore";

// Load 3D preview lazily — heavy R3F bundle
const BoardPreview = dynamic(
  () => import("@/components/three/BoardPreview").then((m) => m.BoardPreview),
  { ssr: false }
);

interface StudioLayoutProps {
  gameId: string;
}

const TOOLS = [
  {
    id: "select" as const, label: "Select",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 2l4.5 10 1.8-4L13 6 2 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "hand" as const, label: "Pan",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M5 5.5V3a1 1 0 012 0v2.5m0 0V2.5a1 1 0 012 0V5.5m0 0V3a1 1 0 012 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4V6a1 1 0 012 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "text" as const, label: "Text",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 3.5h10M7 3.5v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "shape_rect" as const, label: "Rectangle",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "shape_ellipse" as const, label: "Ellipse",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <ellipse cx="7" cy="7" rx="5" ry="5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "image" as const, label: "Image",
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="4.5" cy="4.5" r="1" fill="currentColor" opacity="0.7" />
        <path d="M1.5 9.5l3-3 2.5 2.5 2-2 2.5 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function StudioLayout({ gameId }: StudioLayoutProps) {
  const {
    activeTool, setTool,
    mode, setMode,
    leftPanelTab, setLeftPanelTab,
    rightPanelTab, setRightPanelTab,
    showGrid, toggleGrid,
    snapToGrid, toggleSnap,
    isDirty, isSaving,
    zoomIn, zoomOut, resetZoom,
  } = useStudioStore();

  const canUndo = useStudioStore(selectCanUndo);
  const canRedo = useStudioStore(selectCanRedo);
  const zoomPercent = useStudioStore(selectZoomPercent);

  const is3DMode = mode === "preview_3d";

  return (
    <div className="flex flex-col h-screen bg-deep-void overflow-hidden">
      {/* ── Top toolbar ───────────────────────────────────────────────── */}
      <header className="h-studio-toolbar bg-rich-wood-dark border-b border-warm-wood flex items-center px-3 gap-2 shrink-0 z-100">
        {/* Logo mark */}
        <div className="font-display text-xs font-bold tracking-[0.14em] text-royal-gold mr-3">
          VELONIX
        </div>
        <div className="w-px h-6 bg-warm-wood mx-1" />

        {/* Tool buttons */}
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => setTool(tool.id)}
            className={`v-tool-btn ${activeTool === tool.id ? "active" : ""}`}
            aria-pressed={activeTool === tool.id}
          >
            {tool.icon}
          </button>
        ))}

        <div className="w-px h-6 bg-warm-wood mx-1" />

        {/* Undo / Redo */}
        <button
          title="Undo"
          disabled={!canUndo}
          className="v-tool-btn disabled:opacity-30"
          onClick={() => useStudioStore.getState().undo()}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M3 8A4 4 0 019 4h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M3 4.5l-.5 3.5L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          title="Redo"
          disabled={!canRedo}
          className="v-tool-btn disabled:opacity-30"
          onClick={() => useStudioStore.getState().redo()}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M10 8A4 4 0 004 4H2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M10 4.5l.5 3.5L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="w-px h-6 bg-warm-wood mx-1" />

        {/* Grid / Snap toggles */}
        <button
          title={showGrid ? "Hide grid" : "Show grid"}
          onClick={toggleGrid}
          className={`v-tool-btn ${showGrid ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 4.5h11M1 8.5h11M4.5 1v11M8.5 1v11" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
        <button
          title={snapToGrid ? "Snap on" : "Snap off"}
          onClick={toggleSnap}
          className={`v-tool-btn ${snapToGrid ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2" />
            <path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Mode selector */}
        <div className="ml-auto flex items-center gap-1 bg-warm-wood rounded-lg p-1">
          {(["design", "preview_2d", "preview_3d"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-md text-2xs font-ui font-semibold transition-all duration-150 ${
                mode === m
                  ? "bg-emerald-glow text-deep-void"
                  : "text-soft-gray hover:text-parchment-light"
              }`}
            >
              {m === "design" ? "Design" : m === "preview_2d" ? "Preview" : "3D"}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1 ml-2">
          <button onClick={zoomOut} className="v-tool-btn text-xs font-mono">−</button>
          <button
            onClick={resetZoom}
            className="font-mono text-2xs text-soft-gray bg-warm-wood px-2 py-1 rounded min-w-[46px] text-center hover:text-parchment-light transition-colors"
          >
            {zoomPercent}%
          </button>
          <button onClick={zoomIn} className="v-tool-btn text-xs font-mono">+</button>
        </div>

        {/* Save status */}
        <div className="ml-2 flex items-center gap-2">
          <span className={`text-2xs font-ui ${isSaving ? "text-royal-gold" : isDirty ? "text-soft-gray-dark" : "text-emerald-glow"}`}>
            {isSaving ? "Saving..." : isDirty ? "Unsaved" : "Saved"}
          </span>
          <button className="toolbar-save px-3 py-1.5 rounded-md bg-emerald-glow text-deep-void text-xs font-ui font-bold hover:bg-emerald-dark transition-colors">
            Publish
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <aside className="w-studio-left bg-rich-wood-dark border-r border-warm-wood flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-warm-wood shrink-0">
            {(["layers", "components", "assets"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftPanelTab(tab)}
                className={`flex-1 py-2.5 text-2xs font-ui font-bold tracking-[0.08em] uppercase transition-colors border-b-2 -mb-px ${
                  leftPanelTab === tab
                    ? "text-emerald-glow border-emerald-glow"
                    : "text-soft-gray border-transparent hover:text-parchment-light"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Panel content */}
          <div className="flex-1 overflow-y-auto p-2">
            <p className="text-2xs text-soft-gray-dark font-ui px-2 py-3 uppercase tracking-widest">
              {leftPanelTab === "layers" && "Layer Tree"}
              {leftPanelTab === "components" && "Game Components"}
              {leftPanelTab === "assets" && "Asset Library"}
            </p>
          </div>
          {/* Add component button */}
          <div className="p-3 border-t border-warm-wood shrink-0">
            <button className="w-full py-2 rounded-lg bg-emerald-ghost border border-emerald-glow/20 text-emerald-glow text-xs font-ui font-semibold hover:bg-emerald-glow hover:text-deep-void transition-all duration-150">
              + Add Component
            </button>
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative overflow-hidden">
          {is3DMode ? (
            <BoardPreview
              gameId={gameId}
              className="w-full h-full rounded-none"
              disableControls={false}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(58,42,31,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(58,42,31,0.4) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                backgroundColor: "#0c0c0c",
              }}
            >
              {/* Canvas placeholder */}
              <div className="w-80 h-64 bg-[#1a2535] rounded-lg border border-royal-gold/15 shadow-[0_16px_48px_rgba(0,0,0,0.8)] relative">
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(0,229,255,0.05) 1px,transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }}
                />
                <p className="absolute inset-0 flex items-center justify-center text-soft-gray-dark text-xs font-ui">
                  Board Canvas
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right panel */}
        <aside className="w-studio-right bg-rich-wood-dark border-l border-warm-wood flex flex-col shrink-0 overflow-hidden">
          <div className="flex border-b border-warm-wood shrink-0">
            {(["properties", "styling", "rules"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanelTab(tab)}
                className={`flex-1 py-2.5 text-2xs font-ui font-bold tracking-[0.08em] uppercase transition-colors border-b-2 -mb-px ${
                  rightPanelTab === tab
                    ? "text-emerald-glow border-emerald-glow"
                    : "text-soft-gray border-transparent hover:text-parchment-light"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            <p className="text-2xs text-soft-gray-dark font-ui px-4 py-3 uppercase tracking-widest">
              Select a layer to inspect
            </p>
          </div>
          <div className="p-3 border-t border-warm-wood shrink-0">
            <button className="w-full py-2 rounded-lg bg-warm-wood text-soft-gray text-xs font-ui hover:bg-warm-wood-light hover:text-parchment-light transition-all duration-150">
              Import Assets
            </button>
          </div>
        </aside>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────── */}
      <footer className="h-studio-statusbar bg-rich-wood-dark border-t border-warm-wood flex items-center px-4 gap-4 shrink-0">
        <span className="text-2xs text-soft-gray-dark font-mono">Game ID: {gameId}</span>
        <span className="text-warm-wood">|</span>
        <span className="text-2xs text-soft-gray-dark font-mono">v1.0.0</span>
        <span className="text-warm-wood">|</span>
        <span className="text-2xs text-emerald-glow font-mono font-semibold">
          {mode === "design" ? "Design Mode" : mode === "preview_2d" ? "Preview" : "3D Preview"}
        </span>
      </footer>
    </div>
  );
}

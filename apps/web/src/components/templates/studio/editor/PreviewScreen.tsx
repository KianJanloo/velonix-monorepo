"use client";

import {
  PreviewStage,
} from "../panels";

import type { StudioEditor } from "./useStudioEditor";

export function PreviewScreen({ ed }: { ed: StudioEditor }) {
  const {
    mode,
    setMode,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomPercent,
    storeZoom,
    components,
    canvasW,
    canvasH,
    game,
    handleMode,
  } = ed;

  return (
      <div className="fixed inset-0 z-50 bg-deep-void flex flex-col">
        {/* minimal preview bar — responsive down to small phones */}

        <div className="h-12 bg-rich-wood-dark border-b border-warm-wood flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0">
          <span className="font-display text-sm font-bold text-royal-gold truncate min-w-0 flex-1">
            {game?.title ?? "Preview"}
          </span>

          <span className="text-2xs text-soft-gray font-ui hidden md:inline shrink-0">
            {mode === "preview_3d" ? "3D Preview" : "2D Preview"}
          </span>

          <div className="flex items-center gap-1 bg-warm-wood rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => handleMode("preview_2d")}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "preview_2d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
            >
              2D
            </button>

            <button
              onClick={() => handleMode("preview_3d")}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "preview_3d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
            >
              3D
            </button>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={zoomOut} className="v-tool-btn font-mono text-xs">
              −
            </button>

            <button
              onClick={resetZoom}
              className="font-mono text-2xs text-soft-gray bg-warm-wood px-1.5 py-1 rounded min-w-[40px] hidden sm:inline-block"
            >
              {zoomPercent}%
            </button>

            <button onClick={zoomIn} className="v-tool-btn font-mono text-xs">
              +
            </button>
          </div>

          <button
            onClick={() => setMode("design")}
            title="Exit preview"
            className="px-2.5 sm:px-3 py-1.5 rounded-md bg-warm-wood text-parchment-light text-xs font-ui font-semibold hover:bg-warm-wood-light transition-colors shrink-0"
          >
            <span className="hidden sm:inline">✕ Exit Preview</span>

            <span className="sm:hidden">✕</span>
          </button>
        </div>

        {/* preview canvas with pan */}

        <PreviewStage
          mode={mode}
          components={components}
          zoom={storeZoom}
          width={canvasW}
          height={canvasH}
        />
      </div>
  );
}

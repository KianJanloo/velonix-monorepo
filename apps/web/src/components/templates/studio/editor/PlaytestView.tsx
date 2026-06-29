"use client";

import { useRef, useCallback, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";

import {
  MM_TO_PX,
  safeColor,
  isCircleType,
  isChromeless,
  isSilhouetteType,
  ShapeInner,
  SilhouetteShape,
} from "../core";
import type { CanvasComp } from "../core";
import type { StudioEditor } from "./useStudioEditor";
import { PlaytestHud } from "./PlaytestHud";
import { usePlaytestEngine } from "./usePlaytestEngine";

// ── Piece renderer ────────────────────────────────────────────────────────────

function PlayPiece({
  c,
  selected,
  flipped,
  onDown,
  onLinkClick,
}: {
  c: CanvasComp;
  selected: boolean;
  flipped: boolean;
  onDown: (e: ReactPointerEvent, c: CanvasComp) => void;
  onLinkClick?: (pageId: string) => void;
}) {
  const px = (mm: number) => mm * MM_TO_PX;
  const isCircle = isCircleType(c.type);
  const isSil = isSilhouetteType(c.type);
  const chromeless = isChromeless(c.type);

  return (
    <div
      onPointerDown={(e) => !c.locked && onDown(e, c)}
      style={{
        position: "absolute",
        left: px(c.x),
        top: px(c.y),
        width: px(c.width),
        height: px(c.height),
        transform: `rotate(${c.rotation}deg)`,
        opacity: flipped ? 0.45 : c.opacity / 100,
        cursor: c.locked ? "not-allowed" : c.linkToPageId ? "pointer" : "grab",
        outline: selected ? "2px solid #00D68F" : "none",
        outlineOffset: 2,
        transition: "outline 0.1s",
        userSelect: "none",
      }}
    >
      {/* Back face when flipped */}
      {flipped ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(45deg,#1a2535,#1a2535 4px,#1c2840 4px,#1c2840 8px)",
            border: `${c.strokeWidth}px solid ${safeColor(c.stroke, "#f5c451")}`,
            borderRadius: isCircle ? "50%" : c.cornerRadius,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 10, color: "rgba(245,196,81,0.4)", userSelect: "none" }}>▣</span>
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: (chromeless || isSil) ? "transparent" : safeColor(c.fill, "#1a2535"),
            backgroundImage: c.image ? `url("${c.image}")` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: (chromeless || isSil) ? "none" : `${c.strokeWidth}px solid ${safeColor(c.stroke, "transparent")}`,
            borderRadius: isCircle ? "50%" : c.cornerRadius,
            boxShadow: (chromeless || isSil) ? "none" : "0 2px 8px rgba(0,0,0,0.45)",
            overflow: "hidden",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: c.textColor ?? "#e8d5b8",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: px(c.fontSize ?? 18) / 1.6,
          }}
        >
          {isSil ? (
            <SilhouetteShape comp={c} />
          ) : c.type === "text" ? (
            c.text
          ) : !c.image ? (
            <ShapeInner comp={c} />
          ) : null}
        </div>
      )}

      {/* Page-link badge */}
      {c.linkToPageId && onLinkClick && !flipped && (
        <div
          onClick={(e) => { e.stopPropagation(); onLinkClick(c.linkToPageId!); }}
          style={{
            position: "absolute",
            top: -6, right: -6,
            width: 14, height: 14,
            borderRadius: "50%",
            background: "#3ddc97",
            border: "1.5px solid #0a0a0a",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
          title="Click to go to linked page"
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4h5M5 2l2 2-2 2"
              stroke="#0a0a0a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function PlaytestView({ ed }: { ed: StudioEditor }) {
  const { pages, rules, guide, game, handleMode } = ed;

  const engine = usePlaytestEngine(pages, rules, guide);
  const { state } = engine;

  const [panZoom, setPanZoom] = useState({ panX: 40, panY: 40, zoom: 0.8 });

  const drag = useRef<
    | { kind: "piece"; id: string; sx: number; sy: number; ox: number; oy: number }
    | { kind: "pan"; sx: number; sy: number; px: number; py: number }
    | null
  >(null);

  const onPieceDown = useCallback((e: ReactPointerEvent, c: CanvasComp) => {
    e.stopPropagation();
    engine.selectPiece(c.id);
    engine.bringToFront(c.id);
    drag.current = { kind: "piece", id: c.id, sx: e.clientX, sy: e.clientY, ox: c.x, oy: c.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [engine]);

  const onBgDown = useCallback((e: ReactPointerEvent) => {
    engine.selectPiece(null);
    drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, px: panZoom.panX, py: panZoom.panY };
  }, [engine, panZoom]);

  const onMove = useCallback((e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === "pan") {
      setPanZoom((s) => ({ ...s, panX: d.px + (e.clientX - d.sx), panY: d.py + (e.clientY - d.sy) }));
    } else {
      const dx = (e.clientX - d.sx) / (MM_TO_PX * panZoom.zoom);
      const dy = (e.clientY - d.sy) / (MM_TO_PX * panZoom.zoom);
      engine.movePiece(d.id, d.ox + dx, d.oy + dy);
    }
  }, [engine, panZoom.zoom, setPanZoom]);

  const onUp = useCallback(() => { drag.current = null; }, []);

  const onWheel = useCallback((e: ReactWheelEvent) => {
    setPanZoom((s) => ({
      ...s,
      zoom: Math.min(3, Math.max(0.15, s.zoom * (e.deltaY < 0 ? 1.1 : 0.9))),
    }));
  }, [setPanZoom]);

  const activePage = pages[state.activePageIdx];
  const canvasW = activePage?.width ?? ed.canvasW;
  const canvasH = activePage?.height ?? ed.canvasH;
  const px = (mm: number) => mm * MM_TO_PX;

  // Auto-run AI turn after nextTurn if current player is AI
  const handleNextTurn = useCallback(() => {
    engine.nextTurn();
    const upcoming = state.players[(state.turnIdx + 1) % state.players.length];
    if (upcoming?.isAI) {
      setTimeout(() => engine.triggerAITurn(), 600);
    }
  }, [engine, state]);

  return (
    <div className="fixed inset-0 z-50 bg-deep-void flex flex-col">
      {/* Top bar */}
      <div className="h-12 bg-rich-wood-dark border-b border-warm-wood flex items-center px-3 sm:px-4 gap-3 shrink-0">
        <span className="font-display text-sm font-bold text-royal-gold truncate min-w-0 flex-1">
          {game?.title ?? "Untitled"}
        </span>

        {/* Phase badge */}
        <span className={`text-2xs font-ui px-2 py-0.5 rounded-full shrink-0 ${
          state.phase === "playing" ? "bg-emerald-ghost text-emerald-glow" :
          state.phase === "ended"   ? "bg-crimson-ghost text-crimson-flame" :
          "bg-warm-wood/40 text-soft-gray"
        }`}>
          {state.phase === "playing" ? `Rnd ${state.round}` : state.phase === "ended" ? "Game over" : "Setup"}
        </span>

        {/* Page indicator */}
        {pages.length > 1 && (
          <span className="text-2xs text-soft-gray font-ui hidden sm:inline shrink-0">
            {activePage?.name} · {state.activePageIdx + 1}/{pages.length}
          </span>
        )}

        <button
          onClick={() => engine.resetGame()}
          className="px-3 py-1.5 rounded-lg border border-warm-wood text-soft-gray text-2xs font-ui hover:text-parchment-light shrink-0 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={() => handleMode("design")}
          className="px-3 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright shrink-0 transition-colors"
        >
          Exit
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Board */}
        <div
          className="flex-1 relative overflow-hidden touch-none"
          style={{ backgroundColor: "#080a0d", cursor: drag.current?.kind === "pan" ? "grabbing" : "grab" }}
          onPointerDown={onBgDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onWheel={onWheel}
        >
          <div style={{
            position: "absolute",
            transform: `translate(${panZoom.panX}px,${panZoom.panY}px) scale(${panZoom.zoom})`,
            transformOrigin: "0 0",
          }}>
            {/* Canvas */}
            <div style={{
              position: "relative",
              width: px(canvasW),
              height: px(canvasH),
              background: "#0f1012",
              border: "1px solid rgba(58,42,31,0.6)",
              borderRadius: 4,
              boxShadow: "0 0 80px rgba(0,0,0,0.8)",
            }}>
              {/* Subtle grid */}
              <div style={{
                position: "absolute", inset: 0, borderRadius: 4, opacity: 0.06,
                backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)",
                backgroundSize: `${MM_TO_PX * 10}px ${MM_TO_PX * 10}px`,
              }} />

              {/* Pieces */}
              {state.pieces
                .filter((c) => c.visible)
                .map((c) => (
                  <PlayPiece
                    key={c.id}
                    c={c}
                    selected={state.selectedPieceId === c.id}
                    flipped={state.flippedPieceIds.has(c.id)}
                    onDown={onPieceDown}
                    onLinkClick={engine.goToPage}
                  />
                ))}
            </div>
          </div>

          {/* Selected piece floating toolbar */}
          {state.selectedPieceId && (() => {
            const piece = state.pieces.find((p) => p.id === state.selectedPieceId);
            if (!piece) return null;
            return (
              <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-rich-wood-dark/95 border border-warm-wood rounded-xl p-1.5 shadow-2xl">
                <button onClick={() => engine.rotatePiece(state.selectedPieceId!, -15)}
                  className="px-2 py-1 rounded-lg bg-warm-wood/60 text-parchment-light text-2xs font-ui hover:bg-warm-wood transition-colors" title="Rotate −15°">↺</button>
                <button onClick={() => engine.rotatePiece(state.selectedPieceId!, 15)}
                  className="px-2 py-1 rounded-lg bg-warm-wood/60 text-parchment-light text-2xs font-ui hover:bg-warm-wood transition-colors" title="Rotate +15°">↻</button>
                <button onClick={() => engine.rotatePiece(state.selectedPieceId!, 90)}
                  className="px-2 py-1 rounded-lg bg-warm-wood/60 text-parchment-light text-2xs font-ui hover:bg-warm-wood transition-colors">90°</button>
                <button onClick={() => engine.flipPiece(state.selectedPieceId!)}
                  className="px-2 py-1 rounded-lg bg-warm-wood/60 text-parchment-light text-2xs font-ui hover:bg-warm-wood transition-colors" title="Flip face-down">Flip</button>
                <button onClick={() => engine.bringToFront(state.selectedPieceId!)}
                  className="px-2 py-1 rounded-lg bg-warm-wood/60 text-parchment-light text-2xs font-ui hover:bg-warm-wood transition-colors">↑ Front</button>
                <button onClick={() => engine.selectPiece(null)}
                  className="px-2 py-1 rounded-lg text-soft-gray text-2xs font-ui hover:text-parchment-light transition-colors">✕</button>
              </div>
            );
          })()}

          {/* Zoom / pan hint */}
          <div className="absolute bottom-4 right-4 text-[10px] text-soft-gray-dark font-mono bg-rich-wood-dark/80 px-2 py-1 rounded">
            {Math.round(panZoom.zoom * 100)}% · scroll zoom · drag pan · click link ⇢
          </div>
        </div>

        {/* HUD */}
        <PlaytestHud
          state={state}
          pages={pages}
          rules={rules}
          guide={guide}
          onAddHuman={() => engine.addPlayer(false)}
          onAddAI={() => engine.addPlayer(true)}
          onRemovePlayer={engine.removePlayer}
          onRenamePlayer={(id, name) => engine.updatePlayer(id, { name })}
          onBumpScore={engine.bumpScore}
          onBumpCounter={engine.bumpCounter}
          onNextTurn={handleNextTurn}
          onPrevTurn={engine.prevTurn}
          onRoll={(sides) => engine.roll(sides)}
          onStart={engine.startGame}
          onEnd={engine.endGame}
          onGoToPage={engine.goToPage}
          onAddCounter={engine.addCounter}
          onBumpCustomCounter={engine.bumpCustomCounter}
          onRemoveCounter={engine.removeCounter}
          onStartTimer={engine.startTimer}
          onStopTimer={engine.stopTimer}
          onResetTimer={engine.resetTimer}
          onUpdatePlayer={engine.updatePlayer}
          onTriggerAI={engine.triggerAITurn}
        />
      </div>
    </div>
  );
}



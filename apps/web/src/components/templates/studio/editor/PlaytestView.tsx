"use client";

import { useRef, useState, useCallback } from "react";
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
import { PlaytestHud, type Player } from "./PlaytestHud";

const COLORS = ["#34d399", "#f5c451", "#22d3ee", "#f87171", "#a78bff", "#fb923c"];
const stamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function makePlayers(n: number): Player[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p-${i}-${Math.random().toString(36).slice(2, 7)}`,
    name: `Player ${i + 1}`,
    color: COLORS[i % COLORS.length]!,
    score: 0,
  }));
}

export function PlaytestView({ ed }: { ed: StudioEditor }) {
  const { components, canvasW, canvasH, rules, guide, game, handleMode } = ed;

  // Ephemeral play state — snapshotted from the active page, never saved back.
  const [pieces, setPieces] = useState<CanvasComp[]>(() => components.map((c) => ({ ...c })));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [zoom, setZoom] = useState(0.8);
  const [players, setPlayers] = useState<Player[]>(() => makePlayers(2));
  const [turnIdx, setTurnIdx] = useState(0);
  const [round, setRound] = useState(1);
  const [log, setLog] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setLog((l) => [`${stamp()}  ${msg}`, ...l].slice(0, 100));
  }, []);

  const drag = useRef<
    | { kind: "piece"; id: string; sx: number; sy: number; ox: number; oy: number }
    | { kind: "pan"; sx: number; sy: number; px: number; py: number }
    | null
  >(null);

  const bringToFront = useCallback((id: string) => {
    setPieces((ps) => {
      const i = ps.findIndex((p) => p.id === id);
      if (i < 0) return ps;
      const next = ps.slice();
      const [p] = next.splice(i, 1);
      next.push(p!);
      return next;
    });
  }, []);

  const onPieceDown = (e: ReactPointerEvent, p: CanvasComp) => {
    e.stopPropagation();
    setSelectedId(p.id);
    bringToFront(p.id);
    drag.current = { kind: "piece", id: p.id, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onBgDown = (e: ReactPointerEvent) => {
    setSelectedId(null);
    drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  };

  const onMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === "pan") {
      setPan({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) });
    } else {
      const dx = (e.clientX - d.sx) / (MM_TO_PX * zoom);
      const dy = (e.clientY - d.sy) / (MM_TO_PX * zoom);
      setPieces((ps) => ps.map((p) => (p.id === d.id ? { ...p, x: d.ox + dx, y: d.oy + dy } : p)));
    }
  };

  const onUp = () => {
    drag.current = null;
  };

  const onWheel = (e: ReactWheelEvent) => {
    setZoom((z) => Math.min(3, Math.max(0.2, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const rotateSelected = () => {
    if (!selectedId) return;
    setPieces((ps) => ps.map((p) => (p.id === selectedId ? { ...p, rotation: (p.rotation + 90) % 360 } : p)));
  };

  // ── Play HUD handlers ────────────────────────────────────────────────────
  const onAddPlayer = () => {
    setPlayers((ps) => [
      ...ps,
      { id: `p-${ps.length}-${Math.random().toString(36).slice(2, 7)}`, name: `Player ${ps.length + 1}`, color: COLORS[ps.length % COLORS.length]!, score: 0 },
    ]);
  };
  const onRemovePlayer = (id: string) => {
    setPlayers((ps) => ps.filter((p) => p.id !== id));
    setTurnIdx((i) => Math.max(0, Math.min(i, players.length - 2)));
  };
  const onRenamePlayer = (id: string, name: string) =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, name } : p)));
  const onBumpScore = (id: string, delta: number) =>
    setPlayers((ps) =>
      ps.map((p) => {
        if (p.id !== id) return p;
        const score = p.score + delta;
        addLog(`${p.name} ${delta > 0 ? "+" : ""}${delta} → ${score}`);
        return { ...p, score };
      }),
    );
  const onNextTurn = () => {
    setTurnIdx((i) => {
      const next = (i + 1) % players.length;
      if (next === 0) {
        setRound((r) => {
          addLog(`— Round ${r + 1} —`);
          return r + 1;
        });
      }
      addLog(`${players[next]?.name}'s turn`);
      return next;
    });
  };
  const onPrevTurn = () => {
    setTurnIdx((i) => (i - 1 + players.length) % players.length);
  };
  const onRoll = (sides: number) => {
    const v = 1 + Math.floor(Math.random() * sides);
    addLog(`${players[turnIdx]?.name ?? "Player"} rolled ${v} (d${sides})`);
  };
  const onReset = () => {
    setPieces(components.map((c) => ({ ...c })));
    setPlayers((ps) => ps.map((p) => ({ ...p, score: 0 })));
    setTurnIdx(0);
    setRound(1);
    setSelectedId(null);
    setLog([`${stamp()}  Game reset`]);
  };

  const px = (mm: number) => mm * MM_TO_PX;

  return (
    <div className="fixed inset-0 z-50 bg-deep-void flex flex-col">
      {/* Top bar */}
      <div className="h-12 bg-rich-wood-dark border-b border-warm-wood flex items-center px-3 sm:px-4 gap-3 shrink-0">
        <span className="font-display text-sm font-bold text-royal-gold truncate min-w-0 flex-1">
          {game?.title ?? "Untitled"}
        </span>
        <span className="text-2xs text-soft-gray font-ui hidden sm:inline shrink-0">Playtest</span>
        <button
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg border border-warm-wood text-soft-gray text-2xs font-ui hover:text-parchment-light shrink-0"
        >
          Reset
        </button>
        <button
          onClick={() => handleMode("design")}
          className="px-3 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright shrink-0"
        >
          Exit
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Board */}
        <div
          className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing touch-none"
          style={{ backgroundColor: "#0c0c0c" }}
          onPointerDown={onBgDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onWheel={onWheel}
        >
          <div
            style={{
              position: "absolute",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <div
              style={{
                position: "relative",
                width: px(canvasW),
                height: px(canvasH),
                backgroundColor: "#0f1012",
                border: "1px solid rgba(58,42,31,0.6)",
                borderRadius: 4,
              }}
            >
              {pieces
                .filter((c) => c.visible)
                .map((c) => {
                  const isCircle = isCircleType(c.type);
                  return (
                    <div
                      key={c.id}
                      onPointerDown={(e) => !c.locked && onPieceDown(e, c)}
                      style={{
                        position: "absolute",
                        left: px(c.x),
                        top: px(c.y),
                        width: px(c.width),
                        height: px(c.height),
                        transform: `rotate(${c.rotation}deg)`,
                        opacity: c.opacity / 100,
                        cursor: c.locked ? "not-allowed" : "grab",
                        outline: selectedId === c.id ? "1.5px solid #7c5cff" : "none",
                        outlineOffset: 1,
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: isChromeless(c.type) ? "transparent" : safeColor(c.fill, "#1a2535"),
                          backgroundImage: c.image ? `url("${c.image}")` : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          border: isChromeless(c.type) ? "none" : `${c.strokeWidth}px solid ${safeColor(c.stroke, "transparent")}`,
                          borderRadius: isCircle ? "50%" : c.cornerRadius,
                          boxShadow: c.type === "text" || isSilhouetteType(c.type) ? "none" : "0 2px 8px rgba(0,0,0,0.45)",
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
                        {isSilhouetteType(c.type) ? (
                          <SilhouetteShape comp={c} />
                        ) : c.type === "text" ? (
                          c.text
                        ) : !c.image ? (
                          <ShapeInner comp={c} />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Selected-piece controls */}
          {selectedId && (
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-rich-wood-dark/95 border border-warm-wood rounded-lg p-1.5 shadow-xl">
              <button onClick={rotateSelected} className="px-2.5 py-1 rounded-md bg-warm-wood/60 text-parchment-light text-2xs font-ui hover:bg-warm-wood">
                Rotate 90°
              </button>
              <button onClick={() => bringToFront(selectedId)} className="px-2.5 py-1 rounded-md bg-warm-wood/60 text-parchment-light text-2xs font-ui hover:bg-warm-wood">
                To front
              </button>
              <button onClick={() => setSelectedId(null)} className="px-2 py-1 rounded-md text-soft-gray text-2xs font-ui hover:text-parchment-light">
                Deselect
              </button>
            </div>
          )}

          {/* Zoom hint */}
          <div className="absolute bottom-4 right-4 text-[10px] text-soft-gray-dark font-mono bg-rich-wood-dark/80 px-2 py-1 rounded">
            {Math.round(zoom * 100)}% · scroll to zoom · drag to pan
          </div>
        </div>

        {/* HUD */}
        <PlaytestHud
          players={players}
          turnIdx={turnIdx}
          round={round}
          log={log}
          rules={rules}
          guide={guide}
          onAddPlayer={onAddPlayer}
          onRemovePlayer={onRemovePlayer}
          onRenamePlayer={onRenamePlayer}
          onBumpScore={onBumpScore}
          onNextTurn={onNextTurn}
          onPrevTurn={onPrevTurn}
          onRoll={onRoll}
        />
      </div>
    </div>
  );
}

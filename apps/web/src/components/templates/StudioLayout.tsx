"use client";

import {
  useRef, useState, useCallback, useEffect,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useStudioStore, selectZoomPercent } from "@/stores/studioStore";
import { useGame, usePublishGame } from "@/hooks/useGames";
import { useStudio } from "@/hooks/useStudio";
import { usePlan } from "@/hooks/usePlan";

// ── Constants ─────────────────────────────────────────────────────────────────

const MM_TO_PX = 2;
const CANVAS_W_MM = 800;
const CANVAS_H_MM = 600;
const GRID_MM = 5;

// ── Types ─────────────────────────────────────────────────────────────────────

type CompType = "board" | "card" | "token" | "tile" | "die" | "pawn" | "rulebook" | "text";

export interface CanvasComp {
  id: string;
  name: string;
  type: CompType;
  x: number; y: number;
  width: number; height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  quantity: number;
  cornerRadius: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
}

const TYPE_DEFAULTS: Record<CompType, Partial<CanvasComp>> = {
  board:    { width: 320, height: 240, fill: "#1a2535", stroke: "#f5c451", strokeWidth: 2, cornerRadius: 8 },
  card:     { width: 63,  height: 88,  fill: "#1c1a2e", stroke: "#7c5cff", strokeWidth: 1, cornerRadius: 6 },
  token:    { width: 28,  height: 28,  fill: "#7c5cff", stroke: "#f5c451", strokeWidth: 2, cornerRadius: 0 },
  tile:     { width: 48,  height: 48,  fill: "#1e2a1c", stroke: "#7c5cff", strokeWidth: 1, cornerRadius: 4 },
  die:      { width: 22,  height: 22,  fill: "#f5c451", stroke: "#0a0a0a", strokeWidth: 1, cornerRadius: 5 },
  pawn:     { width: 26,  height: 40,  fill: "#ff3b5c", stroke: "#0a0a0a", strokeWidth: 1, cornerRadius: 0 },
  rulebook: { width: 148, height: 105, fill: "#2a251a", stroke: "#f5c451", strokeWidth: 1, cornerRadius: 3 },
  text:     { width: 120, height: 28,  fill: "transparent", stroke: "transparent", strokeWidth: 0, cornerRadius: 0, fontSize: 18, textColor: "#e8d5b8" },
};

function makeComp(type: CompType, x: number, y: number): CanvasComp {
  const d = TYPE_DEFAULTS[type];
  const labels: Record<CompType, string> = {
    board: "Board", card: "Card", token: "Token", tile: "Tile",
    die: "Die", pawn: "Pawn", rulebook: "Rulebook", text: "Title",
  };
  return {
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: labels[type],
    type,
    x: Math.round(x), y: Math.round(y),
    rotation: 0, opacity: 100, visible: true, locked: false, quantity: 1,
    fill: "#1a2535", stroke: "#f5c451", strokeWidth: 1, cornerRadius: 4,
    width: 60, height: 60,
    ...(type === "text" ? { text: "New Title" } : {}),
    ...d,
  } as CanvasComp;
}

const INITIAL: CanvasComp[] = [
  makeComp("board", 240, 180),
  { ...makeComp("card", 110, 150), rotation: -6 },
  { ...makeComp("token", 430, 250) },
  { ...makeComp("pawn", 360, 230) },
];

// ── Icons ───────────────────────────────────────────────────────────────────

const COMP_ICONS: Record<CompType, React.ReactNode> = {
  board: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4.5h10M4.5 1v10" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg>,
  card: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="0.5" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>,
  token: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  tile: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>,
  die: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="4" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>,
  pawn: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 11c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  rulebook: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="0.5" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 4h5M3.5 6.5h5M3.5 9h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>,
  text: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M6 3v7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
};

// ── Tools ─────────────────────────────────────────────────────────────────────

const TOOLS = [
  { id: "select" as const, label: "Select (V)", cursor: "default", creates: null,
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l4.5 10 1.8-4L13 6 2 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
  { id: "hand" as const, label: "Pan (H)", cursor: "grab", creates: null,
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 5.5V3a1 1 0 012 0v2.5m0 0V2.5a1 1 0 012 0V5.5m0 0V3a1 1 0 012 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4V6a1 1 0 012 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: "board" as const, label: "Board", cursor: "crosshair", creates: "board" as CompType,
    icon: COMP_ICONS.board },
  { id: "card" as const, label: "Card", cursor: "crosshair", creates: "card" as CompType,
    icon: COMP_ICONS.card },
  { id: "token" as const, label: "Token", cursor: "crosshair", creates: "token" as CompType,
    icon: COMP_ICONS.token },
  { id: "die" as const, label: "Die", cursor: "crosshair", creates: "die" as CompType,
    icon: COMP_ICONS.die },
  { id: "pawn" as const, label: "Pawn", cursor: "crosshair", creates: "pawn" as CompType,
    icon: COMP_ICONS.pawn },
  { id: "text" as const, label: "Title / Text (T)", cursor: "text", creates: "text" as CompType,
    icon: COMP_ICONS.text },
] as const;

type ToolId = typeof TOOLS[number]["id"];

// ── Shape renderer (used in editor + previews) ────────────────────────────────

function ShapeInner({ comp }: { comp: CanvasComp }) {
  if (comp.type === "board") {
    return <div className="absolute inset-0" style={{
      backgroundImage: "linear-gradient(rgba(0,229,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.05) 1px,transparent 1px)",
      backgroundSize: "24px 24px", borderRadius: "inherit",
    }} />;
  }
  if (comp.type === "die") {
    return (
      <div className="absolute inset-[15%] grid grid-cols-2 gap-[10%]">
        {[0,1,2,3].map(i => <div key={i} className="rounded-full" style={{ background: "rgba(10,10,10,0.75)" }} />)}
      </div>
    );
  }
  if (comp.type === "rulebook") {
    return (
      <div className="absolute inset-x-[10%] inset-y-[12%] flex flex-col gap-[6%]">
        {[90,75,82,60,70,50].map((w,i) => <div key={i} style={{ height: 2, width: `${w}%`, background: "rgba(245,196,81,0.25)", borderRadius: 2 }} />)}
      </div>
    );
  }
  if (comp.type === "card" || comp.type === "tile") {
    return <div className="absolute inset-[8%] rounded" style={{ border: "1px dashed rgba(255,255,255,0.12)" }} />;
  }
  return null;
}

/** Pawn is rendered as an SVG silhouette so it actually looks like a pawn. */
function PawnShape({ comp }: { comp: CanvasComp }) {
  return (
    <svg viewBox="0 0 26 40" width="100%" height="100%" preserveAspectRatio="none" style={{ display: "block" }}>
      <path
        d="M13 2c3 0 5.2 2.3 5.2 5.2 0 1.9-1 3.5-2.4 4.5 2.6 1.2 3.6 3.6 3.9 6.3.2 1.6-.9 2.6-2.4 2.6h-1l1.4 12c.2 1.6-1 3-2.6 3h-3.8c-1.6 0-2.8-1.4-2.6-3l1.4-12h-1c-1.5 0-2.6-1-2.4-2.6.3-2.7 1.3-5.1 3.9-6.3-1.4-1-2.4-2.6-2.4-4.5C7.8 4.3 10 2 13 2z"
        fill={comp.fill}
        stroke={comp.stroke}
        strokeWidth={comp.strokeWidth}
      />
    </svg>
  );
}

// ── CompView (editor) ─────────────────────────────────────────────────────────

interface CompViewProps {
  comp: CanvasComp;
  selected: boolean;
  editable: boolean;
  onPointerDown: (e: ReactPointerEvent, comp: CanvasComp) => void;
  onResizeStart: (e: ReactPointerEvent, comp: CanvasComp, handle: ResizeHandle) => void;
  onRotateStart: (e: ReactPointerEvent, comp: CanvasComp) => void;
  onTextChange: (id: string, text: string) => void;
}

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const HANDLES: { id: ResizeHandle; cx: number; cy: number; cursor: string }[] = [
  { id: "nw", cx: 0, cy: 0, cursor: "nwse-resize" },
  { id: "n", cx: 0.5, cy: 0, cursor: "ns-resize" },
  { id: "ne", cx: 1, cy: 0, cursor: "nesw-resize" },
  { id: "e", cx: 1, cy: 0.5, cursor: "ew-resize" },
  { id: "se", cx: 1, cy: 1, cursor: "nwse-resize" },
  { id: "s", cx: 0.5, cy: 1, cursor: "ns-resize" },
  { id: "sw", cx: 0, cy: 1, cursor: "nesw-resize" },
  { id: "w", cx: 0, cy: 0.5, cursor: "ew-resize" },
];

function CompView({ comp, selected, editable, onPointerDown, onResizeStart, onRotateStart, onTextChange }: CompViewProps) {
  const px = (mm: number) => mm * MM_TO_PX;
  const isCircle = comp.type === "token";
  const w = px(comp.width), h = px(comp.height);

  return (
    <div
      onPointerDown={(e) => editable && onPointerDown(e, comp)}
      style={{
        position: "absolute",
        left: px(comp.x), top: px(comp.y), width: w, height: h,
        transform: `rotate(${comp.rotation}deg)`, transformOrigin: "center",
        opacity: comp.opacity / 100,
        cursor: comp.locked ? "not-allowed" : editable ? "move" : "default",
        display: comp.visible ? "block" : "none",
      }}
    >
      {/* Body */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundColor: comp.type === "pawn" ? "transparent" : comp.fill,
        border: comp.type === "pawn" || comp.type === "text" ? "none" : `${comp.strokeWidth}px solid ${comp.stroke}`,
        borderRadius: isCircle ? "50%" : comp.cornerRadius,
        boxShadow: comp.type === "text" ? "none" : "0 2px 8px rgba(0,0,0,0.45)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}>
        {comp.type === "pawn" ? <PawnShape comp={comp} /> : <ShapeInner comp={comp} />}
      </div>

      {/* Text content */}
      {comp.type === "text" && (
        selected && editable ? (
          <input
            value={comp.text ?? ""}
            onChange={(e) => onTextChange(comp.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-transparent text-center outline-none"
            style={{ color: comp.textColor ?? "#e8d5b8", fontSize: px(comp.fontSize ?? 18) / 1.6, fontFamily: "var(--font-display)", fontWeight: 700 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-center"
            style={{ color: comp.textColor ?? "#e8d5b8", fontSize: px(comp.fontSize ?? 18) / 1.6, fontFamily: "var(--font-display)", fontWeight: 700 }}>
            {comp.text}
          </div>
        )
      )}

      {/* Selection outline + handles */}
      {selected && editable && (
        <>
          <div className="absolute inset-0 pointer-events-none" style={{ outline: "1.5px solid #7c5cff", outlineOffset: 1 }} />
          {/* Resize handles */}
          {HANDLES.map(hd => (
            <div
              key={hd.id}
              onPointerDown={(e) => { e.stopPropagation(); onResizeStart(e, comp, hd.id); }}
              style={{
                position: "absolute",
                left: `calc(${hd.cx * 100}% - 4px)`, top: `calc(${hd.cy * 100}% - 4px)`,
                width: 8, height: 8, background: "#7c5cff",
                border: "1.5px solid #0a0a0a", borderRadius: 1, cursor: hd.cursor, zIndex: 20,
              }}
            />
          ))}
          {/* Rotate handle */}
          <div
            onPointerDown={(e) => { e.stopPropagation(); onRotateStart(e, comp); }}
            style={{
              position: "absolute", left: "calc(50% - 5px)", top: -22,
              width: 10, height: 10, background: "#f5c451",
              border: "1.5px solid #0a0a0a", borderRadius: "50%", cursor: "grab", zIndex: 20,
            }}
            title="Rotate"
          />
          <div className="absolute pointer-events-none" style={{ left: "50%", top: -12, width: 1, height: 12, background: "#f5c451" }} />
        </>
      )}
    </div>
  );
}

// ── Previews ──────────────────────────────────────────────────────────────────

function Preview2D({ components, scale }: { components: CanvasComp[]; scale: number }) {
  const px = (mm: number) => mm * MM_TO_PX * scale;
  return (
    <div style={{ position: "relative", width: px(CANVAS_W_MM), height: px(CANVAS_H_MM), backgroundColor: "#0f1012", border: "1px solid rgba(58,42,31,0.6)", borderRadius: 4 }}>
      {components.filter(c => c.visible).map(c => {
        const isCircle = c.type === "token";
        return (
          <div key={c.id} style={{
            position: "absolute", left: px(c.x), top: px(c.y), width: px(c.width), height: px(c.height),
            transform: `rotate(${c.rotation}deg)`, opacity: c.opacity / 100,
            backgroundColor: c.type === "pawn" || c.type === "text" ? "transparent" : c.fill,
            border: c.type === "pawn" || c.type === "text" ? "none" : `${c.strokeWidth}px solid ${c.stroke}`,
            borderRadius: isCircle ? "50%" : c.cornerRadius * scale,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: c.textColor, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: px(c.fontSize ?? 18) / 1.6,
            overflow: "hidden",
          }}>
            {c.type === "pawn" ? <PawnShape comp={c} /> : c.type === "text" ? c.text : null}
          </div>
        );
      })}
    </div>
  );
}

/** CSS 3D preview — each component gets real depth/extrusion. */
function Preview3D({ components }: { components: CanvasComp[] }) {
  const s = 0.7;
  const px = (mm: number) => mm * MM_TO_PX * s;
  const depthFor = (t: CompType) => t === "token" ? 10 : t === "die" ? 16 : t === "pawn" ? 22 : t === "card" ? 4 : t === "board" ? 3 : 6;
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ perspective: "1400px" }}>
      <div style={{ position: "relative", width: px(CANVAS_W_MM), height: px(CANVAS_H_MM), transform: "rotateX(55deg) rotateZ(0deg)", transformStyle: "preserve-3d" }}>
        {/* table */}
        <div style={{ position: "absolute", inset: -60, background: "radial-gradient(ellipse at center,#241a12,#140e09)", transform: "translateZ(-6px)", borderRadius: 8, boxShadow: "0 40px 80px rgba(0,0,0,0.7)" }} />
        {components.filter(c => c.visible).map(c => {
          const depth = depthFor(c.type) * s;
          const isCircle = c.type === "token";
          const w = px(c.width), h = px(c.height);
          return (
            <div key={c.id} style={{ position: "absolute", left: px(c.x), top: px(c.y), width: w, height: h, transformStyle: "preserve-3d", transform: `rotate(${c.rotation}deg)`, opacity: c.opacity / 100 }}>
              {/* top face */}
              <div style={{
                position: "absolute", inset: 0, transform: `translateZ(${depth}px)`,
                backgroundColor: c.type === "pawn" || c.type === "text" ? "transparent" : c.fill,
                border: c.type === "pawn" || c.type === "text" ? "none" : `${c.strokeWidth}px solid ${c.stroke}`,
                borderRadius: isCircle ? "50%" : c.cornerRadius,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: c.textColor, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: (c.fontSize ?? 18) * s,
                overflow: "hidden",
              }}>
                {c.type === "pawn" ? <PawnShape comp={c} /> : c.type === "die" ? <ShapeInner comp={c} /> : c.type === "text" ? c.text : c.type === "board" ? <ShapeInner comp={c} /> : null}
              </div>
              {/* side walls (extrusion) — simple shadow box */}
              <div style={{
                position: "absolute", inset: 0, transform: `translateZ(${depth / 2}px)`,
                backgroundColor: c.type === "pawn" || c.type === "text" ? "transparent" : c.fill,
                filter: "brightness(0.6)",
                borderRadius: isCircle ? "50%" : c.cornerRadius,
                boxShadow: `0 ${depth}px ${depth}px rgba(0,0,0,0.5)`,
              }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── StudioLayout ──────────────────────────────────────────────────────────────

interface StudioLayoutProps { gameId: string; }

export function StudioLayout({ gameId }: StudioLayoutProps) {
  const isNew = gameId === "new";

  const {
    mode, setMode,
    leftPanelTab, setLeftPanelTab, rightPanelTab, setRightPanelTab,
    showGrid, toggleGrid, snapToGrid, toggleSnap,
    isDirty, isSaving, zoomIn, zoomOut, resetZoom,
    markDirty,
  } = useStudioStore();
  const zoomPercent = useStudioStore(selectZoomPercent);
  const storeZoom = useStudioStore(s => s.viewport.zoom);
  const { saveNow } = useStudio(gameId);
  const plan = usePlan();

  const [activeTool, setActiveTool] = useState<ToolId>("select");

  // History
  const [components, setComponentsRaw] = useState<CanvasComp[]>(INITIAL);
  const pastRef = useRef<CanvasComp[][]>([]);
  const futureRef = useRef<CanvasComp[][]>([]);
  const [, forceRerender] = useState(0);

  const commit = useCallback((next: CanvasComp[], pushHistory = true) => {
    setComponentsRaw(prev => {
      if (pushHistory) {
        pastRef.current.push(prev);
        if (pastRef.current.length > 80) pastRef.current.shift();
        futureRef.current = [];
      }
      return next;
    });
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(INITIAL[0]?.id ?? null);
  const [panX, setPanX] = useState(60);
  const [panY, setPanY] = useState(60);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const clipboardRef = useRef<CanvasComp | null>(null);
  const { data: game } = useGame(isNew ? "" : gameId);
  const publish = usePublishGame(gameId);

  const selectedComp = components.find(c => c.id === selectedId) ?? null;
  const inPreview = mode !== "design";

  // ── Hydration ──────────────────────────────────────────────────────────────
  const hydratedRef = useRef<string | null>(null);
  const suppressDirtyRef = useRef(false);
  useEffect(() => {
    if (!game || hydratedRef.current === game.id) return;
    hydratedRef.current = game.id;
    const saved = (game.studioData as { components?: CanvasComp[] } | null)?.components;
    if (Array.isArray(saved) && saved.length > 0) {
      suppressDirtyRef.current = true;
      setComponentsRaw(saved);
      setSelectedId(saved[0]?.id ?? null);
    }
  }, [game]);

  // ── Dirty tracking ─────────────────────────────────────────────────────────
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (suppressDirtyRef.current) { suppressDirtyRef.current = false; return; }
    markDirty();
  }, [components, markDirty]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateComp = useCallback((id: string, patch: Partial<CanvasComp>, history = true) => {
    setComponentsRaw(prev => {
      if (history) { pastRef.current.push(prev); futureRef.current = []; }
      return prev.map(c => c.id === id ? { ...c, ...patch } : c);
    });
  }, []);

  const addComp = useCallback((type: CompType, x = 60 + Math.random() * 120, y = 60 + Math.random() * 90) => {
    const c = makeComp(type, x, y);
    commit([...components, c]);
    setSelectedId(c.id);
    return c;
  }, [components, commit]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    commit(components.filter(c => c.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, components, commit]);

  const duplicateSelected = useCallback(() => {
    if (!selectedComp) return;
    const copy = { ...selectedComp, id: `${selectedComp.type}-${Date.now()}`, x: selectedComp.x + 10, y: selectedComp.y + 10 };
    commit([...components, copy]);
    setSelectedId(copy.id);
  }, [selectedComp, components, commit]);

  const moveZ = useCallback((id: string, dir: "up" | "down") => {
    const idx = components.findIndex(c => c.id === id);
    if (idx < 0) return;
    const next = [...components];
    if (dir === "up" && idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
    else if (dir === "down" && idx > 0) [next[idx], next[idx - 1]] = [next[idx - 1]!, next[idx]!];
    commit(next);
  }, [components, commit]);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(components);
    setComponentsRaw(prev);
    forceRerender(n => n + 1);
  }, [components]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(components);
    setComponentsRaw(next);
    forceRerender(n => n + 1);
  }, [components]);

  const copy = useCallback(() => { if (selectedComp) clipboardRef.current = selectedComp; }, [selectedComp]);
  const paste = useCallback(() => {
    const c = clipboardRef.current;
    if (!c) return;
    const copyComp = { ...c, id: `${c.type}-${Date.now()}`, x: c.x + 15, y: c.y + 15 };
    commit([...components, copyComp]);
    setSelectedId(copyComp.id);
  }, [components, commit]);

  // ── Drag / resize / rotate ───────────────────────────────────────────────────
  const dragRef = useRef<{
    kind: "move" | "pan" | "resize" | "rotate"; compId?: string; handle?: ResizeHandle;
    sx: number; sy: number; ox: number; oy: number; ow: number; oh: number; orot: number;
    cxScreen: number; cyScreen: number;
  } | null>(null);

  const onCompPointerDown = useCallback((e: ReactPointerEvent, comp: CanvasComp) => {
    if (comp.locked || inPreview) return;
    e.stopPropagation();
    setSelectedId(comp.id);
    if (activeTool !== "select") return;
    pastRef.current.push(components); futureRef.current = [];
    dragRef.current = { kind: "move", compId: comp.id, sx: e.clientX, sy: e.clientY, ox: comp.x, oy: comp.y, ow: comp.width, oh: comp.height, orot: comp.rotation, cxScreen: 0, cyScreen: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [activeTool, inPreview, components]);

  const onResizeStart = useCallback((e: ReactPointerEvent, comp: CanvasComp, handle: ResizeHandle) => {
    pastRef.current.push(components); futureRef.current = [];
    dragRef.current = { kind: "resize", compId: comp.id, handle, sx: e.clientX, sy: e.clientY, ox: comp.x, oy: comp.y, ow: comp.width, oh: comp.height, orot: comp.rotation, cxScreen: 0, cyScreen: 0 };
  }, [components]);

  const onRotateStart = useCallback((e: ReactPointerEvent, comp: CanvasComp) => {
    pastRef.current.push(components); futureRef.current = [];
    const rect = (e.currentTarget as HTMLElement).closest("[data-canvas]")?.getBoundingClientRect();
    const cx = (comp.x + comp.width / 2) * MM_TO_PX * storeZoom + panX + (rect?.left ?? 0);
    const cy = (comp.y + comp.height / 2) * MM_TO_PX * storeZoom + panY + (rect?.top ?? 0);
    dragRef.current = { kind: "rotate", compId: comp.id, sx: e.clientX, sy: e.clientY, ox: comp.x, oy: comp.y, ow: comp.width, oh: comp.height, orot: comp.rotation, cxScreen: cx, cyScreen: cy };
  }, [components, storeZoom, panX, panY]);

  const onCanvasPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).dataset.canvasbg) return;
    const tool = TOOLS.find(t => t.id === activeTool);
    if (tool?.creates) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const mx = (e.clientX - rect.left - panX) / (MM_TO_PX * storeZoom);
      const my = (e.clientY - rect.top - panY) / (MM_TO_PX * storeZoom);
      addComp(tool.creates, mx, my);
      setActiveTool("select");
      return;
    }
    setSelectedId(null);
    if (activeTool === "hand") {
      dragRef.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: panX, oy: panY, ow: 0, oh: 0, orot: 0, cxScreen: 0, cyScreen: 0 };
    }
  }, [activeTool, panX, panY, storeZoom, addComp]);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const dr = dragRef.current;
    if (!dr) return;
    const z = storeZoom;
    if (dr.kind === "pan") {
      setPanX(dr.ox + (e.clientX - dr.sx));
      setPanY(dr.oy + (e.clientY - dr.sy));
    } else if (dr.kind === "move" && dr.compId) {
      let nx = dr.ox + (e.clientX - dr.sx) / (z * MM_TO_PX);
      let ny = dr.oy + (e.clientY - dr.sy) / (z * MM_TO_PX);
      if (snapToGrid) { nx = Math.round(nx / GRID_MM) * GRID_MM; ny = Math.round(ny / GRID_MM) * GRID_MM; }
      nx = Math.max(-50, Math.min(nx, CANVAS_W_MM)); ny = Math.max(-50, Math.min(ny, CANVAS_H_MM));
      setComponentsRaw(prev => prev.map(c => c.id === dr.compId ? { ...c, x: Math.round(nx), y: Math.round(ny) } : c));
    } else if (dr.kind === "resize" && dr.compId) {
      const dx = (e.clientX - dr.sx) / (z * MM_TO_PX);
      const dy = (e.clientY - dr.sy) / (z * MM_TO_PX);
      const h = dr.handle!;
      let { ox, oy, ow, oh } = dr;
      if (h.includes("e")) ow = dr.ow + dx;
      if (h.includes("s")) oh = dr.oh + dy;
      if (h.includes("w")) { ow = dr.ow - dx; ox = dr.ox + dx; }
      if (h.includes("n")) { oh = dr.oh - dy; oy = dr.oy + dy; }
      ow = Math.max(8, ow); oh = Math.max(8, oh);
      setComponentsRaw(prev => prev.map(c => c.id === dr.compId ? { ...c, x: Math.round(ox), y: Math.round(oy), width: Math.round(ow), height: Math.round(oh) } : c));
    } else if (dr.kind === "rotate" && dr.compId) {
      const ang = Math.atan2(e.clientY - dr.cyScreen, e.clientX - dr.cxScreen) * 180 / Math.PI + 90;
      const snapped = e.shiftKey ? Math.round(ang / 15) * 15 : Math.round(ang);
      setComponentsRaw(prev => prev.map(c => c.id === dr.compId ? { ...c, rotation: snapped } : c));
    }
  }, [storeZoom, snapToGrid]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  const onWheel = useCallback((e: ReactWheelEvent) => {
    if (e.deltaY < 0) zoomIn(); else zoomOut();
  }, [zoomIn, zoomOut]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (mod && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); return; }
      if (mod && e.key.toLowerCase() === "c") { e.preventDefault(); copy(); return; }
      if (mod && e.key.toLowerCase() === "v") { e.preventDefault(); paste(); return; }
      if (mod && e.key.toLowerCase() === "d") { e.preventDefault(); duplicateSelected(); return; }
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); void handleSave(); return; }
      if (e.key === "Delete" || e.key === "Backspace") { deleteSelected(); return; }
      if (e.key === "Escape") { setSelectedId(null); return; }
      if (e.key === "v" || e.key === "V") setActiveTool("select");
      if (e.key === "h" || e.key === "H") setActiveTool("hand");
      if (e.key === "t" || e.key === "T") setActiveTool("text");
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key) && selectedComp) {
        e.preventDefault();
        const step = e.shiftKey ? GRID_MM : 1;
        updateComp(selectedComp.id, {
          x: selectedComp.x + (e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0),
          y: selectedComp.y + (e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0),
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, copy, paste, duplicateSelected, deleteSelected, selectedComp, updateComp]);

  // ── Save / publish ──────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (isNew) { toast.error("Create the game first."); return; }
    await saveNow({ components } as unknown as Record<string, unknown>);
  }, [isNew, saveNow, components]);

  async function handlePublish() {
    if (!isNew) await saveNow({ components } as unknown as Record<string, unknown>);
    try { await publish.mutateAsync(); toast.success("Submitted for review!"); }
    catch { toast.error("Publish failed. Try again."); }
  }

  // ── 3D gating ───────────────────────────────────────────────────────────────
  function handleMode(m: "design" | "preview_2d" | "preview_3d") {
    if (m === "preview_3d" && !plan.has3DPreview) {
      toast.error("3D preview is a paid feature. Upgrade your plan to unlock it.");
      return;
    }
    setMode(m);
  }

  const toolCursor = TOOLS.find(t => t.id === activeTool)?.cursor ?? "default";
  const reversed = [...components].reverse();

  // ── Preview overlay (fullscreen, no editor chrome) ───────────────────────────
  if (inPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-deep-void flex flex-col">
        {/* minimal preview bar */}
        <div className="h-12 bg-rich-wood-dark border-b border-warm-wood flex items-center px-4 gap-3 shrink-0">
          <span className="font-display text-sm font-bold text-royal-gold">{game?.title ?? "Preview"}</span>
          <span className="text-2xs text-soft-gray font-ui">{mode === "preview_3d" ? "3D Preview" : "2D Preview"}</span>
          <div className="ml-auto flex items-center gap-1 bg-warm-wood rounded-lg p-0.5">
            <button onClick={() => handleMode("preview_2d")} className={`px-3 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "preview_2d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}>2D</button>
            <button onClick={() => handleMode("preview_3d")} className={`px-3 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "preview_3d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}>3D</button>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={zoomOut} className="v-tool-btn font-mono text-xs">−</button>
            <button onClick={resetZoom} className="font-mono text-2xs text-soft-gray bg-warm-wood px-1.5 py-1 rounded min-w-[40px]">{zoomPercent}%</button>
            <button onClick={zoomIn} className="v-tool-btn font-mono text-xs">+</button>
          </div>
          <button onClick={() => setMode("design")} className="px-3 py-1.5 rounded-md bg-warm-wood text-parchment-light text-xs font-ui font-semibold hover:bg-warm-wood-light transition-colors">
            ✕ Exit Preview
          </button>
        </div>
        {/* preview canvas with pan */}
        <PreviewStage mode={mode} components={components} zoom={storeZoom} />
      </div>
    );
  }

  // ── Editor ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-deep-void overflow-hidden">
      {/* Toolbar */}
      <header className="min-h-11 bg-rich-wood-dark border-b border-warm-wood flex items-center px-2 gap-1 shrink-0 z-40 overflow-x-auto flex-wrap">
        <Link href="/dashboard" title="Dashboard" className="font-display text-royal-gold text-sm font-bold mr-1 hover:text-royal-gold-bright shrink-0">✦</Link>
        <span className="text-2xs text-soft-gray font-ui truncate max-w-[120px] hidden sm:block mr-1 shrink-0">{game?.title ?? (isNew ? "New Game" : gameId.slice(0,8))}</span>
        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />
        {TOOLS.map(t => (
          <button key={t.id} title={t.label} onClick={() => setActiveTool(t.id)} className={`v-tool-btn shrink-0 ${activeTool === t.id ? "active" : ""}`}>{t.icon}</button>
        ))}
        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />
        <button title="Undo (⌘Z)" disabled={pastRef.current.length === 0} className="v-tool-btn disabled:opacity-30 shrink-0" onClick={undo}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 8A4 4 0 019 4h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M3 4.5l-.5 3.5L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button title="Redo (⌘⇧Z)" disabled={futureRef.current.length === 0} className="v-tool-btn disabled:opacity-30 shrink-0" onClick={redo}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M10 8A4 4 0 004 4H2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 4.5l.5 3.5L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />
        <button title="Grid" onClick={toggleGrid} className={`v-tool-btn shrink-0 ${showGrid ? "active" : ""}`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 4.5h11M1 8.5h11M4.5 1v11M8.5 1v11" stroke="currentColor" strokeWidth="1.2"/></svg>
        </button>
        <button title="Snap" onClick={toggleSnap} className={`v-tool-btn shrink-0 ${snapToGrid ? "active" : ""}`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>
        <button title="Layers" onClick={() => setLeftOpen(v => !v)} className={`v-tool-btn shrink-0 lg:hidden ${leftOpen ? "active" : ""}`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1h5M7 5h5M7 9h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>

        {/* Mode */}
        <div className="ml-auto flex items-center gap-0.5 bg-warm-wood rounded-lg p-0.5 shrink-0">
          <button onClick={() => handleMode("design")} className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "design" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}>Design</button>
          <button onClick={() => handleMode("preview_2d")} className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold ${(mode as string) === "preview_2d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}>Preview</button>
          <button onClick={() => handleMode("preview_3d")} title={plan.has3DPreview ? "3D Preview" : "3D preview — upgrade required"} className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold flex items-center gap-1 ${(mode as string) === "preview_3d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}>
            3D {!plan.has3DPreview && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><rect x="2.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2"/></svg>}
          </button>
        </div>
        <div className="flex items-center gap-0.5 mx-1.5 shrink-0">
          <button onClick={zoomOut} className="v-tool-btn font-mono text-xs">−</button>
          <button onClick={resetZoom} className="font-mono text-2xs text-soft-gray bg-warm-wood px-1.5 py-1 rounded min-w-[40px] text-center hover:text-parchment-light">{zoomPercent}%</button>
          <button onClick={zoomIn} className="v-tool-btn font-mono text-xs">+</button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-2xs font-ui hidden md:inline ${isSaving ? "text-royal-gold" : isDirty ? "text-soft-gray-dark" : "text-emerald-glow"}`}>{isSaving ? "Saving…" : isDirty ? "Unsaved" : "Saved"}</span>
          <button onClick={() => void handleSave()} className="v-tool-btn text-2xs font-ui px-2" title="Save (⌘S)">Save</button>
          <button onClick={handlePublish} disabled={publish.isPending || game?.status === "reviewing"} className="px-3 py-1 rounded-md bg-emerald-glow text-deep-void text-xs font-ui font-bold hover:bg-emerald-bright disabled:opacity-50">
            {game?.status === "reviewing" ? "In Review" : "Publish"}
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel */}
        <aside className={`${leftOpen ? "w-52" : "w-0"} bg-rich-wood-dark border-r border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:z-30 max-lg:h-full`}>
          <div className="flex border-b border-warm-wood shrink-0">
            {(["layers","components","assets"] as const).map(tab => (
              <button key={tab} onClick={() => setLeftPanelTab(tab)} className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase border-b-2 -mb-px ${leftPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}>
                {tab === "layers" ? "Layers" : tab === "components" ? "Parts" : "Assets"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {leftPanelTab === "layers" && (
              <div className="p-1.5">
                {reversed.map(c => (
                  <div key={c.id} onClick={() => setSelectedId(c.id)} className={`flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 cursor-pointer group ${selectedId === c.id ? "bg-emerald-ghost text-emerald-glow" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"}`}>
                    <span className="opacity-60 shrink-0">{COMP_ICONS[c.type]}</span>
                    <span className="text-2xs font-ui truncate flex-1">{c.name}</span>
                    <button onClick={e => { e.stopPropagation(); updateComp(c.id, { visible: !c.visible }, false); }} className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-parchment-light">
                      {c.visible ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 6c1.5-3 9-3 10 0-1.5 3-9 3-10 0z" stroke="currentColor" strokeWidth="1.2"/></svg> : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M1 6c1.5-3 9-3 10 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                    </button>
                  </div>
                ))}
                {components.length === 0 && <p className="text-2xs text-soft-gray-dark font-ui px-3 py-6 text-center">No components yet</p>}
              </div>
            )}
            {leftPanelTab === "components" && (
              <div className="p-1.5">
                <p className="text-2xs text-soft-gray-dark font-ui px-2 py-2 uppercase tracking-[0.1em]">Click to add</p>
                {(["board","card","token","tile","die","pawn","rulebook","text"] as CompType[]).map(type => (
                  <button key={type} onClick={() => addComp(type)} className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-warm-wood text-soft-gray hover:text-parchment-light mb-0.5 group">
                    <span className="group-hover:text-emerald-glow">{COMP_ICONS[type]}</span>
                    <span className="text-2xs font-ui capitalize">{type === "text" ? "Title / Text" : type}</span>
                  </button>
                ))}
              </div>
            )}
            {leftPanelTab === "assets" && <AssetsPanel onPick={(url) => {
              if (!selectedComp) { toast.error("Select a component first."); return; }
              updateComp(selectedComp.id, { fill: `url(${url})` });
              toast.success("Applied. (Image fills are illustrative in this build.)");
            }} />}
          </div>
        </aside>

        {/* Canvas */}
        <main
          data-canvas
          className="flex-1 relative overflow-hidden"
          style={{ cursor: activeTool === "hand" ? "grab" : toolCursor, backgroundColor: "#0c0c0c" }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          {showGrid && <div data-canvasbg className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(58,42,31,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(58,42,31,0.4) 1px,transparent 1px)",
            backgroundSize: `${GRID_MM * MM_TO_PX * storeZoom}px ${GRID_MM * MM_TO_PX * storeZoom}px`,
            backgroundPosition: `${panX}px ${panY}px`,
          }} />}
          <div style={{ position: "absolute", transformOrigin: "0 0", transform: `translate(${panX}px,${panY}px) scale(${storeZoom})` }}>
            <div data-canvasbg style={{ position: "relative", width: CANVAS_W_MM * MM_TO_PX, height: CANVAS_H_MM * MM_TO_PX, backgroundColor: "#111214", border: "1px solid rgba(58,42,31,0.6)", boxShadow: "0 8px 40px rgba(0,0,0,0.8)" }}>
              <div style={{ position: "absolute", top: -20, left: 0, color: "rgba(168,162,158,0.4)", fontSize: 10, fontFamily: "monospace" }}>{CANVAS_W_MM} × {CANVAS_H_MM} mm</div>
              {components.map(c => (
                <CompView key={c.id} comp={c} selected={selectedId === c.id} editable
                  onPointerDown={onCompPointerDown} onResizeStart={onResizeStart} onRotateStart={onRotateStart}
                  onTextChange={(id, text) => updateComp(id, { text }, false)} />
              ))}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 text-2xs text-soft-gray-dark font-mono bg-rich-wood-dark/80 rounded px-2 py-1 pointer-events-none">
            {selectedComp ? `${selectedComp.name} · ${Math.round(selectedComp.x)},${Math.round(selectedComp.y)} · ${selectedComp.width}×${selectedComp.height}mm` : `${CANVAS_W_MM}×${CANVAS_H_MM}mm`}
          </div>
          <div className="absolute bottom-3 right-3 text-2xs text-soft-gray-dark font-ui bg-rich-wood-dark/70 rounded px-2 py-1 pointer-events-none hidden lg:block">
            ⌘Z undo · ⌘C/⌘V copy · drag handles to resize · gold dot to rotate
          </div>

          {/* Panel collapse toggles (desktop) */}
          <button onClick={() => setLeftOpen(v => !v)} className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-l-0 border-warm-wood rounded-r-lg items-center justify-center text-soft-gray hover:text-parchment-light z-10 hidden lg:flex">
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none"><path d={leftOpen ? "M5.5 1L2 5l3.5 4" : "M1.5 1L5 5l-3.5 4"} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={() => setRightOpen(v => !v)} className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-r-0 border-warm-wood rounded-l-lg items-center justify-center text-soft-gray hover:text-parchment-light z-10 hidden lg:flex">
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none"><path d={rightOpen ? "M1.5 1L5 5l-3.5 4" : "M5.5 1L2 5l3.5 4"} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </main>

        {/* Right panel */}
        <aside className={`${rightOpen ? "w-60" : "w-0"} bg-rich-wood-dark border-l border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:right-0 max-lg:z-30 max-lg:h-full`}>
          <div className="flex border-b border-warm-wood shrink-0">
            {(["properties","styling","rules"] as const).map(tab => (
              <button key={tab} onClick={() => setRightPanelTab(tab)} className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase border-b-2 -mb-px ${rightPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}>
                {tab === "properties" ? "Props" : tab === "styling" ? "Style" : "Rules"}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {!selectedComp && rightPanelTab !== "rules" && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-soft-gray-dark"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3"/><path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                <p className="text-2xs text-soft-gray-dark font-ui">Select a component</p>
              </div>
            )}
            {rightPanelTab === "properties" && selectedComp && (
              <PropertiesPanel comp={selectedComp} onChange={(p) => updateComp(selectedComp.id, p, false)}
                onDup={duplicateSelected} onDel={deleteSelected} onZ={(d) => moveZ(selectedComp.id, d)} />
            )}
            {rightPanelTab === "styling" && selectedComp && (
              <StylePanel comp={selectedComp} onChange={(p) => updateComp(selectedComp.id, p, false)} />
            )}
            {rightPanelTab === "rules" && <RulesPanel hasEngine={plan.hasTeamCollaboration} />}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Preview stage with pan ────────────────────────────────────────────────────

function PreviewStage({ mode, components, zoom }: { mode: string; components: CanvasComp[]; zoom: number }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  return (
    <div
      className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: "#0c0c0c" }}
      onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y }; }}
      onPointerMove={(e) => { if (drag.current) setPan({ x: drag.current.ox + (e.clientX - drag.current.x), y: drag.current.oy + (e.clientY - drag.current.y) }); }}
      onPointerUp={() => { drag.current = null; }}
      onPointerLeave={() => { drag.current = null; }}
    >
      <div style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transition: drag.current ? "none" : "transform 0.1s" }}>
        {mode === "preview_3d" ? <Preview3D components={components} /> : <Preview2D components={components} scale={0.8} />}
      </div>
    </div>
  );
}

// ── Properties panel ──────────────────────────────────────────────────────────

function PropertiesPanel({ comp, onChange, onDup, onDel, onZ }: {
  comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void;
  onDup: () => void; onDel: () => void; onZ: (d: "up" | "down") => void;
}) {
  const num = (label: string, key: keyof CanvasComp, min?: number, max?: number) => (
    <label className="block">
      <span className="text-2xs text-soft-gray-dark font-ui block mb-1">{label}</span>
      <input type="number" min={min} max={max} className="v-input text-xs font-mono"
        value={Math.round(Number(comp[key]) || 0)}
        onChange={e => onChange({ [key]: Number(e.target.value) } as Partial<CanvasComp>)} />
    </label>
  );
  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Name</span>
        <input className="v-input text-xs" value={comp.name} onChange={e => onChange({ name: e.target.value })} />
      </label>
      {comp.type === "text" && (
        <label className="block">
          <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Text</span>
          <input className="v-input text-xs" value={comp.text ?? ""} onChange={e => onChange({ text: e.target.value })} />
        </label>
      )}
      <div className="h-px bg-warm-wood" />
      <div>
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Position (mm)</p>
        <div className="grid grid-cols-2 gap-2">{num("X", "x")}{num("Y", "y")}</div>
      </div>
      <div>
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Size (mm)</p>
        <div className="grid grid-cols-2 gap-2">{num("W", "width", 1)}{num("H", "height", 1)}</div>
      </div>
      <div className="grid grid-cols-2 gap-2">{num("Rotate °", "rotation", -360, 360)}{num("Opacity %", "opacity", 0, 100)}</div>
      {num("Quantity", "quantity", 1, 1000)}
      <div className="h-px bg-warm-wood" />
      <div className="flex gap-2">
        <button onClick={() => onZ("up")} className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood">↑ Forward</button>
        <button onClick={() => onZ("down")} className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood">↓ Back</button>
      </div>
      <div className="flex gap-2">
        <button onClick={onDup} className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood">⌘D Duplicate</button>
        <button onClick={onDel} className="flex-1 py-1.5 rounded-lg bg-crimson-ghost border border-crimson-flame/20 text-crimson-flame text-2xs font-ui hover:bg-crimson-flame hover:text-white">✕ Delete</button>
      </div>
    </div>
  );
}

// ── Style panel (nicer color picker) ──────────────────────────────────────────

const SWATCHES = ["#1a2535","#1c1a2e","#2a251a","#1e2a1c","#7c5cff","#00e5ff","#f5c451","#ff3b5c","#e8d5b8","#a8a29e","#0a0a0a","#ffffff"];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safe = value?.startsWith("#") ? value : "#1a2535";
  return (
    <div>
      <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-2">
        <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-warm-wood shrink-0" style={{ background: safe }}>
          <input type="color" value={safe} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </div>
        <input className="v-input text-xs font-mono flex-1" value={value} onChange={e => onChange(e.target.value)} />
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {SWATCHES.map(s => (
          <button key={s} onClick={() => onChange(s)} title={s}
            className={`aspect-square rounded-md border transition-transform hover:scale-110 ${value === s ? "border-emerald-glow ring-1 ring-emerald-glow" : "border-warm-wood"}`}
            style={{ background: s }} />
        ))}
      </div>
    </div>
  );
}

function StylePanel({ comp, onChange }: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  return (
    <div className="space-y-5">
      {comp.type === "text" ? (
        <>
          <ColorField label="Text Color" value={comp.textColor ?? "#e8d5b8"} onChange={v => onChange({ textColor: v })} />
          <label className="block">
            <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Font Size</span>
            <input type="number" min={6} max={120} className="v-input text-xs" value={comp.fontSize ?? 18} onChange={e => onChange({ fontSize: Number(e.target.value) })} />
          </label>
        </>
      ) : (
        <>
          <ColorField label="Fill" value={comp.fill} onChange={v => onChange({ fill: v })} />
          <div className="h-px bg-warm-wood" />
          <ColorField label="Stroke" value={comp.stroke} onChange={v => onChange({ stroke: v })} />
          <label className="block">
            <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Stroke width</span>
            <input type="number" min={0} max={20} className="v-input text-xs" value={comp.strokeWidth} onChange={e => onChange({ strokeWidth: Number(e.target.value) })} />
          </label>
          {comp.type !== "token" && (
            <label className="block">
              <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Corner radius</span>
              <input type="number" min={0} max={100} className="v-input text-xs" value={comp.cornerRadius} onChange={e => onChange({ cornerRadius: Number(e.target.value) })} />
            </label>
          )}
        </>
      )}
      <div className="h-px bg-warm-wood" />
      <div>
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Opacity</p>
        <div className="flex items-center gap-2">
          <input type="range" min={0} max={100} className="flex-1 accent-emerald-glow" value={comp.opacity} onChange={e => onChange({ opacity: Number(e.target.value) })} />
          <span className="text-2xs text-soft-gray font-mono w-8 text-right">{comp.opacity}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Assets panel ──────────────────────────────────────────────────────────────

function AssetsPanel({ onPick }: { onPick: (url: string) => void }) {
  const [url, setUrl] = useState("");
  return (
    <div className="p-3">
      <p className="text-2xs text-soft-gray-dark font-ui uppercase tracking-[0.1em] mb-3">Image Assets</p>
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <button key={i} onClick={() => onPick(`asset-${i}`)} className="aspect-square rounded-lg bg-warm-wood/30 border border-warm-wood flex items-center justify-center hover:border-emerald-glow/40 group">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-warm-wood-light group-hover:text-emerald-glow/60"><rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1"/><circle cx="5.5" cy="5.5" r="1" fill="currentColor" opacity="0.5"/><path d="M2 10.5l3-3 3 3 2-2 3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/></svg>
          </button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input className="v-input text-2xs flex-1" placeholder="Paste image URL…" value={url} onChange={e => setUrl(e.target.value)} />
        <button onClick={() => { if (url) onPick(url); }} className="px-2 rounded-lg bg-emerald-ghost border border-emerald-glow/20 text-emerald-glow text-2xs font-ui">Add</button>
      </div>
    </div>
  );
}

// ── Rules panel ───────────────────────────────────────────────────────────────

function RulesPanel({ hasEngine }: { hasEngine: boolean }) {
  return (
    <div className="space-y-3">
      <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">Game Rules</p>
      <div className="p-3 bg-warm-wood/20 rounded-lg border border-warm-wood/40">
        <p className="text-2xs text-soft-gray font-ui leading-relaxed">Define win conditions, turn order, and component effects.</p>
      </div>
      {hasEngine ? (
        <>
          {["On turn start", "On card played", "On token moved", "Win condition"].map(r => (
            <button key={r} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-warm-wood text-soft-gray text-2xs font-ui hover:border-emerald-glow/40 hover:text-parchment-light">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/><path d="M3.5 5h3M5 3.5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>{r}
            </button>
          ))}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[rgba(245,196,81,0.1)] border border-royal-gold/30 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-royal-gold"><rect x="3" y="8" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.5"/></svg>
          </div>
          <p className="text-2xs text-soft-gray font-ui leading-relaxed">The visual rule engine is available on <span className="text-royal-gold font-semibold">Pro</span> and <span className="text-royal-gold font-semibold">Studio</span>.</p>
          <Link href="/pricing" className="w-full py-2 rounded-lg bg-royal-gold/10 border border-royal-gold/30 text-royal-gold text-2xs font-ui font-semibold hover:bg-royal-gold/20">Upgrade →</Link>
        </div>
      )}
    </div>
  );
}

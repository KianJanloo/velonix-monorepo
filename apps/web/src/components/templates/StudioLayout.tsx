"use client";

import {
  useRef, useState, useCallback, useEffect,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useStudioStore, selectCanUndo, selectCanRedo, selectZoomPercent } from "@/stores/studioStore";
import { useGame, usePublishGame } from "@/hooks/useGames";
import { useStudio } from "@/hooks/useStudio";
import { usePlan } from "@/hooks/usePlan";

// ── Constants ─────────────────────────────────────────────────────────────────

const MM_TO_PX = 2;          // base pixels per mm at zoom=1
const CANVAS_W_MM = 800;     // virtual canvas width in mm
const CANVAS_H_MM = 600;     // virtual canvas height in mm
const GRID_MM = 5;           // snap grid size

// ── Types ─────────────────────────────────────────────────────────────────────

type CompType = "board" | "card" | "token" | "tile" | "die" | "pawn" | "rulebook";

export interface CanvasComp {
  id: string;
  name: string;
  type: CompType;
  x: number; y: number;        // mm from canvas top-left
  width: number; height: number; // mm
  rotation: number;             // degrees
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;              // 0-100
  visible: boolean;
  locked: boolean;
  quantity: number;
  cornerRadius: number;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const TYPE_DEFAULTS: Record<CompType, Partial<CanvasComp>> = {
  board:    { width: 300, height: 220, fill: "#1a2535", stroke: "rgba(245,196,81,0.3)", strokeWidth: 2, cornerRadius: 6 },
  card:     { width: 63,  height: 88,  fill: "#1c1a2e", stroke: "rgba(0,212,165,0.4)",  strokeWidth: 1, cornerRadius: 6 },
  token:    { width: 25,  height: 25,  fill: "#00d4a5", stroke: "rgba(245,196,81,0.6)", strokeWidth: 2, cornerRadius: 0 },
  tile:     { width: 44,  height: 44,  fill: "#1e2a1c", stroke: "rgba(0,212,165,0.3)",  strokeWidth: 1, cornerRadius: 4 },
  die:      { width: 18,  height: 18,  fill: "#f5c451", stroke: "rgba(0,0,0,0.5)",       strokeWidth: 1, cornerRadius: 4 },
  pawn:     { width: 18,  height: 32,  fill: "#ff3b5c", stroke: "rgba(0,0,0,0.4)",       strokeWidth: 1, cornerRadius: 12 },
  rulebook: { width: 148, height: 105, fill: "#2a251a", stroke: "rgba(245,196,81,0.25)", strokeWidth: 1, cornerRadius: 3 },
};

const INITIAL_COMPS: CanvasComp[] = [
  {
    id: "board-1", name: "Main Board", type: "board",
    x: 250, y: 190, ...TYPE_DEFAULTS.board,
    rotation: 0, opacity: 100, visible: true, locked: false, quantity: 1,
  } as CanvasComp,
  {
    id: "card-1", name: "Resource Card", type: "card",
    x: 100, y: 150, ...TYPE_DEFAULTS.card,
    rotation: -5, opacity: 100, visible: true, locked: false, quantity: 1,
  } as CanvasComp,
  {
    id: "card-2", name: "Action Card", type: "card",
    x: 140, y: 160, ...TYPE_DEFAULTS.card,
    fill: "#1a2535", stroke: "rgba(245,196,81,0.4)",
    rotation: 3, opacity: 100, visible: true, locked: false, quantity: 1,
    strokeWidth: 1, cornerRadius: 6,
  } as CanvasComp,
  {
    id: "token-1", name: "Victory Token", type: "token",
    x: 430, y: 260, ...TYPE_DEFAULTS.token,
    rotation: 0, opacity: 100, visible: true, locked: false, quantity: 1,
  } as CanvasComp,
  {
    id: "token-2", name: "Gold Token", type: "token",
    x: 470, y: 250, ...TYPE_DEFAULTS.token, fill: "#f5c451", stroke: "rgba(0,0,0,0.4)",
    rotation: 0, opacity: 100, visible: true, locked: false, quantity: 1,
  } as CanvasComp,
  {
    id: "pawn-1", name: "Blue Pawn", type: "pawn",
    x: 360, y: 230, ...TYPE_DEFAULTS.pawn,
    rotation: 0, opacity: 100, visible: true, locked: false, quantity: 1,
  } as CanvasComp,
];

function createComp(type: CompType, x: number, y: number): CanvasComp {
  const defaults = TYPE_DEFAULTS[type];
  return {
    id: `${type}-${Date.now()}`,
    name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    type,
    x, y,
    rotation: 0, opacity: 100, visible: true, locked: false, quantity: 1,
    fill: "#1a2535", stroke: "rgba(245,196,81,0.3)", strokeWidth: 1, cornerRadius: 4,
    width: 60, height: 80,
    ...defaults,
  } as CanvasComp;
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  { id: "select" as const, label: "Select (V)", cursor: "default",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2l4.5 10 1.8-4L13 6 2 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg> },
  { id: "hand" as const, label: "Pan (H)", cursor: "grab",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 5.5V3a1 1 0 012 0v2.5m0 0V2.5a1 1 0 012 0V5.5m0 0V3a1 1 0 012 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4V6a1 1 0 012 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: "shape_rect" as const, label: "Rectangle (R)", cursor: "crosshair",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { id: "shape_ellipse" as const, label: "Ellipse (E)", cursor: "crosshair",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><ellipse cx="7" cy="7" rx="5" ry="5" stroke="currentColor" strokeWidth="1.3"/></svg> },
  { id: "text" as const, label: "Text (T)", cursor: "text",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M7 3.5v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: "image" as const, label: "Image (I)", cursor: "copy",
    icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="4.5" cy="4.5" r="1" fill="currentColor" opacity="0.7"/><path d="M1.5 9.5l3-3 2.5 2.5 2-2 2.5 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg> },
] as const;

// ── Component icons ───────────────────────────────────────────────────────────

const COMP_ICONS: Record<CompType, React.ReactNode> = {
  board:    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M1 4.5h10M4.5 1v10" stroke="currentColor" strokeWidth="1" opacity="0.5"/></svg>,
  card:     <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="2" y="0.5" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>,
  token:    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2"/></svg>,
  tile:     <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>,
  die:      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><circle cx="4" cy="4" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/></svg>,
  pawn:     <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 11c0-1.38 1.12-2.5 2.5-2.5S8.5 9.62 8.5 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  rulebook: <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="0.5" width="10" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 4h5M3.5 6.5h5M3.5 9h3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6"/></svg>,
};

// ── CompView — renders one component on the canvas ────────────────────────────

interface CompViewProps {
  comp: CanvasComp;
  selected: boolean;
  zoom: number;
  onPointerDown: (e: ReactPointerEvent, comp: CanvasComp) => void;
}

function CompView({ comp, selected, onPointerDown }: CompViewProps) {
  const isCircle = comp.type === "token";
  const px = (mm: number) => mm * MM_TO_PX;

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, comp)}
      style={{
        position: "absolute",
        left: px(comp.x),
        top: px(comp.y),
        width: px(comp.width),
        height: px(comp.height),
        transform: `rotate(${comp.rotation}deg)`,
        transformOrigin: "center",
        opacity: comp.opacity / 100,
        backgroundColor: comp.fill,
        border: `${comp.strokeWidth}px solid ${comp.stroke}`,
        borderRadius: isCircle ? "50%" : comp.cornerRadius,
        cursor: comp.locked ? "not-allowed" : "move",
        boxSizing: "border-box",
        userSelect: "none",
        outline: selected ? "2px solid #00d4a5" : "none",
        outlineOffset: "2px",
        boxShadow: selected
          ? "0 0 0 1px rgba(0,212,165,0.3), 0 4px 20px rgba(0,0,0,0.6)"
          : "0 2px 8px rgba(0,0,0,0.5)",
        display: comp.visible ? "block" : "none",
        overflow: "hidden",
      }}
    >
      {/* Inner pattern for board */}
      {comp.type === "board" && (
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,229,255,0.04) 1px,transparent 1px), linear-gradient(90deg,rgba(0,229,255,0.04) 1px,transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
      )}
      {/* Die dots */}
      {comp.type === "die" && (
        <div style={{ position: "absolute", inset: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: "50%", backgroundColor: "rgba(0,0,0,0.7)" }} />)}
        </div>
      )}
      {/* Rulebook lines */}
      {comp.type === "rulebook" && (
        <div style={{ position: "absolute", inset: "8px 10px", display: "flex", flexDirection: "column", gap: 4 }}>
          {[80,70,60,50,40,70].map((w, i) => (
            <div key={i} style={{ height: 1.5, width: `${w}%`, backgroundColor: "rgba(245,196,81,0.2)", borderRadius: 1 }} />
          ))}
        </div>
      )}

      {/* Selection corner handles */}
      {selected && (
        <>
          {[
            { top: -4, left: -4 }, { top: -4, right: -4 },
            { bottom: -4, left: -4 }, { bottom: -4, right: -4 },
          ].map((pos, i) => (
            <div key={i} style={{
              position: "absolute", ...pos,
              width: 8, height: 8, backgroundColor: "#00d4a5",
              border: "1.5px solid #0a0a0a", borderRadius: 1,
              cursor: "nwse-resize", zIndex: 10,
            }} />
          ))}
        </>
      )}
    </div>
  );
}

// ── 3D CSS preview ────────────────────────────────────────────────────────────

function Preview3D({ components }: { components: CanvasComp[] }) {
  const px = (mm: number) => mm * 1.4;
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0c0c0c]"
      style={{ perspective: "900px" }}>
      <div style={{
        position: "relative",
        width: px(CANVAS_W_MM * 0.6), height: px(CANVAS_H_MM * 0.6),
        transform: "rotateX(48deg) rotateZ(-5deg)",
        transformStyle: "preserve-3d",
      }}>
        {/* Table surface */}
        <div style={{
          position: "absolute", inset: -40,
          backgroundColor: "#1c140f",
          backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px)",
          transform: "translateZ(-4px)",
          borderRadius: 4,
        }} />
        {/* Components in 3D */}
        {components.filter(c => c.visible).map(c => (
          <div key={c.id} style={{
            position: "absolute",
            left: px(c.x * 0.6), top: px(c.y * 0.6),
            width: px(c.width * 0.6), height: px(c.height * 0.6),
            backgroundColor: c.fill,
            border: `${c.strokeWidth}px solid ${c.stroke}`,
            borderRadius: c.type === "token" ? "50%" : c.cornerRadius,
            transform: `translateZ(${c.type === "token" ? 6 : c.type === "card" ? 4 : 2}px) rotate(${c.rotation}deg)`,
            boxShadow: `0 ${c.type === "token" ? 8 : 4}px ${c.type === "token" ? 16 : 8}px rgba(0,0,0,0.7)`,
            opacity: c.opacity / 100,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Preview 2D ────────────────────────────────────────────────────────────────

function Preview2D({ components }: { components: CanvasComp[] }) {
  const px = (mm: number) => mm * MM_TO_PX * 0.6;
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#0c0c0c]">
      <div style={{
        position: "relative",
        width: px(CANVAS_W_MM), height: px(CANVAS_H_MM),
        backgroundColor: "#111", border: "1px solid rgba(58,42,31,0.5)",
      }}>
        {components.filter(c => c.visible).map(c => (
          <div key={c.id} style={{
            position: "absolute",
            left: px(c.x), top: px(c.y), width: px(c.width), height: px(c.height),
            backgroundColor: c.fill, border: `${c.strokeWidth}px solid ${c.stroke}`,
            borderRadius: c.type === "token" ? "50%" : c.cornerRadius * 0.6,
            transform: `rotate(${c.rotation}deg)`, opacity: c.opacity / 100,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── StudioLayout ──────────────────────────────────────────────────────────────

interface StudioLayoutProps { gameId: string; }

export function StudioLayout({ gameId }: StudioLayoutProps) {
  const isNew = gameId === "new";

  // Zustand store
  const {
    activeTool, setTool, mode, setMode,
    leftPanelTab, setLeftPanelTab, rightPanelTab, setRightPanelTab,
    showGrid, toggleGrid, snapToGrid, toggleSnap,
    isDirty, isSaving, zoomIn, zoomOut, resetZoom,
    markDirty,
  } = useStudioStore();
  const canUndo = useStudioStore(selectCanUndo);
  const canRedo = useStudioStore(selectCanRedo);
  const zoomPercent = useStudioStore(selectZoomPercent);
  const storeZoom = useStudioStore(s => s.viewport.zoom);
  const { saveNow } = useStudio(gameId);
  const plan = usePlan();
  // Rule engine is a Pro+ feature (team collaboration tier and up)
  const hasRuleEngine = plan.hasTeamCollaboration;

  // Canvas state
  const [components, setComponents] = useState<CanvasComp[]>(INITIAL_COMPS);
  const [selectedId, setSelectedId] = useState<string | null>("board-1");
  const [panX, setPanX] = useState(40);
  const [panY, setPanY] = useState(40);

  // UI state
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

  // API hooks
  const { data: game } = useGame(isNew ? "" : gameId);
  const publish = usePublishGame(gameId);

  // Drag state (ref to avoid re-renders during drag)
  const dragRef = useRef<{
    active: boolean;
    kind: "comp" | "pan" | "canvas";
    compId?: string;
    startClientX: number; startClientY: number;
    startCompX?: number; startCompY?: number;
    startPanX?: number; startPanY?: number;
  }>({ active: false, kind: "canvas", startClientX: 0, startClientY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  const selectedComp = components.find(c => c.id === selectedId) ?? null;

  // ── Actions ────────────────────────────────────────────────────────────────

  const addComp = useCallback((type: CompType) => {
    const c = createComp(type, 50 + Math.random() * 100, 50 + Math.random() * 80);
    setComponents(prev => [...prev, c]);
    setSelectedId(c.id);
    setShowAddMenu(false);
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setComponents(prev => prev.filter(c => c.id !== selectedId));
    setSelectedId(null);
  }, [selectedId]);

  const updateComp = useCallback((id: string, patch: Partial<CanvasComp>) => {
    setComponents(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const moveCompZ = useCallback((id: string, dir: "up" | "down") => {
    setComponents(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      if (dir === "up" && idx < next.length - 1) {
        [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
      } else if (dir === "down" && idx > 0) {
        [next[idx], next[idx - 1]] = [next[idx - 1]!, next[idx]!];
      }
      return next;
    });
  }, []);

  const duplicateSelected = useCallback(() => {
    if (!selectedComp) return;
    const c = { ...selectedComp, id: `${selectedComp.type}-${Date.now()}`, x: selectedComp.x + 10, y: selectedComp.y + 10 };
    setComponents(prev => [...prev, c]);
    setSelectedId(c.id);
  }, [selectedComp]);

  // ── Pointer events ─────────────────────────────────────────────────────────

  const onCompPointerDown = useCallback((e: ReactPointerEvent, comp: CanvasComp) => {
    if (comp.locked) return;
    e.stopPropagation();
    setSelectedId(comp.id);
    if (activeTool !== "select") return;
    dragRef.current = {
      active: true, kind: "comp", compId: comp.id,
      startClientX: e.clientX, startClientY: e.clientY,
      startCompX: comp.x, startCompY: comp.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [activeTool]);

  const onCanvasPointerDown = useCallback((e: ReactPointerEvent) => {
    if (e.target === e.currentTarget || activeTool === "hand") {
      setSelectedId(null);
      if (activeTool === "hand") {
        dragRef.current = {
          active: true, kind: "pan",
          startClientX: e.clientX, startClientY: e.clientY,
          startPanX: panX, startPanY: panY,
        };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
  }, [activeTool, panX, panY]);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    const dr = dragRef.current;
    if (!dr.active) return;
    const dx = e.clientX - dr.startClientX;
    const dy = e.clientY - dr.startClientY;

    if (dr.kind === "comp" && dr.compId && dr.startCompX !== undefined && dr.startCompY !== undefined) {
      const zoom = storeZoom;
      let nx = dr.startCompX + dx / (zoom * MM_TO_PX);
      let ny = dr.startCompY + dy / (zoom * MM_TO_PX);
      if (snapToGrid) {
        nx = Math.round(nx / GRID_MM) * GRID_MM;
        ny = Math.round(ny / GRID_MM) * GRID_MM;
      }
      // Clamp to canvas bounds
      const comp = components.find(c => c.id === dr.compId);
      if (comp) {
        nx = Math.max(0, Math.min(nx, CANVAS_W_MM - comp.width));
        ny = Math.max(0, Math.min(ny, CANVAS_H_MM - comp.height));
      }
      setComponents(prev => prev.map(c => c.id === dr.compId ? { ...c, x: nx, y: ny } : c));
    } else if (dr.kind === "pan" && dr.startPanX !== undefined && dr.startPanY !== undefined) {
      setPanX(dr.startPanX + dx);
      setPanY(dr.startPanY + dy);
    }
  }, [storeZoom, snapToGrid, components]);

  const onPointerUp = useCallback(() => {
    dragRef.current.active = false;
  }, []);

  // ── Wheel zoom ─────────────────────────────────────────────────────────────

  const onWheel = useCallback((e: ReactWheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    if (delta > 0) zoomIn(); else zoomOut();
  }, [zoomIn, zoomOut]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  const onKeyDown = useCallback((e: ReactKeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
    if (e.key === "Delete" || e.key === "Backspace") deleteSelected();
    if (e.key === "Escape") setSelectedId(null);
    if (e.key === "v" || e.key === "V") setTool("select");
    if (e.key === "h" || e.key === "H") setTool("hand");
    if (e.key === "r" || e.key === "R") setTool("shape_rect");
    if ((e.metaKey || e.ctrlKey) && e.key === "d") { e.preventDefault(); duplicateSelected(); }
    if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); void handleSave(); }
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") { e.preventDefault(); useStudioStore.getState().undo(); }
    if ((e.metaKey || e.ctrlKey) && (e.shiftKey && e.key === "z" || e.key === "y")) { e.preventDefault(); useStudioStore.getState().redo(); }
    if (e.key === "[" && selectedId) moveCompZ(selectedId, "down");
    if (e.key === "]" && selectedId) moveCompZ(selectedId, "up");
    // Arrow nudge
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key) && selectedComp) {
      e.preventDefault();
      const step = e.shiftKey ? GRID_MM : 1;
      const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
      const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
      updateComp(selectedComp.id, { x: selectedComp.x + dx, y: selectedComp.y + dy });
    }
  }, [deleteSelected, setTool, duplicateSelected, saveNow, selectedId, moveCompZ, selectedComp, updateComp]);

  // ── Dirty tracking ───────────────────────────────────────────────────────
  // Mark the project dirty whenever the component set changes (skip first mount).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    markDirty();
  }, [components, markDirty]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (isNew) { toast.error("Create the game first."); return; }
    await saveNow({ components } as unknown as Record<string, unknown>);
  }, [isNew, saveNow, components]);

  // ── Publish ────────────────────────────────────────────────────────────────

  async function handlePublish() {
    // Persist latest design before submitting for review
    if (!isNew) await saveNow({ components } as unknown as Record<string, unknown>);
    try {
      await publish.mutateAsync();
      toast.success("Submitted for review!");
    } catch {
      toast.error("Publish failed. Try again.");
    }
  }

  // ── Active tool cursor ─────────────────────────────────────────────────────

  const toolCursor = TOOLS.find(t => t.id === activeTool)?.cursor ?? "default";

  // ── Sorted layers (bottom → top) ───────────────────────────────────────────

  const reversedLayers = [...components].reverse();

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col h-screen bg-deep-void overflow-hidden"
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{ outline: "none" }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <header className="h-11 bg-rich-wood-dark border-b border-warm-wood flex items-center px-2 gap-1 shrink-0 z-50 overflow-x-auto">
        {/* Back + title */}
        <Link href="/dashboard" title="Dashboard" className="font-display text-royal-gold text-sm font-bold mr-1 hover:text-royal-gold-bright transition-colors shrink-0">
          ✦
        </Link>
        <span className="text-2xs text-soft-gray font-ui truncate max-w-[120px] hidden sm:block mr-1 shrink-0">
          {game?.title ?? (isNew ? "New Game" : gameId.slice(0, 8))}
        </span>
        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        {/* Tools */}
        {TOOLS.map(t => (
          <button key={t.id} title={t.label} onClick={() => setTool(t.id)}
            className={`v-tool-btn shrink-0 ${activeTool === t.id ? "active" : ""}`}>
            {t.icon}
          </button>
        ))}
        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        {/* Undo/Redo */}
        <button title="Undo (⌘Z)" disabled={!canUndo} className="v-tool-btn disabled:opacity-30 shrink-0" onClick={() => useStudioStore.getState().undo()}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M3 8A4 4 0 019 4h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M3 4.5l-.5 3.5L6 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button title="Redo (⌘⇧Z)" disabled={!canRedo} className="v-tool-btn disabled:opacity-30 shrink-0" onClick={() => useStudioStore.getState().redo()}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M10 8A4 4 0 004 4H2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 4.5l.5 3.5L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        {/* Grid / Snap */}
        <button title={showGrid ? "Hide Grid (G)" : "Show Grid (G)"} onClick={toggleGrid} className={`v-tool-btn shrink-0 ${showGrid ? "active" : ""}`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 4.5h11M1 8.5h11M4.5 1v11M8.5 1v11" stroke="currentColor" strokeWidth="1.2"/></svg>
        </button>
        <button title={snapToGrid ? "Snap On" : "Snap Off"} onClick={toggleSnap} className={`v-tool-btn shrink-0 ${snapToGrid ? "active" : ""}`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>

        {/* Panel toggles (mobile) */}
        <button title="Layers" onClick={() => setLeftOpen(v => !v)} className={`v-tool-btn shrink-0 lg:hidden ${leftOpen ? "active" : ""}`}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="1" y="1" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1h5M7 5h5M7 9h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </button>

        {/* Mode selector */}
        <div className="ml-auto flex items-center gap-0.5 bg-warm-wood rounded-lg p-0.5 shrink-0">
          {(["design","preview_2d","preview_3d"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold transition-all ${mode === m ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}>
              {m === "design" ? "Design" : m === "preview_2d" ? "Preview" : "3D"}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-0.5 mx-1.5 shrink-0">
          <button onClick={zoomOut} className="v-tool-btn font-mono text-xs">−</button>
          <button onClick={resetZoom} className="font-mono text-2xs text-soft-gray bg-warm-wood px-1.5 py-1 rounded min-w-[40px] text-center hover:text-parchment-light transition-colors">
            {zoomPercent}%
          </button>
          <button onClick={zoomIn} className="v-tool-btn font-mono text-xs">+</button>
        </div>

        {/* Save + Publish */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-2xs font-ui hidden md:inline ${isSaving ? "text-royal-gold" : isDirty ? "text-soft-gray-dark" : "text-emerald-glow"}`}>
            {isSaving ? "Saving…" : isDirty ? "Unsaved" : "Saved"}
          </span>
          <button onClick={() => void handleSave()} className="v-tool-btn text-2xs font-ui px-2" title="Save (⌘S)">Save</button>
          <button onClick={handlePublish} disabled={publish.isPending || game?.status === "reviewing"}
            className="px-3 py-1 rounded-md bg-emerald-glow text-deep-void text-xs font-ui font-bold hover:bg-emerald-bright transition-colors disabled:opacity-50">
            {game?.status === "reviewing" ? "In Review" : "Publish"}
          </button>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel ───────────────────────────────────────────────── */}
        <aside className={`${leftOpen ? "w-52" : "w-0"} bg-rich-wood-dark border-r border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200`}>
          {/* Tabs */}
          <div className="flex border-b border-warm-wood shrink-0">
            {(["layers","components","assets"] as const).map(tab => (
              <button key={tab} onClick={() => setLeftPanelTab(tab)}
                className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase transition-colors border-b-2 -mb-px ${leftPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}>
                {tab === "layers" ? "Layers" : tab === "components" ? "Parts" : "Assets"}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Layers */}
            {leftPanelTab === "layers" && (
              <div className="p-1.5">
                {reversedLayers.map((c) => (
                  <div key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`flex items-center gap-2 px-2 py-2 rounded-lg mb-0.5 cursor-pointer group transition-colors ${selectedId === c.id ? "bg-emerald-ghost text-emerald-glow" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"}`}>
                    <span className="opacity-60 shrink-0">{COMP_ICONS[c.type]}</span>
                    <span className="text-2xs font-ui truncate flex-1">{c.name}</span>
                    {/* Visibility toggle */}
                    <button onClick={e => { e.stopPropagation(); updateComp(c.id, { visible: !c.visible }); }}
                      className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-parchment-light transition-all"
                      title={c.visible ? "Hide" : "Show"}>
                      {c.visible
                        ? <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 6c1.5-3 9-3 10 0-1.5 3-9 3-10 0z" stroke="currentColor" strokeWidth="1.2"/></svg>
                        : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M1 6c1.5-3 9-3 10 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      }
                    </button>
                    {/* Lock toggle */}
                    <button onClick={e => { e.stopPropagation(); updateComp(c.id, { locked: !c.locked }); }}
                      className={`opacity-0 group-hover:opacity-100 transition-all ${c.locked ? "text-royal-gold opacity-100!" : "text-soft-gray-dark hover:text-parchment-light"}`}
                      title={c.locked ? "Unlock" : "Lock"}>
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        {c.locked
                          ? <><rect x="2" y="5.5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.2"/></>
                          : <><rect x="2" y="5.5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M4 5.5V4a2 2 0 014 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></>
                        }
                      </svg>
                    </button>
                  </div>
                ))}
                {components.length === 0 && (
                  <p className="text-2xs text-soft-gray-dark font-ui px-3 py-6 text-center">No components yet</p>
                )}
              </div>
            )}

            {/* Components type picker */}
            {leftPanelTab === "components" && (
              <div className="p-1.5">
                <p className="text-2xs text-soft-gray-dark font-ui px-2 py-2 uppercase tracking-[0.1em]">Add to canvas</p>
                {(["board","card","token","tile","die","pawn","rulebook"] as CompType[]).map(type => (
                  <button key={type} onClick={() => addComp(type)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg hover:bg-warm-wood text-soft-gray hover:text-parchment-light transition-colors mb-0.5 group">
                    <span className="group-hover:text-emerald-glow transition-colors">{COMP_ICONS[type]}</span>
                    <span className="text-2xs font-ui capitalize">{type}</span>
                    <span className="ml-auto text-warm-wood-light text-2xs font-mono hidden group-hover:inline">
                      {TYPE_DEFAULTS[type].width}×{TYPE_DEFAULTS[type].height}mm
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Assets */}
            {leftPanelTab === "assets" && (
              <div className="p-3">
                <p className="text-2xs text-soft-gray-dark font-ui uppercase tracking-[0.1em] mb-3">Image Assets</p>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div key={idx} className="aspect-square rounded-lg bg-warm-wood/30 border border-warm-wood flex items-center justify-center cursor-pointer hover:border-emerald-glow/40 transition-colors group">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-warm-wood-light group-hover:text-emerald-glow/60 transition-colors">
                        <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="1"/>
                        <circle cx="5.5" cy="5.5" r="1" fill="currentColor" opacity="0.5"/>
                        <path d="M2 10.5l3-3 3 3 2-2 3 3" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
                      </svg>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2 rounded-lg border border-dashed border-warm-wood text-soft-gray-dark text-2xs font-ui hover:border-emerald-glow/40 hover:text-emerald-glow transition-colors">
                  + Import Image
                </button>
              </div>
            )}
          </div>

          {/* Add component button */}
          <div className="p-2 border-t border-warm-wood shrink-0 relative">
            <button onClick={() => setShowAddMenu(v => !v)}
              className="w-full py-2 rounded-lg bg-emerald-ghost border border-emerald-glow/20 text-emerald-glow text-2xs font-ui font-semibold hover:bg-emerald-glow hover:text-deep-void transition-all">
              + Add Component
            </button>
            {showAddMenu && (
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-rich-wood-dark border border-warm-wood rounded-xl shadow-2xl z-50 overflow-hidden">
                {(["board","card","token","tile","die","pawn","rulebook"] as CompType[]).map(type => (
                  <button key={type} onClick={() => addComp(type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-warm-wood text-soft-gray hover:text-parchment-light transition-colors capitalize text-sm font-ui text-left">
                    <span>{COMP_ICONS[type]}</span>{type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Canvas ─────────────────────────────────────────────────────── */}
        <main
          ref={containerRef}
          className="flex-1 relative overflow-hidden"
          style={{ cursor: activeTool === "hand" ? "grab" : toolCursor, backgroundColor: "#0c0c0c" }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          {mode === "preview_3d" ? (
            <Preview3D components={components} />
          ) : mode === "preview_2d" ? (
            <Preview2D components={components} />
          ) : (
            <>
              {/* Grid background */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none" style={{
                  backgroundImage: "linear-gradient(rgba(58,42,31,0.4) 1px,transparent 1px), linear-gradient(90deg,rgba(58,42,31,0.4) 1px,transparent 1px)",
                  backgroundSize: `${GRID_MM * MM_TO_PX * storeZoom}px ${GRID_MM * MM_TO_PX * storeZoom}px`,
                  backgroundPosition: `${panX % (GRID_MM * MM_TO_PX * storeZoom)}px ${panY % (GRID_MM * MM_TO_PX * storeZoom)}px`,
                }} />
              )}

              {/* World transform container */}
              <div style={{
                position: "absolute",
                transformOrigin: "0 0",
                transform: `translate(${panX}px,${panY}px) scale(${storeZoom})`,
              }}>
                {/* Canvas background */}
                <div style={{
                  position: "relative",
                  width: CANVAS_W_MM * MM_TO_PX,
                  height: CANVAS_H_MM * MM_TO_PX,
                  backgroundColor: "#111214",
                  border: "1px solid rgba(58,42,31,0.6)",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
                }}>
                  {/* Canvas label */}
                  <div style={{ position: "absolute", top: -20, left: 0, color: "rgba(168,162,158,0.4)", fontSize: 10, fontFamily: "monospace", userSelect: "none" }}>
                    {CANVAS_W_MM} × {CANVAS_H_MM} mm
                  </div>

                  {/* Components */}
                  {components.map(c => (
                    <CompView
                      key={c.id}
                      comp={c}
                      selected={selectedId === c.id}
                      zoom={storeZoom}
                      onPointerDown={onCompPointerDown}
                    />
                  ))}
                </div>
              </div>

              {/* Coordinates overlay */}
              <div className="absolute bottom-3 left-3 text-2xs text-soft-gray-dark font-mono bg-rich-wood-dark/80 rounded px-2 py-1 pointer-events-none">
                {selectedComp
                  ? `${selectedComp.name} · ${Math.round(selectedComp.x)}, ${Math.round(selectedComp.y)} mm`
                  : `${CANVAS_W_MM} × ${CANVAS_H_MM} mm canvas`
                }
              </div>

              {/* Keyboard hint */}
              <div className="absolute bottom-3 right-3 text-2xs text-soft-gray-dark font-ui bg-rich-wood-dark/70 rounded px-2 py-1 pointer-events-none hidden lg:block">
                ⌘S save · Del remove · [ ] reorder · ⌘D duplicate
              </div>
            </>
          )}

          {/* Panel collapse toggles (desktop) */}
          <button onClick={() => setLeftOpen(v => !v)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-l-0 border-warm-wood rounded-r-lg items-center justify-center text-soft-gray hover:text-parchment-light transition-colors z-10 hidden lg:flex">
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
              <path d={leftOpen ? "M5.5 1L2 5l3.5 4" : "M1.5 1L5 5l-3.5 4"} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => setRightOpen(v => !v)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-r-0 border-warm-wood rounded-l-lg items-center justify-center text-soft-gray hover:text-parchment-light transition-colors z-10 hidden lg:flex">
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
              <path d={rightOpen ? "M1.5 1L5 5l-3.5 4" : "M5.5 1L2 5l3.5 4"} stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </main>

        {/* ── Right panel ──────────────────────────────────────────────────── */}
        <aside className={`${rightOpen ? "w-56" : "w-0"} bg-rich-wood-dark border-l border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200`}>
          <div className="flex border-b border-warm-wood shrink-0">
            {(["properties","styling","rules"] as const).map(tab => (
              <button key={tab} onClick={() => setRightPanelTab(tab)}
                className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase transition-colors border-b-2 -mb-px ${rightPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}>
                {tab === "properties" ? "Props" : tab === "styling" ? "Style" : "Rules"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {/* Properties */}
            {rightPanelTab === "properties" && !selectedComp && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-soft-gray-dark">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p className="text-2xs text-soft-gray-dark font-ui">Select a component</p>
              </div>
            )}
            {rightPanelTab === "properties" && selectedComp && (
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">Name</label>
                  <input className="v-input text-xs" value={selectedComp.name}
                    onChange={e => updateComp(selectedComp.id, { name: e.target.value })} />
                </div>
                <div className="h-px bg-warm-wood" />
                {/* Position */}
                <div>
                  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Position (mm)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-2xs text-soft-gray-dark font-ui block mb-1">X</span>
                      <input type="number" className="v-input text-xs font-mono"
                        value={Math.round(selectedComp.x)}
                        onChange={e => updateComp(selectedComp.id, { x: Number(e.target.value) })} />
                    </label>
                    <label className="block">
                      <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Y</span>
                      <input type="number" className="v-input text-xs font-mono"
                        value={Math.round(selectedComp.y)}
                        onChange={e => updateComp(selectedComp.id, { y: Number(e.target.value) })} />
                    </label>
                  </div>
                </div>
                {/* Size */}
                <div>
                  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Size (mm)</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-2xs text-soft-gray-dark font-ui block mb-1">W</span>
                      <input type="number" min={1} className="v-input text-xs font-mono"
                        value={selectedComp.width}
                        onChange={e => updateComp(selectedComp.id, { width: Number(e.target.value) })} />
                    </label>
                    <label className="block">
                      <span className="text-2xs text-soft-gray-dark font-ui block mb-1">H</span>
                      <input type="number" min={1} className="v-input text-xs font-mono"
                        value={selectedComp.height}
                        onChange={e => updateComp(selectedComp.id, { height: Number(e.target.value) })} />
                    </label>
                  </div>
                </div>
                {/* Rotation + Opacity */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Rotate (°)</span>
                    <input type="number" min={-360} max={360} className="v-input text-xs font-mono"
                      value={selectedComp.rotation}
                      onChange={e => updateComp(selectedComp.id, { rotation: Number(e.target.value) })} />
                  </label>
                  <label className="block">
                    <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Opacity (%)</span>
                    <input type="number" min={0} max={100} className="v-input text-xs font-mono"
                      value={selectedComp.opacity}
                      onChange={e => updateComp(selectedComp.id, { opacity: Number(e.target.value) })} />
                  </label>
                </div>
                {/* Quantity */}
                <label className="block">
                  <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Quantity</span>
                  <input type="number" min={1} max={1000} className="v-input text-xs font-mono"
                    value={selectedComp.quantity}
                    onChange={e => updateComp(selectedComp.id, { quantity: Number(e.target.value) })} />
                </label>
                <div className="h-px bg-warm-wood" />
                {/* Actions */}
                <div className="flex gap-2">
                  <button onClick={() => moveCompZ(selectedComp.id, "up")} className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood transition-colors" title="Bring Forward ([)">↑ Forward</button>
                  <button onClick={() => moveCompZ(selectedComp.id, "down")} className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood transition-colors" title="Send Back (])">↓ Back</button>
                </div>
                <div className="flex gap-2">
                  <button onClick={duplicateSelected} className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood transition-colors" title="Duplicate (⌘D)">⌘ Duplicate</button>
                  <button onClick={deleteSelected} className="flex-1 py-1.5 rounded-lg bg-crimson-ghost border border-crimson-flame/20 text-crimson-flame text-2xs font-ui hover:bg-crimson-flame hover:text-white transition-colors" title="Delete (Del)">✕ Delete</button>
                </div>
              </div>
            )}

            {/* Styling */}
            {rightPanelTab === "styling" && !selectedComp && (
              <p className="text-2xs text-soft-gray-dark font-ui py-8 text-center">Select a component</p>
            )}
            {rightPanelTab === "styling" && selectedComp && (
              <div className="space-y-4">
                <div>
                  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Fill</p>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-8 h-8 rounded border border-warm-wood cursor-pointer bg-transparent"
                      value={selectedComp.fill.startsWith("#") ? selectedComp.fill : "#1a2535"}
                      onChange={e => updateComp(selectedComp.id, { fill: e.target.value })} />
                    <input className="v-input text-xs font-mono flex-1" value={selectedComp.fill}
                      onChange={e => updateComp(selectedComp.id, { fill: e.target.value })} />
                  </div>
                </div>
                <div>
                  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Stroke</p>
                  <div className="flex items-center gap-2 mb-2">
                    <input type="color" className="w-8 h-8 rounded border border-warm-wood cursor-pointer bg-transparent"
                      value={selectedComp.stroke.startsWith("#") ? selectedComp.stroke : "#f5c451"}
                      onChange={e => updateComp(selectedComp.id, { stroke: e.target.value })} />
                    <input className="v-input text-xs font-mono flex-1" value={selectedComp.stroke}
                      onChange={e => updateComp(selectedComp.id, { stroke: e.target.value })} />
                  </div>
                  <label className="block">
                    <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Width (px)</span>
                    <input type="number" min={0} max={20} className="v-input text-xs"
                      value={selectedComp.strokeWidth}
                      onChange={e => updateComp(selectedComp.id, { strokeWidth: Number(e.target.value) })} />
                  </label>
                </div>
                <div className="h-px bg-warm-wood" />
                <div>
                  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Opacity</p>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} className="flex-1 accent-emerald-glow"
                      value={selectedComp.opacity}
                      onChange={e => updateComp(selectedComp.id, { opacity: Number(e.target.value) })} />
                    <span className="text-2xs text-soft-gray font-mono w-8 text-right">{selectedComp.opacity}%</span>
                  </div>
                </div>
                {selectedComp.type !== "token" && (
                  <div>
                    <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Corner Radius</p>
                    <input type="number" min={0} max={100} className="v-input text-xs"
                      value={selectedComp.cornerRadius}
                      onChange={e => updateComp(selectedComp.id, { cornerRadius: Number(e.target.value) })} />
                  </div>
                )}
              </div>
            )}

            {/* Rules */}
            {rightPanelTab === "rules" && (
              <div className="space-y-3">
                <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">Game Rules</p>
                <div className="p-3 bg-warm-wood/20 rounded-lg border border-warm-wood/40">
                  <p className="text-2xs text-soft-gray font-ui leading-relaxed">Define win conditions, turn order, and component effects using the visual rule engine.</p>
                </div>
                {hasRuleEngine ? (
                  <>
                    {["On turn start", "On card played", "On token moved", "Win condition"].map(rule => (
                      <button key={rule} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-warm-wood text-soft-gray text-2xs font-ui hover:border-emerald-glow/40 hover:text-parchment-light transition-colors">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/><path d="M3.5 5h3M5 3.5v3" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                        {rule}
                      </button>
                    ))}
                    <button className="w-full py-2 rounded-lg bg-emerald-ghost border border-emerald-glow/20 text-emerald-glow text-2xs font-ui font-semibold hover:bg-emerald-glow hover:text-deep-void transition-colors">
                      + Add Rule
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-[rgba(245,196,81,0.1)] border border-royal-gold/30 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-royal-gold"><rect x="3" y="8" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 8V5.5a3 3 0 016 0V8" stroke="currentColor" strokeWidth="1.5"/></svg>
                    </div>
                    <p className="text-2xs text-soft-gray font-ui leading-relaxed">The visual rule engine is available on the <span className="text-royal-gold font-semibold">Pro</span> and <span className="text-royal-gold font-semibold">Studio</span> plans.</p>
                    <Link href="/pricing" className="w-full py-2 rounded-lg bg-royal-gold/10 border border-royal-gold/30 text-royal-gold text-2xs font-ui font-semibold hover:bg-royal-gold/20 transition-colors">
                      Upgrade to Pro →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <footer className="h-6 bg-rich-wood-dark border-t border-warm-wood flex items-center px-4 gap-3 shrink-0">
        <span className="text-2xs text-soft-gray-dark font-mono truncate max-w-[120px]" title={gameId}>{gameId.slice(0,12)}</span>
        <span className="text-warm-wood">·</span>
        <span className="text-2xs text-soft-gray-dark font-mono">{components.length} components</span>
        <span className="text-warm-wood">·</span>
        <span className="text-2xs text-emerald-glow font-mono font-semibold capitalize">{mode.replace("_"," ")}</span>
        {selectedComp && <>
          <span className="text-warm-wood">·</span>
          <span className="text-2xs text-parchment-mid font-mono">{selectedComp.name} · {Math.round(selectedComp.x)},{Math.round(selectedComp.y)}</span>
        </>}
        <div className="ml-auto text-2xs text-soft-gray-dark font-mono">{zoomPercent}%</div>
      </footer>
    </div>
  );
}

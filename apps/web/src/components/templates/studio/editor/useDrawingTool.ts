"use client";

import { useState, useRef, useCallback } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
// import { MM_TO_PX } from "../core";
import type { DrawingStroke, DrawingTool } from "../core";

// ── Default settings per tool ─────────────────────────────────────────────────

export const DRAW_TOOL_DEFAULTS: Record<
  DrawingTool,
  { width: number; opacity: number; color: string }
> = {
  pencil:      { width: 2,  opacity: 1,    color: "#f5c451" },
  highlighter: { width: 12, opacity: 0.35, color: "#7c5cff" },
  eraser:      { width: 16, opacity: 1,    color: "#transparent" },
  arrow:       { width: 2,  opacity: 1,    color: "#ff3b5c" },
  rect:        { width: 2,  opacity: 1,    color: "#3ddc97" },
};

export interface DrawState {
  activeTool: DrawingTool | null;
  color: string;
  width: number;
  opacity: number;
  strokes: DrawingStroke[];
  activeStroke: DrawingStroke | null;
}

export interface DrawActions {
  setDrawTool: (t: DrawingTool | null) => void;
  setDrawColor: (c: string) => void;
  setDrawWidth: (w: number) => void;
  setDrawOpacity: (o: number) => void;
  clearStrokes: (pageId: string) => void;
  undoLastStroke: (pageId: string) => void;
  onDrawPointerDown: (e: ReactPointerEvent, pageId: string, panX: number, panY: number, zoom: number) => void;
  onDrawPointerMove: (e: ReactPointerEvent, pageId: string, panX: number, panY: number, zoom: number) => void;
  onDrawPointerUp: (pageId: string) => void;
  applyRemoteStroke: (stroke: DrawingStroke) => void;
  applyRemoteClear: (pageId: string) => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useDrawingTool(
  broadcastDraw: ((event: string, payload: unknown) => void) | null,
): DrawState & DrawActions {
  const [activeTool, setActiveToolState] = useState<DrawingTool | null>(null);
  const [color, setColor] = useState(DRAW_TOOL_DEFAULTS.pencil.color);
  const [width, setWidth] = useState(DRAW_TOOL_DEFAULTS.pencil.width);
  const [opacity, setOpacity] = useState(DRAW_TOOL_DEFAULTS.pencil.opacity);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [activeStroke, setActiveStroke] = useState<DrawingStroke | null>(null);

  const drawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawingStroke | null>(null);

  // Convert screen coords → canvas-relative px (accounting for pan + zoom)
  const screenToCanvas = (
    clientX: number,
    clientY: number,
    canvasRect: DOMRect,
    panX: number,
    panY: number,
    zoom: number,
  ) => {
    const x = (clientX - canvasRect.left - panX) / zoom;
    const y = (clientY - canvasRect.top - panY) / zoom;
    return { x, y };
  };

  const setDrawTool = useCallback((t: DrawingTool | null) => {
    setActiveToolState(t);
    if (t && DRAW_TOOL_DEFAULTS[t]) {
      const d = DRAW_TOOL_DEFAULTS[t];
      setColor(d.color);
      setWidth(d.width);
      setOpacity(d.opacity);
    }
  }, []);

  const clearStrokes = useCallback((pageId: string) => {
    setStrokes((prev) => prev.filter((s) => s.pageId !== pageId));
    broadcastDraw?.("studio:draw-clear", { pageId });
  }, [broadcastDraw]);

  const undoLastStroke = useCallback((pageId: string) => {
    setStrokes((prev) => {
      const pageStrokes = prev.filter((s) => s.pageId === pageId);
      if (pageStrokes.length === 0) return prev;
      const last = pageStrokes[pageStrokes.length - 1]!;
      return prev.filter((s) => s.id !== last.id);
    });
  }, []);

  const applyRemoteStroke = useCallback((stroke: DrawingStroke) => {
    setStrokes((prev) => {
      if (prev.some((s) => s.id === stroke.id)) return prev;
      return [...prev, stroke];
    });
  }, []);

  const applyRemoteClear = useCallback((pageId: string) => {
    setStrokes((prev) => prev.filter((s) => s.pageId !== pageId));
  }, []);

  const onDrawPointerDown = useCallback(
    (e: ReactPointerEvent, pageId: string, panX: number, panY: number, zoom: number) => {
      if (!activeTool) return;
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const { x, y } = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, zoom);

      const stroke: DrawingStroke = {
        id: `draw-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        tool: activeTool,
        color,
        width,
        opacity,
        points: `${x},${y}`,
        sx: x,
        sy: y,
        ex: x,
        ey: y,
        pageId,
        createdAt: Date.now(),
      };

      currentStrokeRef.current = stroke;
      drawingRef.current = true;
      setActiveStroke(stroke);
    },
    [activeTool, color, width, opacity],
  );

  const onDrawPointerMove = useCallback(
    (e: ReactPointerEvent, pageId: string, panX: number, panY: number, zoom: number) => {
      console.log(pageId);
      if (!drawingRef.current || !currentStrokeRef.current) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const { x, y } = screenToCanvas(e.clientX, e.clientY, rect, panX, panY, zoom);

      const stroke = currentStrokeRef.current;

      const updated: DrawingStroke =
        stroke.tool === "arrow" || stroke.tool === "rect"
          ? { ...stroke, ex: x, ey: y }
          : { ...stroke, points: stroke.points + ` ${x},${y}`, ex: x, ey: y };

      currentStrokeRef.current = updated;
      setActiveStroke({ ...updated });
    },
    [],
  );

  const onDrawPointerUp = useCallback(
    (pageId: string) => {
      if (!drawingRef.current || !currentStrokeRef.current) return;
      drawingRef.current = false;

      const stroke = currentStrokeRef.current;
      currentStrokeRef.current = null;
      setActiveStroke(null);

      if (stroke.tool === "eraser") {
        // Eraser removes strokes whose points are near the eraser path
        const eraserPts = parsePoints(stroke.points);
        setStrokes((prev) =>
          prev.filter((s) => {
            if (s.pageId !== pageId) return true;
            const pts = parsePoints(s.points);
            return !pts.some((p) =>
              eraserPts.some(
                (ep) => Math.hypot(ep.x - p.x, ep.y - p.y) < stroke.width * 2,
              ),
            );
          }),
        );
        return;
      }

      setStrokes((prev) => [...prev, stroke]);
      broadcastDraw?.("studio:draw", { stroke });
    },
    [broadcastDraw],
  );

  return {
    activeTool,
    color,
    width,
    opacity,
    strokes,
    activeStroke,
    setDrawTool,
    setDrawColor: setColor,
    setDrawWidth: setWidth,
    setDrawOpacity: setOpacity,
    clearStrokes,
    undoLastStroke,
    onDrawPointerDown,
    onDrawPointerMove,
    onDrawPointerUp,
    applyRemoteStroke,
    applyRemoteClear,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePoints(pts: string): { x: number; y: number }[] {
  return pts
    .trim()
    .split(" ")
    .map((p) => {
      const [x, y] = p.split(",").map(Number);
      return { x: x ?? 0, y: y ?? 0 };
    });
}

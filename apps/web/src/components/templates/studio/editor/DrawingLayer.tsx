"use client";

import type { DrawingStroke, DrawingTool } from "../core";

// ── Arrow head helper ─────────────────────────────────────────────────────────

function arrowHead(x1: number, y1: number, x2: number, y2: number, size = 10) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a1 = angle + Math.PI * 0.75;
  const a2 = angle - Math.PI * 0.75;
  const p1 = `${x2 + size * Math.cos(a1)},${y2 + size * Math.sin(a1)}`;
  const p2 = `${x2 + size * Math.cos(a2)},${y2 + size * Math.sin(a2)}`;
  return `M${p1} L${x2},${y2} L${p2}`;
}

// ── Single stroke renderer ────────────────────────────────────────────────────

function StrokeShape({ s }: { s: DrawingStroke }) {
  const baseProps = {
    stroke: s.tool === "eraser" ? "rgba(255,255,255,0.6)" : s.color,
    strokeWidth: s.width,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
    opacity: s.opacity,
  };

  if (s.tool === "arrow") {
    const sx = s.sx ?? 0, sy = s.sy ?? 0;
    const ex = s.ex ?? sx, ey = s.ey ?? sy;
    return (
      <g opacity={s.opacity}>
        <line
          x1={sx} y1={sy} x2={ex} y2={ey}
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinecap="round"
        />
        <path
          d={arrowHead(sx, sy, ex, ey, s.width * 4 + 4)}
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={s.color}
        />
      </g>
    );
  }

  if (s.tool === "rect") {
    const sx = s.sx ?? 0, sy = s.sy ?? 0;
    const ex = s.ex ?? sx, ey = s.ey ?? sy;
    return (
      <rect
        x={Math.min(sx, ex)}
        y={Math.min(sy, ey)}
        width={Math.abs(ex - sx)}
        height={Math.abs(ey - sy)}
        stroke={s.color}
        strokeWidth={s.width}
        fill={`${s.color}22`}
        opacity={s.opacity}
        rx={2}
      />
    );
  }

  // pencil / highlighter / eraser — polyline
  return (
    <polyline
      points={s.points}
      {...baseProps}
      fill="none"
      style={s.tool === "highlighter" ? { mixBlendMode: "multiply" } : undefined}
    />
  );
}

// ── Cursor dot for active drawing tool ────────────────────────────────────────

function DrawCursor({
  x, y, tool, width, color,
}: {
  x: number; y: number; tool: DrawingTool; width: number; color: string;
}) {
  if (tool === "eraser") {
    return (
      <circle
        cx={x} cy={y} r={width}
        fill="none"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth={1.5}
      />
    );
  }
  return (
    <circle
      cx={x} cy={y} r={Math.max(2, width / 2)}
      fill={color}
      opacity={0.7}
    />
  );
}

// ── Main DrawingLayer ─────────────────────────────────────────────────────────

interface Props {
  pageId: string;
  strokes: DrawingStroke[];
  activeStroke: DrawingStroke | null;
  activeTool: DrawingTool | null;
  color: string;
  width: number;
  opacity: number;
  canvasW: number; // px (already scaled)
  canvasH: number; // px (already scaled)
  panX: number;
  panY: number;
  zoom: number;
  onPointerDown: (e: React.PointerEvent, pageId: string, panX: number, panY: number, zoom: number) => void;
  onPointerMove: (e: React.PointerEvent, pageId: string, panX: number, panY: number, zoom: number) => void;
  onPointerUp: (pageId: string) => void;
}

export function DrawingLayer({
  pageId,
  strokes,
  activeStroke,
  activeTool,
  color,
  width,
  opacity: _opacity,
  canvasW,
  canvasH,
  panX,
  panY,
  zoom,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: Props) {
  const pageStrokes = strokes.filter((s) => s.pageId === pageId);
  const [cursorPos, setCursorPos] = React.useState<{ x: number; y: number } | null>(null);

  if (!activeTool) return null;

  const isEraser = activeTool === "eraser";

  return (
    <svg
      className="absolute inset-0 z-30"
      width={canvasW}
      height={canvasH}
      style={{
        cursor: isEraser ? "none" : "crosshair",
        pointerEvents: activeTool ? "all" : "none",
        touchAction: "none",
      }}
      onPointerDown={(e) => onPointerDown(e, pageId, panX, panY, zoom)}
      onPointerMove={(e) => {
        onPointerMove(e, pageId, panX, panY, zoom);
        // Track cursor position for the cursor dot
        const rect = e.currentTarget.getBoundingClientRect();
        setCursorPos({
          x: (e.clientX - rect.left - panX) / zoom,
          y: (e.clientY - rect.top - panY) / zoom,
        });
      }}
      onPointerUp={() => onPointerUp(pageId)}
      onPointerLeave={() => setCursorPos(null)}
    >
      {/* Committed strokes */}
      {pageStrokes.map((s) => (
        <StrokeShape key={s.id} s={s} />
      ))}

      {/* Active (in-progress) stroke */}
      {activeStroke && activeStroke.pageId === pageId && (
        <StrokeShape s={activeStroke} />
      )}

      {/* Custom cursor dot */}
      {cursorPos && (
        <DrawCursor
          x={cursorPos.x}
          y={cursorPos.y}
          tool={activeTool}
          width={width}
          color={color}
        />
      )}
    </svg>
  );
}

// Need React for useState
import React from "react";

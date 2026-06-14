"use client";

import type { AlignGuide, SpacingGuide } from "./useStudioPointerMotion";
import { MM_TO_PX } from "../core";

interface Props {
  guides: AlignGuide[];
  spacingGuides: SpacingGuide[];
  canvasW: number; // mm
  canvasH: number; // mm
  zoom: number;
}

// ── Dimension arrow label ─────────────────────────────────────────────────────

function DimensionLine({ g, zoom: _zoom }: { g: SpacingGuide; zoom: number }) {
  const px = (mm: number) => mm * MM_TO_PX;

   //const MARGIN = 6; // px — how far the dim line sits from the component edge
  const TICK = 5;   // px — length of end ticks

  if (g.axis === "h") {
    // Horizontal gap — dimension line runs left-right at perp y
    const x1 = px(g.start);
    const x2 = px(g.end);
    const y = px(g.perp);
    const midX = (x1 + x2) / 2;
    const gapPx = x2 - x1;
    if (gapPx < 2) return null;

    const label = g.gapMm >= 1
      ? `${g.gapMm}mm / ${g.gapPx}px`
      : `${g.gapPx}px`;

    return (
      <g>
        {/* Main line */}
        <line
          x1={x1} y1={y} x2={x2} y2={y}
          stroke="#f5c451" strokeWidth={1} opacity={0.9}
        />
        {/* Start tick */}
        <line x1={x1} y1={y - TICK} x2={x1} y2={y + TICK}
          stroke="#f5c451" strokeWidth={1} opacity={0.9} />
        {/* End tick */}
        <line x1={x2} y1={y - TICK} x2={x2} y2={y + TICK}
          stroke="#f5c451" strokeWidth={1} opacity={0.9} />
        {/* Arrowheads */}
        <polygon
          points={`${x1 + 6},${y - 3} ${x1},${y} ${x1 + 6},${y + 3}`}
          fill="#f5c451" opacity={0.9}
        />
        <polygon
          points={`${x2 - 6},${y - 3} ${x2},${y} ${x2 - 6},${y + 3}`}
          fill="#f5c451" opacity={0.9}
        />
        {/* Label pill */}
        <rect
          x={midX - 28} y={y - 9}
          width={56} height={16}
          rx={4}
          fill="#1c1a2e" stroke="#f5c451" strokeWidth={0.8} opacity={0.95}
        />
        <text
          x={midX} y={y + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fontFamily="monospace"
          fill="#f5c451"
          fontWeight="600"
        >
          {label}
        </text>
      </g>
    );
  } else {
    // Vertical gap — dimension line runs top-bottom at perp x
    const y1 = px(g.start);
    const y2 = px(g.end);
    const x = px(g.perp);
    const midY = (y1 + y2) / 2;
    const gapPx = y2 - y1;
    if (gapPx < 2) return null;

    const label = g.gapMm >= 1
      ? `${g.gapMm}mm`
      : `${g.gapPx}px`;

    return (
      <g>
        {/* Main line */}
        <line
          x1={x} y1={y1} x2={x} y2={y2}
          stroke="#f5c451" strokeWidth={1} opacity={0.9}
        />
        {/* Start tick */}
        <line x1={x - TICK} y1={y1} x2={x + TICK} y2={y1}
          stroke="#f5c451" strokeWidth={1} opacity={0.9} />
        {/* End tick */}
        <line x1={x - TICK} y1={y2} x2={x + TICK} y2={y2}
          stroke="#f5c451" strokeWidth={1} opacity={0.9} />
        {/* Arrowheads */}
        <polygon
          points={`${x - 3},${y1 + 6} ${x},${y1} ${x + 3},${y1 + 6}`}
          fill="#f5c451" opacity={0.9}
        />
        <polygon
          points={`${x - 3},${y2 - 6} ${x},${y2} ${x + 3},${y2 - 6}`}
          fill="#f5c451" opacity={0.9}
        />
        {/* Label pill — rotated */}
        <g transform={`translate(${x}, ${midY}) rotate(-90)`}>
          <rect
            x={-24} y={-9}
            width={48} height={16}
            rx={4}
            fill="#1c1a2e" stroke="#f5c451" strokeWidth={0.8} opacity={0.95}
          />
          <text
            x={0} y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="monospace"
            fill="#f5c451"
            fontWeight="600"
          >
            {label}
          </text>
        </g>
      </g>
    );
  }
}

// ── Dimension tooltip on the dragged component itself ─────────────────────────

function ComponentDimensionBadge({
  comp,
  zoom: _zoom,
}: {
  comp: { x: number; y: number; width: number; height: number } | null;
  zoom: number;
}) {
  if (!comp) return null;
  const px = (mm: number) => mm * MM_TO_PX;

  const x = px(comp.x + comp.width / 2);
  const y = px(comp.y) - 14;
  const label = `${Math.round(comp.x)}, ${Math.round(comp.y)} mm · ${comp.width}×${comp.height} mm`;
  const w = label.length * 5.6 + 12;

  return (
    <g>
      <rect
        x={x - w / 2} y={y - 9}
        width={w} height={16}
        rx={4}
        fill="#7c5cff" opacity={0.95}
      />
      <text
        x={x} y={y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={9}
        fontFamily="monospace"
        fill="#ffffff"
        fontWeight="600"
      >
        {label}
      </text>
    </g>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AlignmentGuides({
  guides,
  spacingGuides,
  canvasW,
  canvasH,
  zoom,
  draggedComp,
  altActive,
}: Props & {
  draggedComp?: { x: number; y: number; width: number; height: number } | null;
  altActive?: boolean;
}) {
  const hasGuides = guides.length > 0;
  const hasSpacing = spacingGuides.length > 0 && altActive;
  if (!hasGuides && !hasSpacing && !altActive) return null;

  const W = canvasW * MM_TO_PX;
  const H = canvasH * MM_TO_PX;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-20"
      width={W}
      height={H}
      style={{ overflow: "visible" }}
    >
      {/* ── Standard alignment snap lines ── */}
      {guides.map((g, i) => {
        const isCenter = g.kind === "center";
        const color = isCenter ? "#7c5cff" : "#3ddc97";
        const dashArray = isCenter ? "4 3" : undefined;

        if (g.axis === "v") {
          const x = g.pos * MM_TO_PX;
          return (
            <line key={`ag-${i}`}
              x1={x} y1={0} x2={x} y2={H}
              stroke={color} strokeWidth={1}
              strokeDasharray={dashArray}
              opacity={0.85}
            />
          );
        } else {
          const y = g.pos * MM_TO_PX;
          return (
            <line key={`ag-${i}`}
              x1={0} y1={y} x2={W} y2={y}
              stroke={color} strokeWidth={1}
              strokeDasharray={dashArray}
              opacity={0.85}
            />
          );
        }
      })}

      {/* ── Alt spacing / dimension guides ── */}
      {altActive && spacingGuides.map((g, i) => (
        <DimensionLine key={`sg-${i}`} g={g} zoom={zoom} />
      ))}

      {/* ── Dragged component dimension badge ── */}
      {altActive && draggedComp && (
        <ComponentDimensionBadge comp={draggedComp} zoom={zoom} />
      )}
    </svg>
  );
}

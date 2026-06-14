"use client";

import type { PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";

import {
  MM_TO_PX,
  safeColor,
  safeNum,
  isCircleType,
  isSilhouetteType,
  isChromeless,
} from "./core-model";

import type {
  CompType,
  CanvasComp,
} from "./core-model";

export function ShapeInner({ comp }: { comp: CanvasComp }) {
  if (comp.type === "board") {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.05) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
          borderRadius: "inherit",
        }}
      />
    );
  }
  if (comp.type === "die") {
    const dotCount = Math.max(1, Math.min(6, comp.dotCount ?? 4));
    const dotColor = comp.innerColor ?? "rgba(10,10,10,0.85)";
    // Standard die pip positions (grid coords out of 3x3)
    const PIP_POSITIONS: Record<number, [number, number][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [2, 0], [0, 2], [2, 2]],
      5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
      6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
    };
    const pips = PIP_POSITIONS[dotCount] ?? PIP_POSITIONS[4]!;
    return (
      <svg viewBox="0 0 30 30" className="absolute inset-[12%]">
        {pips.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={5 + cx * 10}
            cy={5 + cy * 10}
            r="3.5"
            fill={dotColor}
          />
        ))}
      </svg>
    );
  }
  if (comp.type === "rulebook") {
    return (
      <div className="absolute inset-x-[10%] inset-y-[12%] flex flex-col gap-[6%]">
        {[90, 75, 82, 60, 70, 50].map((w, i) => (
          <div
            key={i}
            style={{
              height: 2,
              width: `${w}%`,
              background: "rgba(245,196,81,0.25)",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    );
  }
  if (comp.type === "card" || comp.type === "tile") {
    return (
      <div
        className="absolute inset-[8%] rounded"
        style={{ border: "1px dashed rgba(255,255,255,0.12)" }}
      />
    );
  }
  if (comp.type === "coin") {
    return (
      <div
        className="absolute inset-[14%] rounded-full flex items-center justify-center"
        style={{ border: "1px solid rgba(0,0,0,0.25)" }}
      >
        <span
          style={{
            color: "rgba(0,0,0,0.55)",
            fontWeight: 800,
            fontSize: "60%",
            lineHeight: 1,
          }}
        >
          $
        </span>
      </div>
    );
  }
  if (comp.type === "deck") {
    // Stacked-card edges along the bottom-right to read as a deck.
    return (
      <>
        <div
          className="absolute"
          style={{
            inset: 0,
            transform: "translate(3px,3px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "inherit",
          }}
        />
        <div
          className="absolute"
          style={{
            inset: 0,
            transform: "translate(1.5px,1.5px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "inherit",
          }}
        />
        <div
          className="absolute inset-[18%] rounded"
          style={{ border: "1px dashed rgba(255,255,255,0.18)" }}
        />
      </>
    );
  }
  if (comp.type === "note") {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-center px-[8%]"
        style={{
          color: comp.textColor ?? "#3a2f12",
          fontSize: 10,
          fontFamily: "var(--font-ui)",
          lineHeight: 1.2,
          overflow: "hidden",
        }}
      >
        {comp.text}
      </div>
    );
  }
  if (comp.type === "track") {
    const n = Math.max(2, comp.segments ?? 10);
    return (
      <div className="absolute inset-0 flex items-stretch">
        {Array.from({ length: n }, (_, i) => (
          <div
            key={i}
            className="flex-1 flex items-center justify-center border-r last:border-r-0"
            style={{
              borderColor: "rgba(0,0,0,0.25)",
              fontSize: 7,
              color: comp.innerColor ?? "#3ddc97",
              fontWeight: 700,
              fontFamily: "var(--font-ui)",
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
    );
  }
  if (comp.type === "spinner") {
    const n = Math.max(2, comp.segments ?? 6);
    const r = 42;
    const cx = 50;
    const cy = 50;
    const slices = Array.from({ length: n }, (_, i) => {
      const a1 = (i / n) * Math.PI * 2 - Math.PI / 2;
      const a2 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
    });
    const PALETTE = ["#7c5cff", "#ff3b5c", "#3ddc97", "#f5c451", "#22d3ee", "#fb923c"];
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        {slices.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={PALETTE[i % PALETTE.length]}
            stroke={comp.stroke ?? "#0a0a0a"}
            strokeWidth="1"
          />
        ))}
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + r * 0.65}
          y2={cy - r * 0.2}
          stroke={comp.innerColor ?? "#ff3b5c"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="4" fill="#0a0a0a" />
        {/* Labels */}
        {slices.map((_, i) => {
          const a = ((i + 0.5) / n) * Math.PI * 2 - Math.PI / 2;
          const lx = cx + r * 0.65 * Math.cos(a);
          const ly = cy + r * 0.65 * Math.sin(a);
          return (
            <text
              key={i}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="bold"
              fill="#fff"
              style={{ fontFamily: "var(--font-ui)" }}
            >
              {i + 1}
            </text>
          );
        })}
      </svg>
    );
  }
  if (comp.type === "line") {
    // Line: render a centred filled bar using the fill colour and lineWeight.
    const thickness = Math.max(1, comp.lineWeight ?? 2);
    return (
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          height: thickness,
          backgroundColor: safeColor(comp.fill, "#f5c451"),
          borderRadius: thickness / 2,
        }}
      />
    );
  }
  if (comp.type === "spiral") {
    // Archimedes spiral path drawn as SVG
    const turns = 3;
    const steps = 180;
    const cx = 50;
    const cy = 50;
    const maxR = 46;
    const points = Array.from({ length: steps + 1 }, (_, i) => {
      const t = i / steps;
      const angle = t * turns * Math.PI * 2;
      const r = t * maxR;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    });
    return (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <polyline
          points={points.join(" ")}
          fill="none"
          stroke={comp.stroke ?? "#f5c451"}
          strokeWidth={comp.lineWeight ?? 2}
          strokeLinecap="round"
        />
        {/* Dot markers every N steps */}
        {Array.from({ length: comp.segments ?? 24 }, (_, i) => {
          const t = i / ((comp.segments ?? 24) - 1);
          const angle = t * turns * Math.PI * 2;
          const r = t * maxR;
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r="2"
              fill={comp.stroke ?? "#f5c451"}
            />
          );
        })}
      </svg>
    );
  }
  if (comp.type === "custom") {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-center px-[8%]"
        style={{
          color: comp.textColor ?? "#0a0a0a",
          fontSize: Math.min(14, Math.max(8, (comp.width ?? 60) * 0.14)),
          fontFamily: "var(--font-ui)",
          fontWeight: 700,
          lineHeight: 1.2,
          overflow: "hidden",
        }}
      >
        {comp.customLabel ?? comp.text ?? "Custom"}
      </div>
    );
  }
  return null;
}

const SILHOUETTE_PATHS: Partial<
  Record<CompType, { viewBox: string; d: string }>
> = {
  pawn: {
    viewBox: "0 0 26 40",
    d: "M13 2c3 0 5.2 2.3 5.2 5.2 0 1.9-1 3.5-2.4 4.5 2.6 1.2 3.6 3.6 3.9 6.3.2 1.6-.9 2.6-2.4 2.6h-1l1.4 12c.2 1.6-1 3-2.6 3h-3.8c-1.6 0-2.8-1.4-2.6-3l1.4-12h-1c-1.5 0-2.6-1-2.4-2.6.3-2.7 1.3-5.1 3.9-6.3-1.4-1-2.4-2.6-2.4-4.5C7.8 4.3 10 2 13 2z",
  },
  meeple: {
    viewBox: "0 0 40 40",
    d: "M20 3a6 6 0 015.4 8.6c3 .8 5 2.3 8.1 4.2 2 1.2 2 4.2-.3 4.9l-7.8 2.4 3 11.1c.5 1.9-.9 3.8-2.9 3.8h-11c-2 0-3.4-1.9-2.9-3.8l3-11.1-7.8-2.4c-2.3-.7-2.3-3.7-.3-4.9 3.1-1.9 5.1-3.4 8.1-4.2A6 6 0 0120 3z",
  },
  hex: { viewBox: "0 0 52 60", d: "M26 1L51 15.5v29L26 59 1 44.5v-29z" },
  bag: {
    viewBox: "0 0 40 52",
    d: "M15 10c0-2.8 2.2-5 5-5s5 2.2 5 5H15zm-2 0h-3a3 3 0 00-3 3l2 32a3 3 0 003 3h20a3 3 0 003-3l2-32a3 3 0 00-3-3h-3M14 10h12",
  },
  standee: {
    viewBox: "0 0 32 52",
    d: "M16 2a7 7 0 015.4 11.4L24 26H8l2.6-12.6A7 7 0 0116 2zM8 26v16h16V26M4 42h24v6H4z",
  },
  sand_timer: {
    viewBox: "0 0 28 44",
    d: "M2 1h24M2 43h24M5 2l9 17.5L5 42M23 2l-9 17.5L23 42M9 34h10",
  },
};

/** Pieces (pawn, meeple, hex) rendered as SVG silhouettes so they read as real shapes. */
export function SilhouetteShape({ comp }: { comp: CanvasComp }) {
  const s = SILHOUETTE_PATHS[comp.type] ?? SILHOUETTE_PATHS.pawn!;
  return (
    <svg
      viewBox={s.viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <path
        d={s.d}
        fill={comp.fill}
        stroke={comp.stroke}
        strokeWidth={comp.strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── CompView (editor) ─────────────────────────────────────────────────────────

export interface CompViewProps {
  comp: CanvasComp;
  selected: boolean;
  primary: boolean;
  editable: boolean;
  onPointerDown: (e: ReactPointerEvent, comp: CanvasComp) => void;
  onResizeStart: (
    e: ReactPointerEvent,
    comp: CanvasComp,
    handle: ResizeHandle,
  ) => void;
  onRotateStart: (e: ReactPointerEvent, comp: CanvasComp) => void;
  onTextChange: (id: string, text: string) => void;
  onContextMenu?: (e: ReactMouseEvent, comp: CanvasComp) => void;
  /** When set, Ctrl+clicking this component jumps to the linked page. */
  onNavigateToPage?: (pageId: string) => void;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const HANDLES: { id: ResizeHandle; cx: number; cy: number; cursor: string }[] =
  [
    { id: "nw", cx: 0, cy: 0, cursor: "nwse-resize" },
    { id: "n", cx: 0.5, cy: 0, cursor: "ns-resize" },
    { id: "ne", cx: 1, cy: 0, cursor: "nesw-resize" },
    { id: "e", cx: 1, cy: 0.5, cursor: "ew-resize" },
    { id: "se", cx: 1, cy: 1, cursor: "nwse-resize" },
    { id: "s", cx: 0.5, cy: 1, cursor: "ns-resize" },
    { id: "sw", cx: 0, cy: 1, cursor: "nesw-resize" },
    { id: "w", cx: 0, cy: 0.5, cursor: "ew-resize" },
  ];

export function CompView({
  comp,
  selected,
  primary,
  editable,
  onPointerDown,
  onResizeStart,
  onRotateStart,
  onTextChange,
  onContextMenu,
  onNavigateToPage,
}: CompViewProps) {
  const px = (mm: number) => safeNum(mm, 0) * MM_TO_PX;
  const isCircle = isCircleType(comp.type);
  const w = px(comp.width),
    h = px(comp.height);
  const hasLink = !!comp.linkToPageId && !!onNavigateToPage;

  return (
    <div
      onPointerDown={(e) => {
        // Ctrl+click on a linked component navigates; normal click selects/moves.
        if (hasLink && e.ctrlKey) {
          e.stopPropagation();
          onNavigateToPage!(comp.linkToPageId!);
          return;
        }
        if (editable) onPointerDown(e, comp);
      }}
      onContextMenu={(e) => onContextMenu?.(e, comp)}
      title={hasLink ? `Ctrl+click → go to linked page` : undefined}
      style={{
        position: "absolute",
        left: px(comp.x),
        top: px(comp.y),
        width: w,
        height: h,
        transform: `rotate(${comp.rotation}deg)`,
        transformOrigin: "center",
        opacity: comp.opacity / 100,
        cursor: comp.locked
          ? "not-allowed"
          : hasLink
            ? "pointer"
            : editable
              ? "move"
              : "default",
        display: comp.visible ? "block" : "none",
      }}
    >
      {/* Body */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: (isChromeless(comp.type) || isSilhouetteType(comp.type))
            ? "transparent"
            : safeColor(comp.fill, "#1a2535"),
          backgroundImage: comp.image && !isChromeless(comp.type) ? `url("${comp.image}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: (isChromeless(comp.type) || isSilhouetteType(comp.type))
            ? "none"
            : `${comp.strokeWidth}px solid ${safeColor(comp.stroke, "transparent")}`,
          borderRadius: isCircle ? "50%" : comp.cornerRadius,
          boxShadow:
            comp.type === "text" || isSilhouetteType(comp.type) || isChromeless(comp.type)
              ? "none"
              : "0 2px 8px rgba(0,0,0,0.45)",
          overflow: comp.type === "deck" ? "visible" : "hidden",
          boxSizing: "border-box",
        }}
      >
        {isSilhouetteType(comp.type) ? (
          <SilhouetteShape comp={comp} />
        ) : !comp.image ? (
          <ShapeInner comp={comp} />
        ) : null}
      </div>

      {/* Text content */}
      {comp.type === "text" &&
        (selected && editable && primary ? (
          <input
            value={comp.text ?? ""}
            onChange={(e) => onTextChange(comp.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-transparent text-center outline-none"
            style={{
              color: comp.textColor ?? "#e8d5b8",
              fontSize: px(comp.fontSize ?? 18) / 1.6,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-center"
            style={{
              color: comp.textColor ?? "#e8d5b8",
              fontSize: px(comp.fontSize ?? 18) / 1.6,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            {comp.text}
          </div>
        ))}

      {/* Page-link badge — visible whenever the component has a linkToPageId */}
      {hasLink && (
        <div
          className="absolute pointer-events-none z-10"
          style={{
            top: -8,
            right: -8,
            background: "#3ddc97",
            border: "1.5px solid #0a0a0a",
            borderRadius: "50%",
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Linked to another page"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path
              d="M2 4.5h5M5 2.5l2 2-2 2"
              stroke="#0a0a0a"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Selection outline (all selected, incl. group members) */}
      {selected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            outline: `1.5px ${primary ? "solid" : "dashed"} #7c5cff`,
            outlineOffset: 1,
          }}
        />
      )}

      {/* Resize / rotate handles — only on the primary selection */}
      {selected && editable && primary && (
        <>
          {/* Resize handles */}
          {HANDLES.map((hd) => (
            <div
              key={hd.id}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, comp, hd.id);
              }}
              style={{
                position: "absolute",
                left: `calc(${hd.cx * 100}% - 4px)`,
                top: `calc(${hd.cy * 100}% - 4px)`,
                width: 8,
                height: 8,
                background: "#7c5cff",
                border: "1.5px solid #0a0a0a",
                borderRadius: 1,
                cursor: hd.cursor,
                zIndex: 20,
              }}
            />
          ))}
          {/* Rotate handle */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onRotateStart(e, comp);
            }}
            style={{
              position: "absolute",
              left: "calc(50% - 5px)",
              top: -22,
              width: 10,
              height: 10,
              background: "#f5c451",
              border: "1.5px solid #0a0a0a",
              borderRadius: "50%",
              cursor: "grab",
              zIndex: 20,
            }}
            title="Rotate"
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: -12,
              width: 1,
              height: 12,
              background: "#f5c451",
            }}
          />
        </>
      )}
    </div>
  );
}

// ── Previews ──────────────────────────────────────────────────────────────────


// ── Group bounding box ────────────────────────────────────────────────────────

/**
 * Computes the axis-aligned bounding box (in mm) for a list of components
 * that share a groupId. Used to render the group selection frame.
 */
export function groupBoundingBox(members: CanvasComp[]): {
  x: number; y: number; w: number; h: number;
} | null {
  if (members.length === 0) return null;
  const minX = Math.min(...members.map((c) => c.x));
  const minY = Math.min(...members.map((c) => c.y));
  const maxX = Math.max(...members.map((c) => c.x + c.width));
  const maxY = Math.max(...members.map((c) => c.y + c.height));
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

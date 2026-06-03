"use client";

import {
  MM_TO_PX,
  CANVAS_W_MM,
  CANVAS_H_MM,
  safeColor,
  isCircleType,
  isSilhouetteType,
  isChromeless,
} from "./core-model";

import type {
  CompType,
  CanvasComp,
} from "./core-model";

import {
  ShapeInner,
  SilhouetteShape,
} from "./core-shapes";

export function Preview2D({
  components,
  scale,
  width = CANVAS_W_MM,
  height = CANVAS_H_MM,
}: {
  components: CanvasComp[];
  scale: number;
  width?: number;
  height?: number;
}) {
  const px = (mm: number) => mm * MM_TO_PX * scale;
  return (
    <div
      style={{
        position: "relative",
        width: px(width),
        height: px(height),
        backgroundColor: "#0f1012",
        border: "1px solid rgba(58,42,31,0.6)",
        borderRadius: 4,
      }}
    >
      {components
        .filter((c) => c.visible)
        .map((c) => {
          const isCircle = isCircleType(c.type);
          return (
            <div
              key={c.id}
              style={{
                position: "absolute",
                left: px(c.x),
                top: px(c.y),
                width: px(c.width),
                height: px(c.height),
                transform: `rotate(${c.rotation}deg)`,
                opacity: c.opacity / 100,
                backgroundColor: isChromeless(c.type)
                  ? "transparent"
                  : safeColor(c.fill, "#1a2535"),
                backgroundImage: c.image ? `url("${c.image}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: isChromeless(c.type)
                  ? "none"
                  : `${c.strokeWidth}px solid ${safeColor(c.stroke, "transparent")}`,
                borderRadius: isCircle ? "50%" : c.cornerRadius * scale,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.textColor,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: px(c.fontSize ?? 18) / 1.6,
                overflow: "hidden",
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
          );
        })}
    </div>
  );
}

/** CSS 3D preview — each component gets real depth/extrusion. */
export function Preview3D({
  components,
  width = CANVAS_W_MM,
  height = CANVAS_H_MM,
}: {
  components: CanvasComp[];
  width?: number;
  height?: number;
}) {
  const s = 0.7;
  const px = (mm: number) => mm * MM_TO_PX * s;
  const depthFor = (t: CompType) =>
    t === "token" || t === "coin" || t === "marker"
      ? 10
      : t === "die" || t === "cube"
        ? 16
        : t === "pawn" || t === "meeple"
          ? 22
          : t === "card"
            ? 4
            : t === "deck"
              ? 14
              : t === "board"
                ? 3
                : t === "hex"
                  ? 8
                  : 6;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ perspective: "1400px" }}
    >
      <div
        style={{
          position: "relative",
          width: px(width),
          height: px(height),
          transform: "rotateX(55deg) rotateZ(0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* table */}
        <div
          style={{
            position: "absolute",
            inset: -60,
            background: "radial-gradient(ellipse at center,#241a12,#140e09)",
            transform: "translateZ(-6px)",
            borderRadius: 8,
            boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
          }}
        />
        {components
          .filter((c) => c.visible)
          .map((c) => {
            const depth = depthFor(c.type) * s;
            const isCircle = isCircleType(c.type);
            const w = px(c.width),
              h = px(c.height);
            return (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left: px(c.x),
                  top: px(c.y),
                  width: w,
                  height: h,
                  transformStyle: "preserve-3d",
                  transform: `rotate(${c.rotation}deg)`,
                  opacity: c.opacity / 100,
                }}
              >
                {/* top face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateZ(${depth}px)`,
                    backgroundColor: isChromeless(c.type)
                      ? "transparent"
                      : c.fill,
                    border: isChromeless(c.type)
                      ? "none"
                      : `${c.strokeWidth}px solid ${c.stroke}`,
                    borderRadius: isCircle ? "50%" : c.cornerRadius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.textColor,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: (c.fontSize ?? 18) * s,
                    overflow: "hidden",
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
                {/* side walls (extrusion) — simple shadow box */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateZ(${depth / 2}px)`,
                    backgroundColor: isChromeless(c.type)
                      ? "transparent"
                      : c.fill,
                    filter: "brightness(0.6)",
                    borderRadius: isCircle ? "50%" : c.cornerRadius,
                    boxShadow: `0 ${depth}px ${depth}px rgba(0,0,0,0.5)`,
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

export type MenuItem =
  | { type: "sep" }
  | {
      type: "item";
      label: string;
      shortcut?: string;
      danger?: boolean;
      disabled?: boolean;
      onClick: () => void;
    };

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const W = 184;
  const approxH = items.reduce((h, it) => h + (it.type === "sep" ? 9 : 28), 8);
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  const vh = typeof window !== "undefined" ? window.innerHeight : 9999;
  const left = Math.min(x, vw - W - 8);
  const top = Math.min(y, Math.max(8, vh - approxH - 8));
  return (
    <div
      className="fixed inset-0 z-[55]"
      onPointerDown={onClose}
      onWheel={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="fixed z-[56] bg-rich-wood-dark border border-warm-wood rounded-lg shadow-2xl py-1"
        style={{ left, top, width: W }}
        onPointerDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((it, i) =>
          it.type === "sep" ? (
            <div key={i} className="h-px bg-warm-wood my-1" />
          ) : (
            <button
              key={i}
              disabled={it.disabled}
              onClick={() => {
                it.onClick();
                onClose();
              }}
              className={`w-full flex items-center justify-between gap-6 px-3 py-1.5 text-2xs font-ui text-left transition-colors disabled:opacity-30 disabled:cursor-default ${it.danger ? "text-crimson-flame hover:bg-crimson-flame/10" : "text-parchment-light hover:bg-warm-wood"}`}
            >
              <span>{it.label}</span>
              {it.shortcut && (
                <span className="text-soft-gray-dark font-mono">
                  {it.shortcut}
                </span>
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}


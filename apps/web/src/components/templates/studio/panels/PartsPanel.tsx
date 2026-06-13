"use client";

import {
  safeColor,
  isCircleType,
  isSilhouetteType,
  isChromeless,
  TYPE_DEFAULTS,
  makeComp,
  SilhouetteShape,
  ShapeInner,
} from "../core";

import type { CompType } from "../core";

// ── Category taxonomy ─────────────────────────────────────────────────────────

interface PartMeta {
  type: CompType;
  label: string;
  hint: string;
}

const CATEGORIES: { label: string; parts: PartMeta[] }[] = [
  {
    label: "Surfaces",
    parts: [
      { type: "board",    label: "Board",      hint: "Play surface" },
      { type: "tile",     label: "Tile",       hint: "Square tile" },
      { type: "hex",      label: "Hex Tile",   hint: "Hexagon" },
      { type: "track",    label: "Track",      hint: "Score/progress" },
      { type: "spiral",   label: "Spiral",     hint: "Spiral path" },
    ],
  },
  {
    label: "Cards",
    parts: [
      { type: "card",     label: "Card",       hint: "63 × 88 mm" },
      { type: "deck",     label: "Deck",       hint: "Card stack" },
    ],
  },
  {
    label: "Pieces",
    parts: [
      { type: "token",    label: "Token",      hint: "Round marker" },
      { type: "marker",   label: "Marker",     hint: "Status disc" },
      { type: "cube",     label: "Cube",       hint: "Resource" },
      { type: "coin",     label: "Coin",       hint: "Currency" },
      { type: "pawn",     label: "Pawn",       hint: "Player piece" },
      { type: "meeple",   label: "Meeple",     hint: "Worker" },
      { type: "standee",  label: "Standee",    hint: "Printed piece" },
      { type: "bag",      label: "Bag",        hint: "Drawstring bag" },
    ],
  },
  {
    label: "Dice & Chance",
    parts: [
      { type: "die",        label: "Die",        hint: "Dice" },
      { type: "spinner",    label: "Spinner",    hint: "Spin wheel" },
      { type: "sand_timer", label: "Sand Timer", hint: "Hourglass" },
    ],
  },
  {
    label: "Text & Guides",
    parts: [
      { type: "text",      label: "Title / Text", hint: "Label" },
      { type: "note",      label: "Note",         hint: "Sticky note" },
      { type: "rulebook",  label: "Rulebook",     hint: "Reference" },
      { type: "line",      label: "Line",         hint: "Divider" },
    ],
  },
  {
    label: "Custom",
    parts: [
      { type: "custom", label: "Custom", hint: "Your own shape" },
    ],
  },
];

// ── Tiny visual preview ───────────────────────────────────────────────────────

function PartThumb({ type }: { type: CompType }) {
  const d = TYPE_DEFAULTS[type];

  if (isSilhouetteType(type)) {
    return (
      <div className="w-7 h-7 flex items-center justify-center">
        <SilhouetteShape comp={makeComp(type, 0, 0)} />
      </div>
    );
  }

  if (type === "text") {
    return (
      <span
        style={{
          color: d.textColor ?? "#e8d5b8",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        Aa
      </span>
    );
  }

  if (type === "line") {
    return (
      <div
        style={{
          width: 28,
          height: 3,
          backgroundColor: safeColor(d.fill, "#f5c451"),
          borderRadius: 2,
        }}
      />
    );
  }

  if (type === "spiral" || type === "spinner") {
    // Render the SVG ShapeInner at a fixed small size
    return (
      <div style={{ width: 28, height: 28, position: "relative" }}>
        <ShapeInner comp={makeComp(type, 0, 0)} />
      </div>
    );
  }

  const isCircle = isCircleType(type);
  const maxW = d.width ?? 40, maxH = d.height ?? 40;
  const scale = 28 / Math.max(maxW, maxH);
  const w = Math.max(10, Math.round(maxW * scale));
  const h = Math.max(10, Math.round(maxH * scale));

  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: isChromeless(type)
            ? "transparent"
            : safeColor(d.fill, "#1a2535"),
          border: isChromeless(type)
            ? "none"
            : `${Math.min(2, d.strokeWidth ?? 1)}px solid ${safeColor(d.stroke, "#f5c451")}`,
          borderRadius: isCircle ? "50%" : Math.min(6, d.cornerRadius ?? 2),
        }}
      />
      {type === "track" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "stretch",
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                borderRight: i < 2 ? "1px solid rgba(0,0,0,0.3)" : "none",
                fontSize: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: d.innerColor ?? "#3ddc97",
                fontWeight: 700,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function PartsPanel({ onAdd }: { onAdd: (type: CompType) => void }) {
  return (
    <div className="p-2.5 space-y-4">
      <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em] px-1">
        Click a part to add it to the canvas
      </p>

      {CATEGORIES.map((cat) => (
        <div key={cat.label}>
          {/* Category header */}
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider">
              {cat.label}
            </span>
            <div className="flex-1 h-px bg-warm-wood/40" />
          </div>

          {/* Parts grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {cat.parts.map((p) => (
              <button
                key={p.type}
                onClick={() => onAdd(p.type)}
                className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-warm-wood/60 bg-warm-wood/15 hover:bg-warm-wood/40 hover:border-emerald-glow/40 transition-all active:scale-[0.97]"
              >
                <div className="h-9 flex items-center justify-center text-soft-gray group-hover:text-parchment-light overflow-hidden">
                  <PartThumb type={p.type} />
                </div>

                <span className="text-2xs font-ui font-semibold text-parchment-mid group-hover:text-parchment-light leading-none text-center">
                  {p.label}
                </span>

                <span className="text-[10px] font-ui text-soft-gray-dark leading-none text-center">
                  {p.hint}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

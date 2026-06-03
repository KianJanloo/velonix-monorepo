"use client";

import {
  safeColor,
  isCircleType,
  isSilhouetteType,
  TYPE_DEFAULTS,
  makeComp,
  SilhouetteShape,
} from "../core";

import type {
  CompType,
} from "../core";

const PART_META: { type: CompType; label: string; hint: string }[] = [
  { type: "board", label: "Board", hint: "Play surface" },

  { type: "card", label: "Card", hint: "63 × 88 mm" },

  { type: "deck", label: "Deck", hint: "Card stack" },

  { type: "tile", label: "Tile", hint: "Square tile" },

  { type: "hex", label: "Hex Tile", hint: "Hexagon" },

  { type: "token", label: "Token", hint: "Round marker" },

  { type: "marker", label: "Marker", hint: "Status disc" },

  { type: "cube", label: "Cube", hint: "Resource" },

  { type: "coin", label: "Coin", hint: "Currency" },

  { type: "die", label: "Die", hint: "Dice" },

  { type: "pawn", label: "Pawn", hint: "Player piece" },

  { type: "meeple", label: "Meeple", hint: "Worker" },

  { type: "note", label: "Note", hint: "Sticky note" },

  { type: "rulebook", label: "Rulebook", hint: "Reference" },

  { type: "text", label: "Title / Text", hint: "Label" },
];

/** Tiny visual preview of a part type, rendered from its TYPE_DEFAULTS. */

function PartThumb({ type }: { type: CompType }) {
  const d = TYPE_DEFAULTS[type];

  const isCircle = isCircleType(type);

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
          color: d.textColor,

          fontFamily: "var(--font-display)",

          fontWeight: 700,

          fontSize: 13,
        }}
      >
        Aa
      </span>
    );
  }

  // Fit the default footprint inside a 28px box, preserving aspect ratio.

  const maxW = d.width ?? 40,
    maxH = d.height ?? 40;

  const scale = 28 / Math.max(maxW, maxH);

  const w = Math.max(10, Math.round(maxW * scale));

  const h = Math.max(10, Math.round(maxH * scale));

  return (
    <div
      style={{
        width: w,

        height: h,

        backgroundColor: safeColor(d.fill, "#1a2535"),

        border: `${Math.min(2, d.strokeWidth ?? 1)}px solid ${safeColor(d.stroke, "#f5c451")}`,

        borderRadius: isCircle ? "50%" : Math.min(6, d.cornerRadius ?? 2),
      }}
    />
  );
}

export function PartsPanel({ onAdd }: { onAdd: (type: CompType) => void }) {
  return (
    <div className="p-2.5">
      <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em] px-1 mb-2">
        Click a part to add it
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {PART_META.map((p) => (
          <button
            key={p.type}
            onClick={() => onAdd(p.type)}
            className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-warm-wood/60 bg-warm-wood/15 hover:bg-warm-wood/40 hover:border-emerald-glow/40 transition-all active:scale-[0.97]"
          >
            <div className="h-9 flex items-center justify-center text-soft-gray group-hover:text-parchment-light">
              <PartThumb type={p.type} />
            </div>

            <span className="text-2xs font-ui font-semibold text-parchment-mid group-hover:text-parchment-light leading-none">
              {p.label}
            </span>

            <span className="text-[10px] font-ui text-soft-gray-dark leading-none">
              {p.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}


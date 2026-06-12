"use client";

import { useState } from "react";

import {
  CANVAS_W_MM,
  CANVAS_H_MM,
  isCircleType,
  COMP_ICONS,
} from "../core";

import type {
  CompType,
  CanvasComp,
} from "../core";

import {
  SectionLabel,
  Stepper,
  Presets,
  EyeOpen,
  EyeOff,
  LockClosed,
  LockOpen,
} from "./controls";

const SIZE_PRESETS: Partial<
  Record<CompType, { label: string; w: number; h: number }[]>
> = {
  card: [
    { label: "Poker", w: 63, h: 88 },

    { label: "Mini", w: 44, h: 68 },

    { label: "Tarot", w: 70, h: 120 },

    { label: "Square", w: 63, h: 63 },
  ],

  tile: [
    { label: "Sm", w: 32, h: 32 },

    { label: "Md", w: 48, h: 48 },

    { label: "Lg", w: 64, h: 64 },
  ],

  board: [
    { label: "Sm", w: 240, h: 180 },

    { label: "Md", w: 320, h: 240 },

    { label: "Lg", w: 420, h: 300 },
  ],
};

export function GroupBar({
  count,

  canGroup,

  canUngroup,

  onGroup,

  onUngroup,
}: {
  count: number;

  canGroup: boolean;

  canUngroup: boolean;

  onGroup: () => void;

  onUngroup: () => void;
}) {
  return (
    <div className="rounded-lg border border-[rgba(124,92,255,0.3)] bg-[rgba(124,92,255,0.08)] p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs font-ui font-semibold text-[#a78bff]">
          {count > 1 ? `${count} selected` : "Group"}
        </span>

        <span className="text-[10px] text-soft-gray-dark font-ui">
          ⌘G / ⌘⇧G
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onGroup}
          disabled={!canGroup}
          className="flex-1 py-1.5 rounded-lg bg-[rgba(124,92,255,0.15)] text-[#a78bff] text-2xs font-ui font-semibold hover:bg-[rgba(124,92,255,0.25)] disabled:opacity-30"
        >
          Group
        </button>

        <button
          onClick={onUngroup}
          disabled={!canUngroup}
          className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui font-semibold hover:text-parchment-light hover:bg-warm-wood disabled:opacity-30"
        >
          Ungroup
        </button>
      </div>
    </div>
  );
}

export function PropertiesPanel({
  comp,

  onChange,

  onDup,

  onDel,

  onZ,

  multiCount = 1,

  canvasW = CANVAS_W_MM,

  canvasH = CANVAS_H_MM,

  pages = [],

  onNavigate,
}: {
  comp: CanvasComp;

  onChange: (p: Partial<CanvasComp>) => void;

  onDup: () => void;

  onDel: () => void;

  onZ: (d: "up" | "down") => void;

  multiCount?: number;

  canvasW?: number;

  canvasH?: number;

  pages?: { id: string; name: string }[];

  onNavigate?: (pageId: string) => void;
}) {
  const [lockAspect, setLockAspect] = useState(false);

  const ratio = comp.width / Math.max(1, comp.height);

  const setWidth = (w: number) =>
    onChange(
      lockAspect
        ? { width: w, height: Math.max(1, Math.round(w / ratio)) }
        : { width: w },
    );

  const setHeight = (h: number) =>
    onChange(
      lockAspect
        ? { height: h, width: Math.max(1, Math.round(h * ratio)) }
        : { height: h },
    );

  const sizePresets = SIZE_PRESETS[comp.type];

  const isSquareType =
    isCircleType(comp.type) ||
    comp.type === "die" ||
    comp.type === "cube" ||
    comp.type === "tile";

  const hasText = comp.type === "text" || comp.type === "note";

  return (
    <div className="space-y-4">
      {/* Header: type + quick toggles */}

      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-warm-wood/40 flex items-center justify-center text-emerald-glow shrink-0">
          {COMP_ICONS[comp.type]}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-2xs font-ui font-semibold text-parchment-light capitalize leading-tight">
            {comp.type === "text" ? "Title / Text" : comp.type}
          </p>

          <p className="text-[10px] text-soft-gray-dark font-ui truncate">
            {comp.width}×{comp.height} mm
          </p>
        </div>

        <button
          title={comp.visible ? "Hide" : "Show"}
          onClick={() => onChange({ visible: !comp.visible })}
          className={`p-1.5 rounded-lg hover:bg-warm-wood ${comp.visible ? "text-soft-gray hover:text-parchment-light" : "text-royal-gold"}`}
        >
          {comp.visible ? EyeOpen : EyeOff}
        </button>

        <button
          title={comp.locked ? "Unlock" : "Lock"}
          onClick={() => onChange({ locked: !comp.locked })}
          className={`p-1.5 rounded-lg hover:bg-warm-wood ${comp.locked ? "text-royal-gold" : "text-soft-gray hover:text-parchment-light"}`}
        >
          {comp.locked ? LockClosed : LockOpen}
        </button>
      </div>

      {multiCount > 1 && (
        <p className="text-[10px] text-soft-gray-dark font-ui -mt-1">
          Editing primary of {multiCount}. Move, duplicate &amp; delete affect
          all selected.
        </p>
      )}

      <label className="block">
        <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">
          Name
        </span>

        <input
          className="v-input text-xs"
          value={comp.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>

      {hasText && (
        <label className="block">
          <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">
            {comp.type === "note" ? "Note text" : "Text"}
          </span>

          <input
            className="v-input text-xs"
            value={comp.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </label>
      )}

      <div className="h-px bg-warm-wood" />

      {/* Position + alignment */}

      <div>
        <SectionLabel>Position (mm)</SectionLabel>

        <div className="grid grid-cols-2 gap-2">
          <Stepper label="X" value={comp.x} onChange={(x) => onChange({ x })} />

          <Stepper label="Y" value={comp.y} onChange={(y) => onChange({ y })} />
        </div>

        <div className="flex gap-1 mt-2">
          <button
            title="Center horizontally"
            onClick={() =>
              onChange({ x: Math.round((canvasW - comp.width) / 2) })
            }
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Center H
          </button>

          <button
            title="Center vertically"
            onClick={() =>
              onChange({ y: Math.round((canvasH - comp.height) / 2) })
            }
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Center V
          </button>
        </div>
      </div>

      {/* Size */}

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Size (mm)</SectionLabel>

          <button
            onClick={() => setLockAspect((v) => !v)}
            title="Lock aspect ratio"
            className={`flex items-center gap-1 text-[10px] font-ui px-1.5 py-0.5 rounded ${lockAspect ? "text-emerald-glow bg-emerald-ghost" : "text-soft-gray-dark hover:text-parchment-light"}`}
          >
            {lockAspect ? LockClosed : LockOpen} ratio
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stepper label="W" value={comp.width} min={1} onChange={setWidth} />

          <Stepper label="H" value={comp.height} min={1} onChange={setHeight} />
        </div>

        {sizePresets && (
          <div className="mt-2">
            <Presets
              options={sizePresets.map((p) => ({ label: p.label, value: p }))}
              isActive={(p) => comp.width === p.w && comp.height === p.h}
              onPick={(p) => onChange({ width: p.w, height: p.h })}
            />
          </div>
        )}

        {isSquareType && (
          <button
            onClick={() => onChange({ height: comp.width })}
            className="mt-2 w-full py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Make square
          </button>
        )}
      </div>

      {/* Rotation */}

      <div>
        <SectionLabel>Rotation</SectionLabel>

        <Stepper
          value={comp.rotation}
          min={-360}
          max={360}
          unit="°"
          onChange={(rotation) => onChange({ rotation })}
        />

        <div className="flex gap-1 mt-2">
          <button
            title="Rotate -90°"
            onClick={() => onChange({ rotation: comp.rotation - 90 })}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ⟲ 90
          </button>

          <button
            title="Rotate +90°"
            onClick={() => onChange({ rotation: comp.rotation + 90 })}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ⟳ 90
          </button>

          <button
            title="Reset rotation"
            onClick={() => onChange({ rotation: 0 })}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Quantity */}

      <div>
        <SectionLabel>Quantity in game</SectionLabel>

        <Stepper
          value={comp.quantity}
          min={1}
          max={1000}
          onChange={(quantity) => onChange({ quantity })}
        />
      </div>

      {/* Page link */}

      {pages.length > 1 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Link to page</SectionLabel>

            {comp.linkToPageId && (
              <button
                title="Remove link"
                onClick={() => onChange({ linkToPageId: undefined })}
                className="text-[10px] font-ui text-soft-gray-dark hover:text-crimson-flame px-1.5 py-0.5 rounded hover:bg-crimson-ghost"
              >
                Remove
              </button>
            )}
          </div>

          <select
            value={comp.linkToPageId ?? ""}
            onChange={(e) =>
              onChange({
                linkToPageId: e.target.value || undefined,
              })
            }
            className="w-full bg-rich-wood-mid border border-warm-wood rounded-lg px-2 py-1.5 text-2xs font-ui text-parchment-light outline-none focus:border-emerald-glow"
          >
            <option value="">— No link —</option>

            {pages.map((p) => (
              <option key={p.id} value={p.id} disabled={p.id === comp.id}>
                {p.name}
              </option>
            ))}
          </select>

          {comp.linkToPageId && onNavigate && (
            <button
              onClick={() => onNavigate(comp.linkToPageId!)}
              className="mt-1.5 w-full py-1.5 rounded-lg bg-emerald-ghost border border-emerald-glow/30 text-emerald-glow text-2xs font-ui hover:bg-emerald-glow hover:text-deep-void transition-colors"
            >
              ⇢ Go to{" "}
              {pages.find((p) => p.id === comp.linkToPageId)?.name ?? "page"}
            </button>
          )}

          {comp.linkToPageId && (
            <p className="mt-1 text-[10px] text-soft-gray-dark font-ui leading-tight">
              Ctrl+click this component to jump to the linked page.
            </p>
          )}
        </div>
      )}

      <div className="h-px bg-warm-wood" />

      <div>
        <SectionLabel>Arrange</SectionLabel>

        <div className="flex gap-2">
          <button
            onClick={() => onZ("up")}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ↑ Forward
          </button>

          <button
            onClick={() => onZ("down")}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ↓ Back
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDup}
          className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood"
        >
          ⌘D Duplicate
        </button>

        <button
          onClick={onDel}
          className="flex-1 py-1.5 rounded-lg bg-crimson-ghost border border-crimson-flame/20 text-crimson-flame text-2xs font-ui hover:bg-crimson-flame hover:text-white"
        >
          ✕ Delete
        </button>
      </div>
    </div>
  );
}


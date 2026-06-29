"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { safeNum } from "../core";

// ── Section label ─────────────────────────────────────────────────────────────

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
    {children}
  </p>
);

// ── Stepper ───────────────────────────────────────────────────────────────────

export function Stepper({
  value, onChange, min = -Infinity, max = Infinity, step = 1, label, unit,
}: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number; label?: string; unit?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const set = (n: number) => onChange(clamp(Math.round(n)));

  return (
    <label className="block">
      {label && (
        <span className="text-2xs text-soft-gray-dark font-ui block mb-1">{label}</span>
      )}
      <div className="flex items-stretch bg-rich-wood-mid border border-warm-wood rounded-lg overflow-hidden focus-within:border-emerald-glow transition-colors">
        <button type="button" tabIndex={-1} onClick={() => set(value - step)}
          className="px-2 text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood transition-colors">−</button>
        <div className="relative flex-1 min-w-0">
          <input type="number" value={Math.round(value)} min={min} max={max}
            onChange={(e) => set(safeNum(Number(e.target.value)))}
            className="w-full bg-transparent text-center text-xs font-mono text-parchment-light py-2 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          {unit && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-soft-gray-dark font-ui pointer-events-none">{unit}</span>
          )}
        </div>
        <button type="button" tabIndex={-1} onClick={() => set(value + step)}
          className="px-2 text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood transition-colors">+</button>
      </div>
    </label>
  );
}

// ── SliderField ───────────────────────────────────────────────────────────────

export function SliderField({
  label, value, onChange, min, max, step = 1, unit,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xs text-soft-gray-dark font-ui">{label}</span>
        <span className="text-2xs text-soft-gray font-mono">{Math.round(value)}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-glow" />
    </div>
  );
}

// ── Presets ───────────────────────────────────────────────────────────────────

export function Presets<T>({
  options, isActive, onPick,
}: {
  options: { label: string; value: T }[];
  isActive: (v: T) => boolean;
  onPick: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => (
        <button key={o.label} onClick={() => onPick(o.value)}
          className={`px-2 py-1 rounded-md text-[10px] font-ui font-semibold transition-colors ${isActive(o.value) ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/40" : "bg-warm-wood/40 text-soft-gray hover:text-parchment-light hover:bg-warm-wood"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Velonix Color Picker ──────────────────────────────────────────────────────
// A custom HSV wheel + lightness bar + swatches + hex/rgb input.
// No browser <input type="color"> — fully styled for the Velonix dark theme.

/** Velonix-curated palette: game-design colours grouped by mood. */
const SWATCH_GROUPS = [
  {
    label: "Velonix",
    swatches: ["#0a0a0a", "#1a1a1a", "#1a2535", "#1c1a2e", "#2a251a", "#1e2a1c"],
  },
  {
    label: "Accent",
    swatches: ["#00D68F", "#3ddc97", "#f5c451", "#ff3b5c", "#00D68F", "#fb923c"],
  },
  {
    label: "Warm",
    swatches: ["#e8d5b8", "#cbb56a", "#a8801f", "#7a5c2e", "#4a3520", "#2a1f12"],
  },
  {
    label: "Cool",
    swatches: ["#ffffff", "#c8d0e0", "#8899bb", "#4466aa", "#1a2a55", "#0a1020"],
  },
  {
    label: "Game",
    swatches: ["#c41e3a", "#006400", "#00008b", "#ffd700", "#ffffff", "#1c1c1c"],
  },
];

// ── Colour math helpers ───────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1]!, 16), parseInt(m[2]!, 16), parseInt(m[3]!, 16)] : [0, 0, 0];
}
function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = ((h * 60) + 360) % 360;
  }
  return [h, max ? d / max : 0, max];
}
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

// ── SV Square ─────────────────────────────────────────────────────────────────

function SvSquare({
  hue, s, v, onChange,
}: { hue: number; s: number; v: number; onChange: (s: number, v: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const pick = useCallback((e: PointerEvent | React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ns = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const nv = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height));
    onChange(ns, nv);
  }, [onChange]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pick(e);
  };

  return (
    <div
      ref={ref}
      className="relative rounded-lg overflow-hidden cursor-crosshair select-none"
      style={{
        width: "100%",
        paddingBottom: "75%",
        background: `hsl(${hue},100%,50%)`,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={(e) => { if (e.buttons) pick(e); }}
    >
      {/* White → transparent (left→right = saturation) */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right,#fff,transparent)" }} />
      {/* Transparent → black (top→bottom = value) */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,transparent,#000)" }} />
      {/* Cursor */}
      <div
        className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          left: `${s * 100}%`,
          top: `${(1 - v) * 100}%`,
          boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}

// ── Hue rail ──────────────────────────────────────────────────────────────────

function HueRail({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const pick = useCallback((e: PointerEvent | React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onChange(t * 360);
  }, [onChange]);

  return (
    <div ref={ref}
      className="relative h-3 rounded-full cursor-crosshair select-none"
      style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e); }}
      onPointerMove={(e) => { if (e.buttons) pick(e); }}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white pointer-events-none"
        style={{ left: `${(hue / 360) * 100}%`, boxShadow: "0 0 0 1px rgba(0,0,0,0.4)" }}
      />
    </div>
  );
}

// ── Main VelonixColorPicker ───────────────────────────────────────────────────

export function VelonixColorPicker({
  value,
  onChange,
  allowTransparent = false,
}: {
  value: string;
  onChange: (v: string) => void;
  allowTransparent?: boolean;
}) {
  const isTransparent = value === "transparent";
  const rgb = isTransparent ? ([0, 0, 0] as [number, number, number]) : hexToRgb(value.startsWith("#") ? value : "#1a2535");
  const [h, s, v] = rgbToHsv(...rgb);

  const [hexInput, setHexInput] = useState(isTransparent ? "transparent" : value);
  const [activeGroup, setActiveGroup] = useState(0);

  // Keep hex input in sync when value changes externally
  useEffect(() => {
    setHexInput(value === "transparent" ? "transparent" : value);
  }, [value]);

  const setHsv = (nh: number, ns: number, nv: number) => {
    const [r, g, b] = hsvToRgb(nh, ns, nv);
    onChange(rgbToHex(r, g, b));
  };

  const commitHex = (raw: string) => {
    const t = raw.trim();
    if (t === "transparent") { onChange("transparent"); return; }
    const hex = t.startsWith("#") ? t : `#${t}`;
    if (/^#[0-9a-f]{6}$/i.test(hex)) onChange(hex);
    else setHexInput(value); // revert bad input
  };

  return (
    <div className="space-y-3">
      {/* SV square */}
      <SvSquare
        hue={h} s={s} v={v}
        onChange={(ns, nv) => setHsv(h, ns, nv)}
      />

      {/* Hue rail */}
      <HueRail hue={h} onChange={(nh) => setHsv(nh, s, v)} />

      {/* Current colour swatch + hex input */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg border border-warm-wood shrink-0"
          style={
            isTransparent
              ? {
                  backgroundImage:
                    "linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%),linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%)",
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0,4px 4px",
                }
              : { background: value }
          }
        />
        <input
          className="v-input text-xs font-mono flex-1 min-w-0"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={(e) => commitHex(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commitHex((e.target as HTMLInputElement).value); }}
          placeholder="#1a2535"
        />
        {allowTransparent && (
          <button
            onClick={() => onChange(isTransparent ? "#1a2535" : "transparent")}
            className={`text-[10px] font-ui px-2 py-1.5 rounded-lg border transition-colors whitespace-nowrap ${isTransparent ? "border-emerald-glow text-emerald-glow bg-emerald-ghost" : "border-warm-wood text-soft-gray hover:text-parchment-light"}`}
          >
            None
          </button>
        )}
      </div>

      {/* Swatch groups */}
      <div>
        {/* Group tabs */}
        <div className="flex gap-1 mb-2 overflow-x-auto pb-0.5 scrollbar-none">
          {SWATCH_GROUPS.map((g, i) => (
            <button
              key={g.label}
              onClick={() => setActiveGroup(i)}
              className={`px-2 py-0.5 rounded text-[10px] font-ui whitespace-nowrap transition-colors ${activeGroup === i ? "bg-emerald-glow text-deep-void font-bold" : "text-soft-gray hover:text-parchment-light"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        {/* Swatches */}
        <div className="grid grid-cols-6 gap-1.5">
          {SWATCH_GROUPS[activeGroup]!.swatches.map((s) => (
            <button
              key={s}
              onClick={() => onChange(s)}
              title={s}
              className={`aspect-square rounded-md border-2 transition-transform hover:scale-110 ${value === s ? "border-emerald-glow ring-1 ring-emerald-glow/60 scale-110" : "border-warm-wood"}`}
              style={{ background: s }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ColorField (uses VelonixColorPicker in a popover) ─────────────────────────

export function ColorField({
  label, value, onChange, allowTransparent = false,
}: {
  label: string; value: string; onChange: (v: string) => void; allowTransparent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const isTransparent = value === "transparent";
  const displayHex = value?.startsWith("#") ? value : "#1a2535";

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">{label}</p>
        <span className="text-[10px] font-mono text-soft-gray-dark">{isTransparent ? "none" : value}</span>
      </div>

      {/* Trigger row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full p-1.5 rounded-lg border border-warm-wood hover:border-emerald-glow/50 bg-rich-wood-mid transition-colors"
      >
        {/* Swatch preview */}
        <div
          className="w-7 h-7 rounded-md border border-black/30 shrink-0"
          style={
            isTransparent
              ? {
                  backgroundImage:
                    "linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%),linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%)",
                  backgroundSize: "6px 6px",
                  backgroundPosition: "0 0,3px 3px",
                }
              : { background: displayHex }
          }
        />
        <span className="text-xs font-mono text-parchment-light flex-1 text-left">
          {isTransparent ? "None / transparent" : value}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`text-soft-gray-dark shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 p-3 rounded-xl bg-rich-wood-dark border border-warm-wood shadow-2xl"
          style={{ minWidth: 220 }}
        >
          <VelonixColorPicker value={value} onChange={onChange} allowTransparent={allowTransparent} />
        </div>
      )}
    </div>
  );
}

// ── Visibility / lock icons (shared) ─────────────────────────────────────────

export const EyeOpen = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1 6c1.5-3 9-3 10 0-1.5 3-9 3-10 0z" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const EyeOff = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2 2l8 8M1 6c1.5-3 9-3 10 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const LockClosed = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="2.5" y="5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 5V3.6a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const LockOpen = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="2.5" y="5" width="7" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4 5V3.6a2 2 0 013.9-.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

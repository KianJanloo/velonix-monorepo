"use client";

import {
  safeNum,
} from "../core";

export const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
    {children}
  </p>
);

/** Numeric input with −/+ steppers, optional unit, clamping. */

export function Stepper({
  value,

  onChange,

  min = -Infinity,

  max = Infinity,

  step = 1,

  label,

  unit,
}: {
  value: number;

  onChange: (v: number) => void;

  min?: number;

  max?: number;

  step?: number;

  label?: string;

  unit?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const set = (n: number) => onChange(clamp(Math.round(n)));

  return (
    <label className="block">
      {label && (
        <span className="text-2xs text-soft-gray-dark font-ui block mb-1">
          {label}
        </span>
      )}

      <div className="flex items-stretch bg-rich-wood-mid border border-warm-wood rounded-lg overflow-hidden focus-within:border-emerald-glow transition-colors">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => set(value - step)}
          className="px-2 text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood transition-colors"
        >
          −
        </button>

        <div className="relative flex-1 min-w-0">
          <input
            type="number"
            value={Math.round(value)}
            min={min}
            max={max}
            onChange={(e) => set(safeNum(Number(e.target.value)))}
            className="w-full bg-transparent text-center text-xs font-mono text-parchment-light py-2 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />

          {unit && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-soft-gray-dark font-ui pointer-events-none">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          tabIndex={-1}
          onClick={() => set(value + step)}
          className="px-2 text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood transition-colors"
        >
          +
        </button>
      </div>
    </label>
  );
}

/** Slider + numeric readout combo. */

export function SliderField({
  label,

  value,

  onChange,

  min,

  max,

  step = 1,

  unit,
}: {
  label: string;

  value: number;

  onChange: (v: number) => void;

  min: number;

  max: number;

  step?: number;

  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xs text-soft-gray-dark font-ui">{label}</span>

        <span className="text-2xs text-soft-gray font-mono">
          {Math.round(value)}

          {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-glow"
      />
    </div>
  );
}

/** Small pill-button group of presets. */

export function Presets<T>({
  options,

  isActive,

  onPick,
}: {
  options: { label: string; value: T }[];

  isActive: (v: T) => boolean;

  onPick: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.label}
          onClick={() => onPick(o.value)}
          className={`px-2 py-1 rounded-md text-[10px] font-ui font-semibold transition-colors ${isActive(o.value) ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/40" : "bg-warm-wood/40 text-soft-gray hover:text-parchment-light hover:bg-warm-wood"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SWATCHES = [
  "#1a2535",

  "#1c1a2e",

  "#2a251a",

  "#1e2a1c",

  "#7c5cff",

  "#00e5ff",

  "#f5c451",

  "#ff3b5c",

  "#e8d5b8",

  "#a8a29e",

  "#0a0a0a",

  "#ffffff",
];

export function ColorField({
  label,

  value,

  onChange,

  allowTransparent = false,
}: {
  label: string;

  value: string;

  onChange: (v: string) => void;

  allowTransparent?: boolean;
}) {
  const isTransparent = value === "transparent";

  const safe = value?.startsWith("#") ? value : "#1a2535";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
          {label}
        </p>

        {allowTransparent && (
          <button
            onClick={() => onChange(isTransparent ? "#1a2535" : "transparent")}
            className={`text-[10px] font-ui px-1.5 py-0.5 rounded ${isTransparent ? "text-emerald-glow bg-emerald-ghost" : "text-soft-gray-dark hover:text-parchment-light"}`}
          >
            None
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div
          className="relative w-9 h-9 rounded-lg overflow-hidden border border-warm-wood shrink-0"
          style={
            isTransparent
              ? {
                  backgroundImage:
                    "linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%),linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%)",

                  backgroundSize: "8px 8px",

                  backgroundPosition: "0 0,4px 4px",
                }
              : { background: safe }
          }
        >
          <input
            type="color"
            value={safe}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        <input
          className="v-input text-xs font-mono flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {SWATCHES.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={s}
            className={`aspect-square rounded-md border transition-transform hover:scale-110 ${value === s ? "border-emerald-glow ring-1 ring-emerald-glow" : "border-warm-wood"}`}
            style={{ background: s }}
          />
        ))}
      </div>
    </div>
  );
}

/** Live preview of the component's current style. */

// ── Visibility / lock icons (shared) ──────────────────────────────────────────

export const EyeOpen = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.2" />

    <path
      d="M1 6c1.5-3 9-3 10 0-1.5 3-9 3-10 0z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

export const EyeOff = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 2l8 8M1 6c1.5-3 9-3 10 0"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export const LockClosed = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect
      x="2.5"
      y="5"
      width="7"
      height="5"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.2"
    />

    <path d="M4 5V3.6a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const LockOpen = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect
      x="2.5"
      y="5"
      width="7"
      height="5"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.2"
    />

    <path
      d="M4 5V3.6a2 2 0 013.9-.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

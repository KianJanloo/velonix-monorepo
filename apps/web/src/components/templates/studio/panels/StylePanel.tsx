"use client";

import {
  safeColor,
  isCircleType,
  isSilhouetteType,
  isChromeless,
  ShapeInner,
  SilhouetteShape,
} from "../core";

import type { CanvasComp } from "../core";

import {
  SliderField,
  Presets,
  ColorField,
  SectionLabel,
} from "./controls";

// ── Live style preview ────────────────────────────────────────────────────────

function StylePreview({ comp }: { comp: CanvasComp }) {
  const isCircle = isCircleType(comp.type);
  const isSil = isSilhouetteType(comp.type);
  const chromeless = isChromeless(comp.type);

  const previewW = comp.type === "line" ? 56 : comp.type === "spiral" ? 56 : 48;
  const previewH =
    comp.type === "card" || comp.type === "deck" || isSil ? 64
    : comp.type === "line" ? 8
    : comp.type === "track" ? 20
    : 48;

  return (
    <div className="rounded-xl bg-deep-void border border-warm-wood/60 h-24 flex items-center justify-center overflow-hidden relative">
      {/* Subtle grid for context */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px)",
          backgroundSize: "16px 16px",
        }} />

      {comp.type === "text" ? (
        <span style={{
          color: comp.textColor ?? "#e8d5b8",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: Math.min(28, comp.fontSize ?? 18),
          opacity: comp.opacity / 100,
        }}>
          {comp.text || "Aa"}
        </span>
      ) : (
        <div style={{ position: "relative", width: previewW, height: previewH }}>
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundColor: (chromeless || isSil) ? "transparent" : safeColor(comp.fill, "#1a2535"),
            backgroundImage: comp.image ? `url("${comp.image}")` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            border: (chromeless || isSil) ? "none" : `${comp.strokeWidth}px solid ${safeColor(comp.stroke, "transparent")}`,
            borderRadius: isCircle ? "50%" : comp.cornerRadius,
            boxShadow: (chromeless || isSil) ? "none" : "0 2px 12px rgba(0,0,0,0.55)",
            overflow: "hidden",
            boxSizing: "border-box",
            opacity: comp.opacity / 100,
          }}>
            {isSil ? (
              <SilhouetteShape comp={comp} />
            ) : !comp.image ? (
              <ShapeInner comp={comp} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────

const Divider = () => <div className="h-px bg-warm-wood/60" />;

// ── Die section ───────────────────────────────────────────────────────────────

function DieStyleSection({
  comp, onChange,
}: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  const dotColor = comp.innerColor ?? "#0a0a0a";
  const dotCount = comp.dotCount ?? 4;

  return (
    <>
      <Divider />
      <div>
        <SectionLabel>Die face</SectionLabel>
        <div className="space-y-3">
          <ColorField
            label="Pip / dot colour"
            value={dotColor}
            onChange={(v) => onChange({ innerColor: v })}
          />
          <div>
            <SliderField
              label="Pip count shown"
              value={dotCount}
              min={1}
              max={6}
              onChange={(v) => onChange({ dotCount: v })}
            />
            <div className="mt-2">
              <Presets
                options={[
                  { label: "d4", value: 1 },
                  { label: "d6", value: 4 },
                  { label: "d8", value: 3 },
                  { label: "d10", value: 5 },
                  { label: "d12", value: 6 },
                ]}
                isActive={(v) => dotCount === v}
                onPick={(v) => onChange({ dotCount: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Spinner section ───────────────────────────────────────────────────────────

function SpinnerStyleSection({
  comp, onChange,
}: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  return (
    <>
      <Divider />
      <div>
        <SectionLabel>Spinner</SectionLabel>
        <div className="space-y-3">
          <ColorField
            label="Needle colour"
            value={comp.innerColor ?? "#ff3b5c"}
            onChange={(v) => onChange({ innerColor: v })}
          />
          <div>
            <SliderField
              label="Segments"
              value={comp.segments ?? 6}
              min={2}
              max={16}
              onChange={(v) => onChange({ segments: v })}
            />
            <div className="mt-2">
              <Presets
                options={[{ label: "4", value: 4 }, { label: "6", value: 6 }, { label: "8", value: 8 }, { label: "10", value: 10 }, { label: "12", value: 12 }]}
                isActive={(v) => (comp.segments ?? 6) === v}
                onPick={(v) => onChange({ segments: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Track section ─────────────────────────────────────────────────────────────

function TrackStyleSection({
  comp, onChange,
}: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  return (
    <>
      <Divider />
      <div>
        <SectionLabel>Track</SectionLabel>
        <div className="space-y-3">
          <ColorField
            label="Space number colour"
            value={comp.innerColor ?? "#3ddc97"}
            onChange={(v) => onChange({ innerColor: v })}
          />
          <div>
            <SliderField
              label="Number of spaces"
              value={comp.segments ?? 10}
              min={2}
              max={100}
              onChange={(v) => onChange({ segments: v })}
            />
            <div className="mt-2">
              <Presets
                options={[{ label: "10", value: 10 }, { label: "20", value: 20 }, { label: "30", value: 30 }, { label: "50", value: 50 }, { label: "100", value: 100 }]}
                isActive={(v) => (comp.segments ?? 10) === v}
                onPick={(v) => onChange({ segments: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Bag section ───────────────────────────────────────────────────────────────

function BagStyleSection({
  comp, onChange,
}: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  return (
    <>
      <Divider />
      <div>
        <SectionLabel>Bag interior</SectionLabel>
        <ColorField
          label="Interior colour"
          value={comp.innerColor ?? "#5a3ecc"}
          onChange={(v) => onChange({ innerColor: v })}
        />
      </div>
    </>
  );
}

// ── Spiral section ────────────────────────────────────────────────────────────

function SpiralStyleSection({
  comp, onChange,
}: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  return (
    <>
      <Divider />
      <div>
        <SectionLabel>Spiral path</SectionLabel>
        <div className="space-y-3">
          <div>
            <SliderField
              label="Space markers"
              value={comp.segments ?? 24}
              min={4}
              max={60}
              onChange={(v) => onChange({ segments: v })}
            />
          </div>
          <div>
            <SliderField
              label="Line weight"
              value={comp.lineWeight ?? 2}
              min={1}
              max={8}
              unit="px"
              onChange={(v) => onChange({ lineWeight: v })}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Custom section ────────────────────────────────────────────────────────────

function CustomStyleSection({
  comp, onChange,
}: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  return (
    <>
      <Divider />
      <div>
        <SectionLabel>Custom label</SectionLabel>
        <input
          className="v-input text-sm w-full"
          placeholder="Label text…"
          value={comp.customLabel ?? comp.text ?? ""}
          onChange={(e) => onChange({ customLabel: e.target.value })}
        />
        <p className="mt-1.5 text-[10px] text-soft-gray-dark font-ui">
          Shown inside the custom component. Use the Properties panel to set name and quantity.
        </p>
      </div>
    </>
  );
}

// ── Line section ──────────────────────────────────────────────────────────────

function LineStyleSection({
  comp, onChange,
}: { comp: CanvasComp; onChange: (p: Partial<CanvasComp>) => void }) {
  return (
    <>
      <Divider />
      <div>
        <SectionLabel>Line</SectionLabel>
        <div className="space-y-3">
          <ColorField
            label="Line colour"
            value={comp.fill ?? "#f5c451"}
            onChange={(v) => onChange({ fill: v })}
          />
          <div>
            <SliderField
              label="Thickness"
              value={comp.lineWeight ?? 2}
              min={1}
              max={20}
              unit="px"
              onChange={(v) => onChange({ lineWeight: v })}
            />
            <div className="mt-2">
              <Presets
                options={[{ label: "Hair", value: 1 }, { label: "Thin", value: 2 }, { label: "Medium", value: 4 }, { label: "Thick", value: 8 }, { label: "Bold", value: 16 }]}
                isActive={(v) => (comp.lineWeight ?? 2) === v}
                onPick={(v) => onChange({ lineWeight: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main StylePanel ───────────────────────────────────────────────────────────

export function StylePanel({
  comp, onChange,
}: {
  comp: CanvasComp;
  onChange: (p: Partial<CanvasComp>) => void;
}) {
  const maxDim = Math.max(comp.width, comp.height);
  const isCircle = isCircleType(comp.type);
  const isSil = isSilhouetteType(comp.type);
  const chromeless = isChromeless(comp.type);
  const isText = comp.type === "text";
  const isLine = comp.type === "line";
  const isDie = comp.type === "die";
  const isSpinner = comp.type === "spinner";
  const isTrack = comp.type === "track";
  const isBag = comp.type === "bag";
  const isSpiral = comp.type === "spiral";
  const isCustom = comp.type === "custom";

  return (
    <div className="space-y-4">

      {/* Live preview */}
      <StylePreview comp={comp} />

      {/* ── Text type ── */}
      {isText && (
        <>
          <ColorField
            label="Text colour"
            value={comp.textColor ?? "#e8d5b8"}
            onChange={(v) => onChange({ textColor: v })}
          />
          <Divider />
          <div>
            <SliderField
              label="Font size"
              value={comp.fontSize ?? 18}
              min={6} max={120} unit="px"
              onChange={(fontSize) => onChange({ fontSize })}
            />
            <div className="mt-2">
              <Presets
                options={[{ label: "S", value: 14 }, { label: "M", value: 24 }, { label: "L", value: 40 }, { label: "XL", value: 64 }]}
                isActive={(v) => (comp.fontSize ?? 18) === v}
                onPick={(fontSize) => onChange({ fontSize })}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Line type ── */}
      {isLine && <LineStyleSection comp={comp} onChange={onChange} />}

      {/* ── Fill + stroke for all non-text, non-line types ── */}
      {!isText && !isLine && (
        <>
          {/* Silhouette types: only fill (the SVG path fill) */}
          {isSil ? (
            <ColorField
              label="Shape colour"
              value={comp.fill}
              onChange={(v) => onChange({ fill: v })}
            />
          ) : !chromeless ? (
            <>
              <ColorField
                label="Fill"
                value={comp.fill}
                onChange={(v) => onChange({ fill: v })}
                allowTransparent
              />
              <Divider />
              <ColorField
                label="Stroke / border"
                value={comp.stroke}
                onChange={(v) => onChange({ stroke: v })}
                allowTransparent
              />
              <SliderField
                label="Stroke width"
                value={comp.strokeWidth}
                min={0} max={20} unit="px"
                onChange={(strokeWidth) => onChange({ strokeWidth })}
              />
            </>
          ) : null}

          {/* Corner radius — not for circles, silhouettes, lines, spirals */}
          {!isCircle && !isSil && !isLine && !isSpiral && (
            <>
              <Divider />
              <div>
                <SliderField
                  label="Corner radius"
                  value={comp.cornerRadius}
                  min={0} max={Math.round(maxDim / 2)} unit="px"
                  onChange={(cornerRadius) => onChange({ cornerRadius })}
                />
                <div className="mt-2">
                  <Presets
                    options={[
                      { label: "Sharp", value: 0 },
                      { label: "Rounded", value: 8 },
                      { label: "Soft", value: 20 },
                      { label: "Pill", value: Math.round(maxDim / 2) },
                    ]}
                    isActive={(v) => comp.cornerRadius === v}
                    onPick={(cornerRadius) => onChange({ cornerRadius })}
                  />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Type-specific sections ── */}
      {isDie     && <DieStyleSection     comp={comp} onChange={onChange} />}
      {isSpinner && <SpinnerStyleSection comp={comp} onChange={onChange} />}
      {isTrack   && <TrackStyleSection   comp={comp} onChange={onChange} />}
      {isBag     && <BagStyleSection     comp={comp} onChange={onChange} />}
      {isSpiral  && <SpiralStyleSection  comp={comp} onChange={onChange} />}
      {isCustom  && <CustomStyleSection  comp={comp} onChange={onChange} />}

      {/* ── Opacity — always last ── */}
      <Divider />
      <SliderField
        label="Opacity"
        value={comp.opacity}
        min={0} max={100} unit="%"
        onChange={(opacity) => onChange({ opacity })}
      />
    </div>
  );
}

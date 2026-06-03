"use client";

import {
  safeColor,
  isCircleType,
  isSilhouetteType,
  isChromeless,
  ShapeInner,
  SilhouetteShape,
} from "../core";

import type {
  CanvasComp,
} from "../core";

import {
  SliderField,
  Presets,
  ColorField,
} from "./controls";

function StylePreview({ comp }: { comp: CanvasComp }) {
  const isCircle = isCircleType(comp.type);

  return (
    <div className="rounded-lg bg-deep-void border border-warm-wood/60 h-20 flex items-center justify-center overflow-hidden">
      {comp.type === "text" ? (
        <span
          style={{
            color: comp.textColor ?? "#e8d5b8",

            fontFamily: "var(--font-display)",

            fontWeight: 700,

            fontSize: Math.min(28, comp.fontSize ?? 18),

            opacity: comp.opacity / 100,
          }}
        >
          {comp.text || "Aa"}
        </span>
      ) : (
        <div
          style={{
            position: "relative",

            width: 48,

            height:
              comp.type === "card" ||
              comp.type === "deck" ||
              isSilhouetteType(comp.type)
                ? 60
                : 48,

            backgroundColor: isChromeless(comp.type)
              ? "transparent"
              : safeColor(comp.fill, "#1a2535"),

            backgroundImage: comp.image ? `url("${comp.image}")` : undefined,

            backgroundSize: "cover",

            backgroundPosition: "center",

            border: isChromeless(comp.type)
              ? "none"
              : `${comp.strokeWidth}px solid ${safeColor(comp.stroke, "transparent")}`,

            borderRadius: isCircle ? "50%" : comp.cornerRadius,

            opacity: comp.opacity / 100,
          }}
        >
          {isSilhouetteType(comp.type) ? (
            <SilhouetteShape comp={comp} />
          ) : !comp.image ? (
            <ShapeInner comp={comp} />
          ) : null}
        </div>
      )}
    </div>
  );
}

export function StylePanel({
  comp,

  onChange,
}: {
  comp: CanvasComp;

  onChange: (p: Partial<CanvasComp>) => void;
}) {
  const maxDim = Math.max(comp.width, comp.height);

  return (
    <div className="space-y-5">
      <StylePreview comp={comp} />

      {comp.type === "text" ? (
        <>
          <ColorField
            label="Text Color"
            value={comp.textColor ?? "#e8d5b8"}
            onChange={(v) => onChange({ textColor: v })}
          />

          <div>
            <SliderField
              label="Font size"
              value={comp.fontSize ?? 18}
              min={6}
              max={120}
              unit="px"
              onChange={(fontSize) => onChange({ fontSize })}
            />

            <div className="mt-2">
              <Presets
                options={[
                  { label: "S", value: 14 },

                  { label: "M", value: 24 },

                  { label: "L", value: 40 },

                  { label: "XL", value: 64 },
                ]}
                isActive={(v) => (comp.fontSize ?? 18) === v}
                onPick={(fontSize) => onChange({ fontSize })}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <ColorField
            label="Fill"
            value={comp.fill}
            onChange={(v) => onChange({ fill: v })}
            allowTransparent
          />

          <div className="h-px bg-warm-wood" />

          <ColorField
            label="Stroke"
            value={comp.stroke}
            onChange={(v) => onChange({ stroke: v })}
            allowTransparent
          />

          <SliderField
            label="Stroke width"
            value={comp.strokeWidth}
            min={0}
            max={20}
            unit="px"
            onChange={(strokeWidth) => onChange({ strokeWidth })}
          />

          {comp.type !== "token" && (
            <div>
              <SliderField
                label="Corner radius"
                value={comp.cornerRadius}
                min={0}
                max={Math.round(maxDim / 2)}
                unit="px"
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
          )}
        </>
      )}

      <div className="h-px bg-warm-wood" />

      <SliderField
        label="Opacity"
        value={comp.opacity}
        min={0}
        max={100}
        unit="%"
        onChange={(opacity) => onChange({ opacity })}
      />
    </div>
  );
}


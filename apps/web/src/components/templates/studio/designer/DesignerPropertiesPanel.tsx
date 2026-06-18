"use client";

import type { DesignLayer, FaceDesign } from "./designer-model";
import { BLEND_MODES, duplicateLayer } from "./designer-model";
import { SectionLabel, Stepper, SliderField, ColorField, Presets } from "../panels/controls";

interface DesignerPropertiesPanelProps {
  face: FaceDesign;
  selectedId: string | null;
  onChange: (layers: DesignLayer[]) => void;
  onSelect: (id: string | null) => void;
}

export function DesignerPropertiesPanel({ face, selectedId, onChange, onSelect }: DesignerPropertiesPanelProps) {
  const layer = face.layers.find((l) => l.id === selectedId);

  const patch = (p: Partial<DesignLayer>) =>
    onChange(face.layers.map((l) => (l.id === selectedId ? { ...l, ...p } : l)));

  if (!layer) {
    return (
      <p className="text-2xs text-soft-gray-dark font-ui text-center py-8 px-2 leading-relaxed">
        Select a layer on the canvas (or in the layer list) to edit its properties here.
      </p>
    );
  }

  const duplicate = () => {
    const copy = duplicateLayer(layer);
    onChange([...face.layers, copy]);
    onSelect(copy.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={layer.name}
          onChange={(e) => patch({ name: e.target.value })}
          className="v-input text-xs flex-1"
        />
        <button onClick={duplicate} title="Duplicate layer" className="v-tool-btn shrink-0">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <rect x="4.5" y="4.5" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.1" />
            <path d="M2 9.5V2.5A1 1 0 013 1.5h7" stroke="currentColor" strokeWidth="1.1" />
          </svg>
        </button>
      </div>

      <div>
        <SectionLabel>Transform</SectionLabel>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <Stepper label="X %" value={layer.x * 100} onChange={(v) => patch({ x: v / 100 })} min={-50} max={150} />
          <Stepper label="Y %" value={layer.y * 100} onChange={(v) => patch({ y: v / 100 })} min={-50} max={150} />
          <Stepper label="W %" value={layer.w * 100} onChange={(v) => patch({ w: Math.max(1, v) / 100 })} min={1} max={200} />
          <Stepper label="H %" value={layer.h * 100} onChange={(v) => patch({ h: Math.max(1, v) / 100 })} min={1} max={200} />
          <Stepper label="Rotation°" value={layer.rotation} onChange={(v) => patch({ rotation: v })} min={-360} max={360} />
        </div>
      </div>

      <div>
        <SectionLabel>Appearance</SectionLabel>
        <div className="space-y-2.5">
          <SliderField label="Opacity" value={layer.opacity} onChange={(v) => patch({ opacity: v })} min={0} max={100} unit="%" />
          <label className="block">
            <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Blend mode</span>
            <select
              className="v-input text-xs w-full"
              value={layer.blend}
              onChange={(e) => patch({ blend: e.target.value as DesignLayer["blend"] })}
            >
              {BLEND_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>
      </div>

      {layer.type === "text" && (
        <div>
          <SectionLabel>Text</SectionLabel>
          <div className="space-y-2.5">
            <textarea
              value={layer.text ?? ""}
              onChange={(e) => patch({ text: e.target.value })}
              rows={2}
              className="v-input text-xs w-full resize-none"
              placeholder="Tap to type… (or double-click the layer on canvas)"
            />
            <ColorField label="Color" value={layer.color ?? "#1a1410"} onChange={(v) => patch({ color: v })} />
            <Stepper label="Size (px)" value={layer.fontSize ?? 24} onChange={(v) => patch({ fontSize: v })} min={6} max={200} />
            <div>
              <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Font</span>
              <Presets
                options={[{ label: "Serif", value: "serif" }, { label: "Sans", value: "sans" }, { label: "Mono", value: "mono" }]}
                isActive={(v) => (layer.fontFamily ?? "serif") === v}
                onPick={(v) => patch({ fontFamily: (v as DesignLayer["fontFamily"])! })}
              />
            </div>
            <div>
              <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Align</span>
              <Presets
                options={[{ label: "Left", value: "left" }, { label: "Center", value: "center" }, { label: "Right", value: "right" }]}
                isActive={(v) => (layer.align ?? "center") === v}
                onPick={(v) => patch({ align: (v as DesignLayer["align"])! })}
              />
            </div>
            <div>
              <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Weight</span>
              <Presets
                options={[{ label: "Normal", value: "normal" }, { label: "Bold", value: "bold" }]}
                isActive={(v) => (layer.weight ?? "normal") === v}
                onPick={(v) => patch({ weight: (v as DesignLayer["weight"])! })}
              />
            </div>
          </div>
        </div>
      )}

      {(layer.type === "rect" || layer.type === "ellipse") && (
        <div>
          <SectionLabel>Fill & stroke</SectionLabel>
          <div className="space-y-2.5">
            <ColorField label="Fill" value={layer.fill ?? "#7c5cff"} onChange={(v) => patch({ fill: v })} allowTransparent />
            <ColorField label="Stroke" value={layer.stroke || "transparent"} onChange={(v) => patch({ stroke: v === "transparent" ? "" : v })} allowTransparent />
            <Stepper label="Stroke width" value={layer.strokeWidth ?? 0} onChange={(v) => patch({ strokeWidth: v })} min={0} max={40} />
            {layer.type === "rect" && (
              <Stepper label="Corner radius" value={layer.cornerRadius ?? 0} onChange={(v) => patch({ cornerRadius: v })} min={0} max={200} />
            )}
          </div>
        </div>
      )}

      {layer.type === "line" && (
        <div>
          <SectionLabel>Line</SectionLabel>
          <div className="space-y-2.5">
            <ColorField label="Color" value={layer.color ?? "#f5c451"} onChange={(v) => patch({ color: v })} />
            <Stepper label="Thickness" value={layer.strokeWidth ?? 3} onChange={(v) => patch({ strokeWidth: v })} min={1} max={40} />
            <div>
              <span className="text-2xs text-soft-gray-dark font-ui block mb-1">Direction</span>
              <Presets
                options={[
                  { label: "—", value: "horizontal" }, { label: "|", value: "vertical" },
                  { label: "\\", value: "diagonal-down" }, { label: "/", value: "diagonal-up" },
                ]}
                isActive={(v) => (layer.direction ?? "horizontal") === v}
                onPick={(v) => patch({ direction: (v as DesignLayer["direction"])! })}
              />
            </div>
            <label className="flex items-center gap-2 text-2xs font-ui text-soft-gray">
              <input type="checkbox" checked={!!layer.dashed} onChange={(e) => patch({ dashed: e.target.checked })} />
              Dashed
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

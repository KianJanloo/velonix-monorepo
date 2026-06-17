"use client";

import type { DesignLayer, FaceDesign } from "./designer-model";
import { BLEND_MODES } from "./designer-model";

interface DesignerPropertiesPanelProps {
  face: FaceDesign;
  selectedId: string | null;
  onChange: (layers: DesignLayer[]) => void;
}

const row =
  "flex items-center justify-between gap-2 text-2xs font-ui text-soft-gray";
const input = "v-input text-2xs w-24";

export function DesignerPropertiesPanel({
  face,
  selectedId,
  onChange,
}: DesignerPropertiesPanelProps) {
  const layer = face.layers.find((l) => l.id === selectedId);

  const patch = (p: Partial<DesignLayer>) =>
    onChange(
      face.layers.map((l) => (l.id === selectedId ? { ...l, ...p } : l)),
    );

  if (!layer) {
    return (
      <p className="text-2xs text-soft-gray-dark font-ui text-center py-6">
        Select a layer to edit its properties.
      </p>
    );
  }

  return (
    <div className="space-y-2.5">
      <label className={row}>
        Name
        <input
          className={input}
          value={layer.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className={row}>
          X
          <input
            className={input}
            type="number"
            step={1}
            value={Math.round(layer.x * 100)}
            onChange={(e) => patch({ x: Number(e.target.value) / 100 })}
          />
        </label>
        <label className={row}>
          Y
          <input
            className={input}
            type="number"
            step={1}
            value={Math.round(layer.y * 100)}
            onChange={(e) => patch({ y: Number(e.target.value) / 100 })}
          />
        </label>
        <label className={row}>
          W
          <input
            className={input}
            type="number"
            step={1}
            value={Math.round(layer.w * 100)}
            onChange={(e) => patch({ w: Number(e.target.value) / 100 })}
          />
        </label>
        <label className={row}>
          H
          <input
            className={input}
            type="number"
            step={1}
            value={Math.round(layer.h * 100)}
            onChange={(e) => patch({ h: Number(e.target.value) / 100 })}
          />
        </label>
        <label className={row}>
          Rotate
          <input
            className={input}
            type="number"
            value={layer.rotation}
            onChange={(e) => patch({ rotation: Number(e.target.value) })}
          />
        </label>
        <label className={row}>
          Opacity
          <input
            className={input}
            type="number"
            min={0}
            max={100}
            value={layer.opacity}
            onChange={(e) => patch({ opacity: Number(e.target.value) })}
          />
        </label>
      </div>

      <label className={row}>
        Blend mode
        <select
          className={input}
          value={layer.blend}
          onChange={(e) =>
            patch({ blend: e.target.value as DesignLayer["blend"] })
          }
        >
          {BLEND_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {layer.type === "text" && (
        <>
          <label className={row}>
            Text
            <input
              className={input}
              value={layer.text ?? ""}
              onChange={(e) => patch({ text: e.target.value })}
            />
          </label>
          <label className={row}>
            Color
            <input
              className={input}
              type="color"
              value={layer.color ?? "#000000"}
              onChange={(e) => patch({ color: e.target.value })}
            />
          </label>
          <label className={row}>
            Size
            <input
              className={input}
              type="number"
              value={layer.fontSize ?? 24}
              onChange={(e) => patch({ fontSize: Number(e.target.value) })}
            />
          </label>
          <label className={row}>
            Align
            <select
              className={input}
              value={layer.align}
              onChange={(e) =>
                patch({ align: (e.target.value as DesignLayer["align"])! })
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className={row}>
            Weight
            <select
              className={input}
              value={layer.weight}
              onChange={(e) =>
                patch({ weight: (e.target.value as DesignLayer["weight"])! })
              }
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
            </select>
          </label>
        </>
      )}

      {(layer.type === "rect" || layer.type === "ellipse") && (
        <>
          <label className={row}>
            Fill
            <input
              className={input}
              type="color"
              value={layer.fill ?? "#888888"}
              onChange={(e) => patch({ fill: e.target.value })}
            />
          </label>
          <label className={row}>
            Stroke
            <input
              className={input}
              type="color"
              value={layer.stroke || "#000000"}
              onChange={(e) => patch({ stroke: e.target.value })}
            />
          </label>
          <label className={row}>
            Stroke width
            <input
              className={input}
              type="number"
              value={layer.strokeWidth ?? 0}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
            />
          </label>
          {layer.type === "rect" && (
            <label className={row}>
              Corner radius
              <input
                className={input}
                type="number"
                value={layer.cornerRadius ?? 0}
                onChange={(e) =>
                  patch({ cornerRadius: Number(e.target.value) })
                }
              />
            </label>
          )}
        </>
      )}

      {layer.type === "line" && (
        <>
          <label className={row}>
            Color
            <input
              className={input}
              type="color"
              value={layer.color ?? "#000000"}
              onChange={(e) => patch({ color: e.target.value })}
            />
          </label>
          <label className={row}>
            Thickness
            <input
              className={input}
              type="number"
              value={layer.strokeWidth ?? 2}
              onChange={(e) => patch({ strokeWidth: Number(e.target.value) })}
            />
          </label>
        </>
      )}
    </div>
  );
}

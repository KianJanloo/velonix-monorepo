"use client";

import { useRef } from "react";
import { useImageUpload } from "@/hooks/useUpload";
import type { DesignLayer, FaceDesign, LayerType } from "./designer-model";
import { makeLayer } from "./designer-model";

interface DesignerLayersPanelProps {
  face: FaceDesign;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (layers: DesignLayer[]) => void;
}

const ADD_BUTTONS: { type: LayerType; label: string }[] = [
  { type: "text", label: "+ Text" },
  { type: "rect", label: "+ Rect" },
  { type: "ellipse", label: "+ Ellipse" },
  { type: "line", label: "+ Line" },
  { type: "image", label: "+ Image" },
];

export function DesignerLayersPanel({
  face,
  selectedId,
  onSelect,
  onChange,
}: DesignerLayersPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { upload } = useImageUpload();

  const addLayer = async (type: LayerType) => {
    if (type === "image") {
      fileRef.current?.click();
      return;
    }
    const layer = makeLayer(type);
    onChange([...face.layers, layer]);
    onSelect(layer.id);
  };

  const onFilePicked = async (file: File | undefined) => {
    if (!file) return;
    const url = await upload(file);
    if (!url) return;
    const layer = makeLayer("image");
    layer.src = url;
    onChange([...face.layers, layer]);
    onSelect(layer.id);
  };

  const move = (id: string, dir: "up" | "down") => {
    const i = face.layers.findIndex((l) => l.id === id);
    if (i < 0) return;
    const j = dir === "up" ? i + 1 : i - 1;
    if (j < 0 || j >= face.layers.length) return;
    const next = [...face.layers];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {ADD_BUTTONS.map((b) => (
          <button
            key={b.type}
            onClick={() => addLayer(b.type)}
            className="px-2 py-1 text-2xs font-ui rounded bg-warm-wood text-parchment-light hover:bg-warm-wood/70"
          >
            {b.label}
          </button>
        ))}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFilePicked(e.target.files?.[0])}
        />
      </div>

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {[...face.layers].reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-2xs font-ui ${
              layer.id === selectedId
                ? "bg-emerald-ghost text-emerald-glow"
                : "text-soft-gray hover:bg-warm-wood"
            }`}
          >
            <span className="flex-1 truncate">{layer.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(
                  face.layers.map((l) =>
                    l.id === layer.id ? { ...l, visible: !l.visible } : l,
                  ),
                );
              }}
              className="opacity-70 hover:opacity-100"
            >
              {layer.visible ? "👁" : "—"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(
                  face.layers.map((l) =>
                    l.id === layer.id ? { ...l, locked: !l.locked } : l,
                  ),
                );
              }}
              className="opacity-70 hover:opacity-100"
            >
              {layer.locked ? "🔒" : "🔓"}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                move(layer.id, "up");
              }}
              className="opacity-70 hover:opacity-100"
            >
              ↑
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                move(layer.id, "down");
              }}
              className="opacity-70 hover:opacity-100"
            >
              ↓
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(face.layers.filter((l) => l.id !== layer.id));
                if (selectedId === layer.id) onSelect(null);
              }}
              className="opacity-70 hover:opacity-100 hover:text-crimson-flame"
            >
              ✕
            </button>
          </div>
        ))}
        {face.layers.length === 0 && (
          <p className="text-2xs text-soft-gray-dark font-ui text-center py-3">
            No layers yet — add one above.
          </p>
        )}
      </div>
    </div>
  );
}

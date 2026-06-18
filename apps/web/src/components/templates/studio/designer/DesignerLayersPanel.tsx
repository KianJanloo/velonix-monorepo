"use client";

import { useRef } from "react";
import { useImageUpload } from "@/hooks/useUpload";
import type { DesignLayer, FaceDesign, LayerType } from "./designer-model";
import { makeLayer, duplicateLayer } from "./designer-model";
import { EyeOpen, EyeOff, LockClosed, LockOpen } from "../panels/controls";

interface DesignerLayersPanelProps {
  face: FaceDesign;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (layers: DesignLayer[]) => void;
}

const ADD_BUTTONS: { type: LayerType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "rect", label: "Rect" },
  { type: "ellipse", label: "Ellipse" },
  { type: "line", label: "Line" },
  { type: "image", label: "Image" },
];

export function DesignerLayersPanel({ face, selectedId, onSelect, onChange }: DesignerLayersPanelProps) {
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

  const duplicate = (id: string) => {
    const l = face.layers.find((x) => x.id === id);
    if (!l) return;
    const copy = duplicateLayer(l);
    onChange([...face.layers, copy]);
    onSelect(copy.id);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {ADD_BUTTONS.map((b) => (
          <button
            key={b.type}
            onClick={() => addLayer(b.type)}
            className="px-2 py-1.5 text-2xs font-ui font-semibold rounded-md bg-warm-wood/50 text-parchment-light hover:bg-warm-wood transition-colors"
          >
            + {b.label}
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

      <div className="space-y-1 max-h-[60vh] overflow-y-auto">
        {[...face.layers].reverse().map((layer) => (
          <div
            key={layer.id}
            onClick={() => onSelect(layer.id)}
            className={`group flex items-center gap-1 px-2 py-2 rounded-md cursor-pointer text-2xs font-ui transition-colors ${
              layer.id === selectedId ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/40" : "text-soft-gray hover:bg-warm-wood/40"
            }`}
          >
            <span className="flex-1 truncate">{layer.name}</span>
            <button onClick={(e) => { e.stopPropagation(); onChange(face.layers.map((l) => l.id === layer.id ? { ...l, visible: !l.visible } : l)); }} className="opacity-60 hover:opacity-100 p-0.5">
              {layer.visible ? EyeOpen : EyeOff}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onChange(face.layers.map((l) => l.id === layer.id ? { ...l, locked: !l.locked } : l)); }} className="opacity-60 hover:opacity-100 p-0.5">
              {layer.locked ? LockClosed : LockOpen}
            </button>
            <button onClick={(e) => { e.stopPropagation(); move(layer.id, "up"); }} title="Bring forward" className="opacity-60 hover:opacity-100 px-0.5">▲</button>
            <button onClick={(e) => { e.stopPropagation(); move(layer.id, "down"); }} title="Send backward" className="opacity-60 hover:opacity-100 px-0.5">▼</button>
            <button onClick={(e) => { e.stopPropagation(); duplicate(layer.id); }} title="Duplicate" className="opacity-60 hover:opacity-100 px-0.5">
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><rect x="4.5" y="4.5" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.1" /><path d="M2 9.5V2.5A1 1 0 013 1.5h7" stroke="currentColor" strokeWidth="1.1" /></svg>
            </button>
            <button onClick={(e) => { e.stopPropagation(); onChange(face.layers.filter((l) => l.id !== layer.id)); if (selectedId === layer.id) onSelect(null); }} className="opacity-60 hover:opacity-100 hover:text-crimson-flame px-0.5">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}
        {face.layers.length === 0 && (
          <p className="text-2xs text-soft-gray-dark font-ui text-center py-4">No layers yet — add one above.</p>
        )}
      </div>
    </div>
  );
}

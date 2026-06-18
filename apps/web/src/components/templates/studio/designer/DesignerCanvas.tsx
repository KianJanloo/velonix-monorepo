"use client";

import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DesignLayer, FaceDesign } from "./designer-model";

interface DesignerCanvasProps {
  face: FaceDesign;
  widthPx: number;
  heightPx: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (layers: DesignLayer[]) => void;
  bleedGuide?: boolean;
}

type DragMode = "move" | "resize-se" | "resize-sw" | "resize-ne" | "resize-nw" | "rotate";

const FONT_STACK: Record<string, string> = {
  serif: "Georgia, serif",
  sans: "Helvetica, Arial, sans-serif",
  mono: "'Courier New', monospace",
};

export function DesignerCanvas({
  face, widthPx, heightPx, selectedId, onSelect, onChange, bleedGuide,
}: DesignerCanvasProps) {
  const dragRef = useRef<{
    mode: DragMode; id: string; sx: number; sy: number;
    ox: number; oy: number; ow: number; oh: number; orot: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const updateLayer = (id: string, patch: Partial<DesignLayer>) =>
    onChange(face.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const beginDrag = (e: ReactPointerEvent, id: string, mode: DragMode) => {
    e.stopPropagation();
    const layer = face.layers.find((l) => l.id === id);
    if (!layer || layer.locked) return;
    onSelect(id);
    setEditingTextId(null);
    dragRef.current = {
      mode, id, sx: e.clientX, sy: e.clientY,
      ox: layer.x, oy: layer.y, ow: layer.w, oh: layer.h, orot: layer.rotation,
    };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / widthPx;
    const dy = (e.clientY - d.sy) / heightPx;

    if (d.mode === "move") {
      updateLayer(d.id, { x: d.ox + dx, y: d.oy + dy });
    } else if (d.mode === "rotate") {
      const deg = (Math.atan2(e.clientY - d.sy, e.clientX - d.sx) * 180) / Math.PI;
      updateLayer(d.id, { rotation: Math.round(d.orot + deg) });
    } else if (d.mode === "resize-se") {
      updateLayer(d.id, { w: Math.max(0.03, d.ow + dx), h: Math.max(0.03, d.oh + dy) });
    } else if (d.mode === "resize-ne") {
      updateLayer(d.id, { y: d.oy + dy, w: Math.max(0.03, d.ow + dx), h: Math.max(0.03, d.oh - dy) });
    } else if (d.mode === "resize-sw") {
      updateLayer(d.id, { x: d.ox + dx, w: Math.max(0.03, d.ow - dx), h: Math.max(0.03, d.oh + dy) });
    } else if (d.mode === "resize-nw") {
      updateLayer(d.id, { x: d.ox + dx, y: d.oy + dy, w: Math.max(0.03, d.ow - dx), h: Math.max(0.03, d.oh - dy) });
    }
  };

  const endDrag = () => { dragRef.current = null; };

  const handle = (mode: DragMode, style: React.CSSProperties) => (
    <div
      onPointerDown={(e) => beginDrag(e, selectedId!, mode)}
      style={{ position: "absolute", width: 11, height: 11, background: "#3ddc97", borderRadius: 3, border: "1.5px solid #0a0a0a", zIndex: 5, ...style }}
    />
  );

  return (
    <div
      onPointerDown={() => { onSelect(null); setEditingTextId(null); }}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{
        position: "relative",
        width: widthPx,
        height: heightPx,
        backgroundImage:
          "linear-gradient(45deg,#2a2a2a 25%,transparent 25%),linear-gradient(-45deg,#2a2a2a 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#2a2a2a 75%),linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)",
        backgroundSize: "16px 16px",
        backgroundPosition: "0 0,0 8px,8px -8px,-8px 0px",
        backgroundColor: "#1a1a1a",
        border: "1px solid rgba(245,196,81,0.3)",
        borderRadius: 6,
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      {bleedGuide && (
        <div
          className="absolute pointer-events-none border border-dashed border-crimson-flame/60"
          style={{ left: "3%", top: "3%", width: "94%", height: "94%" }}
        />
      )}

      {face.layers.map((layer) => {
        const sel = layer.id === selectedId;
        const editing = layer.id === editingTextId;
        const lw = layer.w * widthPx;
        const lh = layer.h * heightPx;
        const style = {
          position: "absolute" as const,
          left: layer.x * widthPx,
          top: layer.y * heightPx,
          width: lw,
          height: lh,
          transform: `rotate(${layer.rotation}deg)`,
          opacity: layer.visible ? layer.opacity / 100 : 0,
          mixBlendMode: layer.blend === "normal" ? undefined : layer.blend,
          cursor: layer.locked ? "default" : "move",
          outline: sel ? "1.5px solid #3ddc97" : "none",
        };

        return (
          <div
            key={layer.id}
            style={style}
            onPointerDown={(e) => beginDrag(e, layer.id, "move")}
            onDoubleClick={() => { if (layer.type === "text" && !layer.locked) { onSelect(layer.id); setEditingTextId(layer.id); } }}
          >
            {layer.type === "rect" && (
              <div style={{ width: "100%", height: "100%", background: layer.fill, border: layer.stroke ? `${layer.strokeWidth}px solid ${layer.stroke}` : undefined, borderRadius: layer.cornerRadius }} />
            )}
            {layer.type === "ellipse" && (
              <div style={{ width: "100%", height: "100%", background: layer.fill, border: layer.stroke ? `${layer.strokeWidth}px solid ${layer.stroke}` : undefined, borderRadius: "50%" }} />
            )}
            {layer.type === "line" && (
              <svg width={lw} height={lh} style={{ display: "block", overflow: "visible" }}>
                <line
                  {...lineCoords(layer.direction, lw, lh)}
                  stroke={layer.color}
                  strokeWidth={layer.strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={layer.dashed ? `${(layer.strokeWidth ?? 3) * 2.5} ${(layer.strokeWidth ?? 3) * 1.8}` : undefined}
                />
              </svg>
            )}
            {layer.type === "text" && (
              editing ? (
                <textarea
                  autoFocus
                  defaultValue={layer.text}
                  onPointerDown={(e) => e.stopPropagation()}
                  onBlur={(e) => { updateLayer(layer.id, { text: e.target.value }); setEditingTextId(null); }}
                  onKeyDown={(e) => { if (e.key === "Escape") setEditingTextId(null); }}
                  style={{
                    width: "100%", height: "100%", resize: "none", border: "1px dashed #3ddc97", outline: "none",
                    background: "rgba(0,0,0,0.4)", color: layer.color, fontSize: layer.fontSize,
                    fontWeight: layer.weight === "bold" ? 700 : 400, fontFamily: FONT_STACK[layer.fontFamily ?? "serif"],
                    textAlign: layer.align ?? "center", padding: 2,
                  }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%", display: "flex", alignItems: "center",
                  justifyContent: layer.align === "left" ? "flex-start" : layer.align === "right" ? "flex-end" : "center",
                  color: layer.color, fontSize: layer.fontSize, fontWeight: layer.weight === "bold" ? 700 : 400,
                  fontFamily: FONT_STACK[layer.fontFamily ?? "serif"], whiteSpace: "pre-wrap", overflow: "hidden",
                }}>
                  {layer.text || <span style={{ opacity: 0.4 }}>Double-click to edit…</span>}
                </div>
              )
            )}
            {layer.type === "image" && layer.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={layer.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
            )}

            {sel && !layer.locked && !editing && (
              <>
                {handle("resize-nw", { left: -6, top: -6, cursor: "nwse-resize" })}
                {handle("resize-ne", { right: -6, top: -6, cursor: "nesw-resize" })}
                {handle("resize-sw", { left: -6, bottom: -6, cursor: "nesw-resize" })}
                {handle("resize-se", { right: -6, bottom: -6, cursor: "nwse-resize" })}
                <div
                  onPointerDown={(e) => beginDrag(e, layer.id, "rotate")}
                  style={{ position: "absolute", left: "50%", top: -20, width: 9, height: 9, marginLeft: -4.5, background: "#f5c451", borderRadius: "50%", cursor: "grab", border: "1.5px solid #0a0a0a", zIndex: 5 }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function lineCoords(direction: DesignLayer["direction"], w: number, h: number) {
  switch (direction) {
    case "vertical": return { x1: w / 2, y1: 0, x2: w / 2, y2: h };
    case "diagonal-down": return { x1: 0, y1: 0, x2: w, y2: h };
    case "diagonal-up": return { x1: 0, y1: h, x2: w, y2: 0 };
    default: return { x1: 0, y1: h / 2, x2: w, y2: h / 2 };
  }
}

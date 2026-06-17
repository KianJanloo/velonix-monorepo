"use client";

import { useRef } from "react";
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

type DragMode = "move" | "resize" | "rotate";

export function DesignerCanvas({
  face,
  widthPx,
  heightPx,
  selectedId,
  onSelect,
  onChange,
  bleedGuide,
}: DesignerCanvasProps) {
  const dragRef = useRef<{
    mode: DragMode;
    id: string;
    sx: number;
    sy: number;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
    orot: number;
  } | null>(null);

  const updateLayer = (id: string, patch: Partial<DesignLayer>) =>
    onChange(face.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const beginDrag = (e: ReactPointerEvent, id: string, mode: DragMode) => {
    e.stopPropagation();
    const layer = face.layers.find((l) => l.id === id);
    if (!layer || layer.locked) return;
    onSelect(id);
    dragRef.current = {
      mode,
      id,
      sx: e.clientX,
      sy: e.clientY,
      ox: layer.x,
      oy: layer.y,
      ow: layer.w,
      oh: layer.h,
      orot: layer.rotation,
    };
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.sx) / widthPx;
    const dy = (e.clientY - d.sy) / heightPx;
    if (d.mode === "move") {
      updateLayer(d.id, { x: d.ox + dx, y: d.oy + dy });
    } else if (d.mode === "resize") {
      updateLayer(d.id, {
        w: Math.max(0.03, d.ow + dx),
        h: Math.max(0.03, d.oh + dy),
      });
    } else if (d.mode === "rotate") {
      const deg =
        (Math.atan2(e.clientY - d.sy, e.clientX - d.sx) * 180) / Math.PI;
      updateLayer(d.id, { rotation: Math.round(d.orot + deg) });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  return (
    <div
      onPointerDown={() => onSelect(null)}
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
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {bleedGuide && (
        <div
          className="absolute pointer-events-none border border-dashed border-crimson-flame/50"
          style={{ left: "3%", top: "3%", width: "94%", height: "94%" }}
        />
      )}

      {face.layers.map((layer) => {
        const sel = layer.id === selectedId;
        const style = {
          position: "absolute" as const,
          left: layer.x * widthPx,
          top: layer.y * heightPx,
          width: layer.w * widthPx,
          height: layer.h * heightPx,
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
          >
            {layer.type === "rect" && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: layer.fill,
                  border: layer.stroke
                    ? `${layer.strokeWidth}px solid ${layer.stroke}`
                    : undefined,
                  borderRadius: layer.cornerRadius,
                }}
              />
            )}
            {layer.type === "ellipse" && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: layer.fill,
                  border: layer.stroke
                    ? `${layer.strokeWidth}px solid ${layer.stroke}`
                    : undefined,
                  borderRadius: "50%",
                }}
              />
            )}
            {layer.type === "line" && (
              <div
                style={{
                  width: "100%",
                  height: layer.strokeWidth,
                  background: layer.color,
                  marginTop: "50%",
                }}
              />
            )}
            {layer.type === "text" && (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    layer.align === "left"
                      ? "flex-start"
                      : layer.align === "right"
                        ? "flex-end"
                        : "center",
                  color: layer.color,
                  fontSize: layer.fontSize,
                  fontWeight: layer.weight === "bold" ? 700 : 400,
                  fontFamily: "Georgia, serif",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                }}
              >
                {layer.text}
              </div>
            )}
            {layer.type === "image" && layer.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={layer.src}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
            )}

            {sel && !layer.locked && (
              <>
                <div
                  onPointerDown={(e) => beginDrag(e, layer.id, "resize")}
                  style={{
                    position: "absolute",
                    right: -5,
                    bottom: -5,
                    width: 10,
                    height: 10,
                    background: "#3ddc97",
                    borderRadius: 2,
                    cursor: "nwse-resize",
                  }}
                />
                <div
                  onPointerDown={(e) => beginDrag(e, layer.id, "rotate")}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: -18,
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    background: "#f5c451",
                    borderRadius: "50%",
                    cursor: "grab",
                  }}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

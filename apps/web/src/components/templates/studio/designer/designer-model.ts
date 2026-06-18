/**
 * Data model for the artwork designer: a small, self-contained layered
 * 2D editor used to design the *actual printed artwork* of a component
 * (front/back faces, individual die faces, or game-box panels) — distinct
 * from the main studio canvas, which only arranges components on the board.
 */

export type LayerType = "text" | "rect" | "ellipse" | "line" | "image";

export interface DesignLayer {
  id: string;
  type: LayerType;
  name: string;
  x: number; // 0-1, fraction of face width
  y: number; // 0-1, fraction of face height
  w: number; // 0-1
  h: number; // 0-1
  rotation: number; // degrees
  opacity: number; // 0-100
  visible: boolean;
  locked: boolean;
  blend: "normal" | "multiply" | "screen" | "overlay";
  // type-specific
  text?: string;
  fontSize?: number; // px at 1x design scale
  color?: string;
  align?: "left" | "center" | "right";
  weight?: "normal" | "bold";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  src?: string;
  fontFamily?: "serif" | "sans" | "mono";
  /** Line layers: drawn corner-to-corner of the bounding box along this axis,
   * so resizing/rotating the layer normally (like every other layer type)
   * actually changes the line's length and angle. */
  direction?: "horizontal" | "vertical" | "diagonal-down" | "diagonal-up";
  dashed?: boolean;
}

export interface FaceDesign {
  layers: DesignLayer[];
}

export interface ComponentDesignData {
  /** Keys: "front" | "back" for most types, "1".."20" for die faces. */
  faces: Record<string, FaceDesign>;
}

export type BoxPanelKey = "front" | "back" | "left" | "right" | "top" | "bottom";

export interface BoxDesignData {
  panels: Record<string, FaceDesign>;
}

export const BOX_PANELS: BoxPanelKey[] = ["front", "back", "left", "right", "top", "bottom"];

export const EMPTY_FACE: FaceDesign = { layers: [] };

export function emptyComponentDesign(): ComponentDesignData {
  return { faces: { front: { layers: [] }, back: { layers: [] } } };
}

export function emptyBoxDesign(): BoxDesignData {
  return {
    panels: {
      front: { layers: [] }, back: { layers: [] }, left: { layers: [] },
      right: { layers: [] }, top: { layers: [] }, bottom: { layers: [] },
    },
  };
}

let layerSeq = 0;
export function makeLayer(type: LayerType): DesignLayer {
  layerSeq += 1;
  const base: DesignLayer = {
    id: `layer-${Date.now()}-${layerSeq}`,
    type,
    name: type[0]!.toUpperCase() + type.slice(1),
    x: 0.2, y: 0.2, w: 0.4, h: 0.2,
    rotation: 0, opacity: 100, visible: true, locked: false, blend: "normal",
  };
  switch (type) {
    case "text":
      return { ...base, text: "Text", fontSize: 28, color: "#1a1410", align: "center", weight: "bold", h: 0.12 };
    case "rect":
      return { ...base, fill: "#7c5cff", stroke: "", strokeWidth: 0, cornerRadius: 0 };
    case "ellipse":
      return { ...base, fill: "#3ddc97", stroke: "" };
    case "line":
      return { ...base, color: "#f5c451", strokeWidth: 3, w: 0.4, h: 0.15, direction: "horizontal", dashed: false };
    case "image":
      return { ...base, w: 0.5, h: 0.5 };
  }
}

export function duplicateLayer(layer: DesignLayer): DesignLayer {
  layerSeq += 1;
  return { ...layer, id: `layer-${Date.now()}-${layerSeq}`, name: `${layer.name} copy`, x: layer.x + 0.03, y: layer.y + 0.03 };
}

export const BLEND_MODES: DesignLayer["blend"][] = ["normal", "multiply", "screen", "overlay"];

/**
 * Renders a face's layer stack into an offscreen canvas using the exact
 * same geometry as the live editor (fractional x/y/w/h of the face size),
 * so the exported PNG matches what was designed pixel-for-pixel (aside
 * from minor font-rendering differences across browsers).
 */
export async function rasterizeFace(face: FaceDesign, widthPx: number, heightPx: number): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, widthPx, heightPx);

  for (const layer of face.layers) {
    if (!layer.visible) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity / 100));
    ctx.globalCompositeOperation = layer.blend === "normal" ? "source-over" : layer.blend;

    const lx = layer.x * widthPx;
    const ly = layer.y * heightPx;
    const lw = layer.w * widthPx;
    const lh = layer.h * heightPx;
    const cx = lx + lw / 2;
    const cy = ly + lh / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-lw / 2, -lh / 2);

    if (layer.type === "rect") {
      ctx.fillStyle = layer.fill || "#888";
      const r = Math.min(layer.cornerRadius ?? 0, lw / 2, lh / 2);
      if (r > 0) {
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.arcTo(lw, 0, lw, lh, r);
        ctx.arcTo(lw, lh, 0, lh, r);
        ctx.arcTo(0, lh, 0, 0, r);
        ctx.arcTo(0, 0, lw, 0, r);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, lw, lh);
      }
      if (layer.stroke && layer.strokeWidth) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth;
        ctx.strokeRect(0, 0, lw, lh);
      }
    } else if (layer.type === "ellipse") {
      ctx.beginPath();
      ctx.ellipse(lw / 2, lh / 2, lw / 2, lh / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = layer.fill || "#888";
      ctx.fill();
      if (layer.stroke && layer.strokeWidth) {
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = layer.strokeWidth;
        ctx.stroke();
      }
    } else if (layer.type === "line") {
      ctx.strokeStyle = layer.color || "#000";
      ctx.lineWidth = layer.strokeWidth || 2;
      ctx.lineCap = "round";
      if (layer.dashed) ctx.setLineDash([layer.strokeWidth ? layer.strokeWidth * 2.5 : 8, layer.strokeWidth ? layer.strokeWidth * 1.8 : 6]);
      ctx.beginPath();
      switch (layer.direction) {
        case "vertical": ctx.moveTo(lw / 2, 0); ctx.lineTo(lw / 2, lh); break;
        case "diagonal-down": ctx.moveTo(0, 0); ctx.lineTo(lw, lh); break;
        case "diagonal-up": ctx.moveTo(0, lh); ctx.lineTo(lw, 0); break;
        default: ctx.moveTo(0, lh / 2); ctx.lineTo(lw, lh / 2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (layer.type === "text") {
      ctx.fillStyle = layer.color || "#000";
      const size = layer.fontSize || 24;
      const fam = layer.fontFamily === "sans" ? "Helvetica, Arial, sans-serif" : layer.fontFamily === "mono" ? "'Courier New', monospace" : "Georgia, serif";
      ctx.font = `${layer.weight === "bold" ? "bold " : ""}${size}px ${fam}`;
      ctx.textAlign = layer.align || "center";
      ctx.textBaseline = "middle";
      const tx = layer.align === "left" ? 0 : layer.align === "right" ? lw : lw / 2;
      ctx.fillText(layer.text || "", tx, lh / 2, lw);
    } else if (layer.type === "image" && layer.src) {
      try {
        const img = await loadImage(layer.src);
        ctx.drawImage(img, 0, 0, lw, lh);
      } catch { /* skip broken image */ }
    }

    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Converts a data: URL into a Blob for upload. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta!.match(/data:(.*);base64/)?.[1] || "image/png";
  const bin = atob(b64!);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

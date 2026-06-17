"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useImageUpload } from "@/hooks/useUpload";
import type { CanvasComp } from "../core";

import {
  BOX_PANELS,
  rasterizeFace,
  dataUrlToBlob,
  type ComponentDesignData,
  type BoxDesignData,
  type FaceDesign,
  type DesignLayer,
} from "./designer-model";
import { DesignerCanvas } from "./DesignerCanvas";
import { DesignerLayersPanel } from "./DesignerLayersPanel";
import { DesignerPropertiesPanel } from "./DesignerPropertiesPanel";
import { MiniMeshPreview } from "@/components/three/MiniMeshPreview";

type Mode = "face" | "dice" | "box";

interface ComponentDesignerModalProps {
  mode: Mode;
  comp?: CanvasComp;
  design: ComponentDesignData | BoxDesignData;
  onSaveComponentDesign?: (
    design: ComponentDesignData,
    patch: Partial<CanvasComp>,
  ) => void;
  onSaveBoxDesign?: (design: BoxDesignData) => void;
  onClose: () => void;
}

const MAX_CANVAS_DIM = 480;

export function ComponentDesignerModal({
  mode,
  comp,
  design,
  onSaveComponentDesign,
  onSaveBoxDesign,
  onClose,
}: ComponentDesignerModalProps) {
  const { upload, uploading } = useImageUpload();

  const faceKeys = useMemo(() => {
    if (mode === "box") return BOX_PANELS as string[];
    if (mode === "dice")
      return Array.from({ length: comp?.dieFaces ?? 6 }, (_, i) =>
        String(i + 1),
      );
    return ["front", "back"];
  }, [mode, comp?.dieFaces]);

  const [activeKey, setActiveKey] = useState(faceKeys[0]!);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [show3d, setShow3d] = useState(false);
  const [local, setLocal] = useState<ComponentDesignData | BoxDesignData>(() =>
    structuredClone(design),
  );

  const faces: Record<string, FaceDesign> =
    mode === "box"
      ? (local as BoxDesignData).panels
      : (local as ComponentDesignData).faces;
  const activeFace: FaceDesign = faces[activeKey] ?? { layers: [] };

  const setActiveLayers = (layers: DesignLayer[]) => {
    setLocal((prev) => {
      const clone = structuredClone(prev) as typeof prev;
      const bucket =
        mode === "box"
          ? (clone as BoxDesignData).panels
          : (clone as ComponentDesignData).faces;
      bucket[activeKey] = { layers };
      return clone;
    });
  };

  // Aspect ratio for the canvas: physical component size for face/dice,
  // a sensible default for box panels (front/back are the largest faces).
  const aspect = comp && comp.width > 0 ? comp.width / comp.height : 1;
  const canvasW = aspect >= 1 ? MAX_CANVAS_DIM : MAX_CANVAS_DIM * aspect;
  const canvasH = aspect >= 1 ? MAX_CANVAS_DIM / aspect : MAX_CANVAS_DIM;

  const handleDone = async () => {
    if (mode === "box") {
      onSaveBoxDesign?.(local as BoxDesignData);
      toast.success("Box design saved.");
      onClose();
      return;
    }

    const data = local as ComponentDesignData;
    const patch: Partial<CanvasComp> = {};

    const frontKey = mode === "dice" ? "1" : "front";
    const frontFace = data.faces[frontKey];
    if (frontFace && frontFace.layers.length > 0) {
      const dataUrl = await rasterizeFace(
        frontFace,
        Math.round(canvasW * 2),
        Math.round(canvasH * 2),
      );
      const file = new File([dataUrlToBlob(dataUrl)], "artwork.png", {
        type: "image/png",
      });
      const url = await upload(file);
      if (url) patch.image = url;
    }
    if (mode === "face") {
      const backFace = data.faces["back"];
      if (backFace && backFace.layers.length > 0) {
        const dataUrl = await rasterizeFace(
          backFace,
          Math.round(canvasW * 2),
          Math.round(canvasH * 2),
        );
        const file = new File([dataUrlToBlob(dataUrl)], "artwork-back.png", {
          type: "image/png",
        });
        const url = await upload(file);
        if (url) patch.backImage = url;
      }
    }

    onSaveComponentDesign?.(data, patch);
    toast.success("Artwork saved.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-deep-void/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-warm-wood shrink-0">
        <h2 className="font-display text-sm font-bold text-parchment-light">
          {mode === "box"
            ? "Design game box"
            : mode === "dice"
              ? `Design dice faces — ${comp?.name}`
              : `Design artwork — ${comp?.name}`}
        </h2>
        <div className="flex items-center gap-2">
          {(mode === "dice" || mode === "box") && (
            <button
              onClick={() => setShow3d((v) => !v)}
              className="px-3 py-1.5 text-2xs font-ui rounded bg-warm-wood text-parchment-light hover:bg-warm-wood/70"
            >
              {show3d ? "Hide 3D preview" : "3D preview"}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-2xs font-ui rounded text-soft-gray hover:text-parchment-light"
          >
            Cancel
          </button>
          <button
            onClick={handleDone}
            disabled={uploading}
            className="px-4 py-1.5 text-2xs font-ui font-bold rounded bg-emerald-glow text-deep-void hover:bg-emerald-glow/90 disabled:opacity-60"
          >
            {uploading ? "Saving…" : "Done"}
          </button>
        </div>
      </div>

      {/* Face tabs */}
      <div className="flex gap-1 px-4 py-2 border-b border-warm-wood overflow-x-auto shrink-0">
        {faceKeys.map((k) => (
          <button
            key={k}
            onClick={() => {
              setActiveKey(k);
              setSelectedLayerId(null);
            }}
            className={`px-3 py-1 text-2xs font-ui rounded uppercase shrink-0 ${k === activeKey ? "bg-emerald-glow text-deep-void" : "bg-rich-wood-dark text-soft-gray hover:text-parchment-light"}`}
          >
            {mode === "dice" ? `Face ${k}` : k}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 border-r border-warm-wood p-3 overflow-y-auto shrink-0">
          <DesignerLayersPanel
            face={activeFace}
            selectedId={selectedLayerId}
            onSelect={setSelectedLayerId}
            onChange={setActiveLayers}
          />
        </aside>

        <main className="flex-1 flex items-center justify-center p-6 overflow-auto">
          {show3d && (mode === "dice" || mode === "box") ? (
            <Preview3D
              mode={mode}
              comp={comp!}
              faces={faces}
              canvasW={canvasW}
              canvasH={canvasH}
            />
          ) : (
            <DesignerCanvas
              face={activeFace}
              widthPx={canvasW}
              heightPx={canvasH}
              selectedId={selectedLayerId}
              onSelect={setSelectedLayerId}
              onChange={setActiveLayers}
              bleedGuide={mode !== "box"}
            />
          )}
        </main>

        <aside className="w-60 border-l border-warm-wood p-3 overflow-y-auto shrink-0">
          <DesignerPropertiesPanel
            face={activeFace}
            selectedId={selectedLayerId}
            onChange={setActiveLayers}
          />
        </aside>
      </div>
    </div>
  );
}

/**
 * 3D preview. Reliable, real per-face texturing only for the box (always
 * 6 rectangular panels — a perfect BoxGeometry fit) and the standard d6 die.
 * Other die face-counts (4/8/10/12/20) don't map cleanly onto a cube, so we
 * show a labelled grid of the designed faces instead rather than guessing
 * at a 3D unwrap that can't be visually verified here.
 */
function Preview3D({
  mode,
  comp,
  faces,
  canvasW,
  canvasH,
}: {
  mode: "dice" | "box";
  comp?: CanvasComp;
  faces: Record<string, FaceDesign>;
  canvasW: number;
  canvasH: number;
}) {
  const [urls, setUrls] = useState<string[] | null>(null);

  const supportsCube = mode === "box" || (comp?.dieFaces ?? 6) === 6;

  useEffect(() => {
    if (!supportsCube) {
      setUrls(null);
      return;
    }
    const keys = mode === "box" ? BOX_PANELS : ["3", "4", "1", "6", "2", "5"]; // ± x,y,z order using opposite-face pairs
    void Promise.all(
      keys.map((k) => rasterizeFace(faces[k] ?? { layers: [] }, 256, 256)),
    ).then(setUrls);
  }, [faces, mode, supportsCube]);

  if (!supportsCube) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {Object.keys(faces).map((k) => (
          <div key={k} className="text-center">
            <FaceThumb face={faces[k]!} w={canvasW / 3} h={canvasH / 3} />
            <p className="text-2xs text-soft-gray-dark font-ui mt-1">
              Face {k}
            </p>
          </div>
        ))}
        <p className="col-span-3 text-2xs text-soft-gray-dark font-ui text-center mt-2">
          3D per-face texturing is only available for the standard 6-sided die
          and the game box — this die type shows a flat reference grid instead.
        </p>
      </div>
    );
  }

  if (!urls)
    return (
      <p className="text-2xs text-soft-gray font-ui">Rendering preview…</p>
    );

  return (
    <MiniMeshPreview
      faceUrls={urls as [string, string, string, string, string, string]}
      size={mode === "box" ? [1.4, 1, 0.4] : [1, 1, 1]}
    />
  );
}

function FaceThumb({ face, w, h }: { face: FaceDesign; w: number; h: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    void rasterizeFace(face, 200, 200).then(setUrl);
  }, [face]);
  return (
    <div
      style={{
        width: w,
        height: h,
        background: "#1a1a1a",
        border: "1px solid rgba(245,196,81,0.3)",
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
    </div>
  );
}

"use client";

import { useRef, useState } from "react";

import {
  Preview2D,
  Preview3D,
} from "../core";

import type {
  CanvasComp,
} from "../core";

export function PreviewStage({
  mode,

  components,

  zoom,

  width,

  height,
}: {
  mode: string;

  components: CanvasComp[];

  zoom: number;

  width: number;

  height: number;
}) {
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );

  return (
    <div
      className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: "#0c0c0c" }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, y: e.clientY, ox: pan.x, oy: pan.y };
      }}
      onPointerMove={(e) => {
        if (drag.current)
          setPan({
            x: drag.current.ox + (e.clientX - drag.current.x),

            y: drag.current.oy + (e.clientY - drag.current.y),
          });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerLeave={() => {
        drag.current = null;
      }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,

          transition: drag.current ? "none" : "transform 0.1s",
        }}
      >
        {mode === "preview_3d" ? (
          <Preview3D components={components} width={width} height={height} />
        ) : (
          <Preview2D
            components={components}
            scale={0.8}
            width={width}
            height={height}
          />
        )}
      </div>
    </div>
  );
}


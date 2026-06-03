"use client";

import { useCallback } from "react";

import type { PointerEvent as ReactPointerEvent } from "react";

import {
  MM_TO_PX,
  TOOLS,
} from "../core";

import type {
  CanvasComp,
  ResizeHandle,
} from "../core";

import type { StudioState } from "./useStudioEditorState";
import type { StudioActions } from "./useStudioActions";

export function useStudioGestures(S: StudioState, A: StudioActions) {
  const {
    storeZoom,
    activeTool,
    setActiveTool,
    components,
    setMarquee,
    pastRef,
    futureRef,
    setSelectedId,
    panX,
    panY,
    readOnlyRef,
    inPreview,
    setMultiIds,
    selectionRef,
    dragRef,
  } = S;

  const {
    addComp,
  } = A;

  const onCompPointerDown = useCallback(
    (e: ReactPointerEvent, comp: CanvasComp) => {
      if (comp.locked || inPreview) return;

      if (e.button === 1) return; // let middle-button pan bubble to the canvas

      e.stopPropagation();

      // Selection: shift toggles into a multi-selection; clicking a grouped piece

      // selects its whole group; otherwise select just this component.

      if (e.shiftKey) {
        setMultiIds((prev) => {
          const base = prev.length ? prev : selectionRef.current;

          return base.includes(comp.id)
            ? base.filter((id) => id !== comp.id)
            : [...base, comp.id];
        });

        setSelectedId(comp.id);
      } else {
        const alreadyInSel = selectionRef.current.includes(comp.id);

        if (!alreadyInSel) setMultiIds([]);

        setSelectedId(comp.id);
      }

      if (readOnlyRef.current) return; // viewers may select but not move

      if (activeTool !== "select") return;

      pastRef.current.push(components);

      futureRef.current = [];

      // If the pressed component is part of the current selection (group or multi),

      // drag the whole set together.

      const moveIds =
        selectionRef.current.includes(comp.id) &&
        selectionRef.current.length > 1
          ? selectionRef.current
          : [comp.id];

      const multi =
        moveIds.length > 1
          ? components

              .filter((c) => moveIds.includes(c.id))

              .map((c) => ({ id: c.id, ox: c.x, oy: c.y }))
          : undefined;

      dragRef.current = {
        kind: "move",

        compId: comp.id,

        sx: e.clientX,

        sy: e.clientY,

        ox: comp.x,

        oy: comp.y,

        ow: comp.width,

        oh: comp.height,

        orot: comp.rotation,

        cxScreen: 0,

        cyScreen: 0,

        ...(multi ? { multi } : {}),
      };

      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },

    [activeTool, inPreview, components],
  );

  const onResizeStart = useCallback(
    (e: ReactPointerEvent, comp: CanvasComp, handle: ResizeHandle) => {
      if (readOnlyRef.current) return;

      pastRef.current.push(components);

      futureRef.current = [];

      dragRef.current = {
        kind: "resize",

        compId: comp.id,

        handle,

        sx: e.clientX,

        sy: e.clientY,

        ox: comp.x,

        oy: comp.y,

        ow: comp.width,

        oh: comp.height,

        orot: comp.rotation,

        cxScreen: 0,

        cyScreen: 0,
      };
    },

    [components],
  );

  const onRotateStart = useCallback(
    (e: ReactPointerEvent, comp: CanvasComp) => {
      if (readOnlyRef.current) return;

      pastRef.current.push(components);

      futureRef.current = [];

      const rect = (e.currentTarget as HTMLElement)

        .closest("[data-canvas]")

        ?.getBoundingClientRect();

      const cx =
        (comp.x + comp.width / 2) * MM_TO_PX * storeZoom +
        panX +
        (rect?.left ?? 0);

      const cy =
        (comp.y + comp.height / 2) * MM_TO_PX * storeZoom +
        panY +
        (rect?.top ?? 0);

      dragRef.current = {
        kind: "rotate",

        compId: comp.id,

        sx: e.clientX,

        sy: e.clientY,

        ox: comp.x,

        oy: comp.y,

        ow: comp.width,

        oh: comp.height,

        orot: comp.rotation,

        cxScreen: cx,

        cyScreen: cy,
      };
    },

    [components, storeZoom, panX, panY],
  );

  const onCanvasPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      // Middle mouse button → pan from anywhere on the canvas (like Figma)

      if (e.button === 1) {
        e.preventDefault();

        dragRef.current = {
          kind: "pan",

          sx: e.clientX,

          sy: e.clientY,

          ox: panX,

          oy: panY,

          ow: 0,

          oh: 0,

          orot: 0,

          cxScreen: 0,

          cyScreen: 0,
        };

        return;
      }

      if (
        e.target !== e.currentTarget &&
        !(e.target as HTMLElement).dataset.canvasbg
      )
        return;

      const tool = TOOLS.find((t) => t.id === activeTool);

      if (tool?.creates && !readOnlyRef.current) {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        const mx = (e.clientX - rect.left - panX) / (MM_TO_PX * storeZoom);

        const my = (e.clientY - rect.top - panY) / (MM_TO_PX * storeZoom);

        addComp(tool.creates, mx, my);

        setActiveTool("select");

        return;
      }

      setSelectedId(null);

      setMultiIds([]);

      if (activeTool === "hand") {
        dragRef.current = {
          kind: "pan",

          sx: e.clientX,

          sy: e.clientY,

          ox: panX,

          oy: panY,

          ow: 0,

          oh: 0,

          orot: 0,

          cxScreen: 0,

          cyScreen: 0,
        };
      } else if (activeTool === "select" && !readOnlyRef.current) {
        // Begin a rubber-band marquee selection. Store the canvas rect + pan so

        // pointer-move can map screen coords → board mm without stale state.

        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

        dragRef.current = {
          kind: "marquee",

          sx: e.clientX,

          sy: e.clientY,

          ox: rect.left,

          oy: rect.top,

          ow: 0,

          oh: 0,

          orot: 0,

          cxScreen: panX,

          cyScreen: panY,
        };

        setMarquee({
          x: e.clientX - rect.left,

          y: e.clientY - rect.top,

          w: 0,

          h: 0,
        });
      }
    },

    [activeTool, panX, panY, storeZoom, addComp],
  );


  return {
    onCompPointerDown,
    onResizeStart,
    onRotateStart,
    onCanvasPointerDown,
  };
}

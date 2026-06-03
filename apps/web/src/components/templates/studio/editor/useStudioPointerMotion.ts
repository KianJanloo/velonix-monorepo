"use client";

import { useCallback } from "react";

import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";

import {
  useStudioCollab,
  } from "@/hooks/useStudioCollab";

import {
  MM_TO_PX,
  GRID_MM,
  safeNum,
  normalizeComponents,
  EMPTY_GUIDE,
} from "../core";

import type {
  CanvasComp,
  StudioPage,
  GameRule,
  GameGuide,
} from "../core";

import type { StudioState } from "./useStudioEditorState";

export function useStudioPointerMotion(S: StudioState) {
  const {
    gameId,
    snapToGrid,
    zoomIn,
    zoomOut,
    storeZoom,
    pages,
    setPages,
    canvasSizeRef,
    componentsRef,
    setMarquee,
    setComponentsRaw,
    rules,
    setRules,
    assets,
    setAssets,
    guide,
    setGuide,
    setSelectedId,
    setPanX,
    setPanY,
    readOnly,
    collabEnabled,
    applyingRemoteRef,
    pendingRemoteRef,
    collabBroadcastRef,
    readOnlyRef,
    setMultiIds,
    dragRef,
  } = S;

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const dr = dragRef.current;

      if (!dr) return;

      const z = storeZoom;

      if (dr.kind === "pan") {
        setPanX(dr.ox + (e.clientX - dr.sx));

        setPanY(dr.oy + (e.clientY - dr.sy));
      } else if (dr.kind === "move" && dr.compId) {
        let nx = dr.ox + (e.clientX - dr.sx) / (z * MM_TO_PX);

        let ny = dr.oy + (e.clientY - dr.sy) / (z * MM_TO_PX);

        if (snapToGrid) {
          nx = Math.round(nx / GRID_MM) * GRID_MM;

          ny = Math.round(ny / GRID_MM) * GRID_MM;
        }

        nx = Math.max(-50, Math.min(nx, canvasSizeRef.current.w));

        ny = Math.max(-50, Math.min(ny, canvasSizeRef.current.h));

        if (dr.multi) {
          // Move the whole group/selection by the same delta as the primary.

          const dxmm = Math.round(nx) - dr.ox;

          const dymm = Math.round(ny) - dr.oy;

          const orig = new Map(dr.multi.map((m) => [m.id, m]));

          setComponentsRaw((prev) =>
            prev.map((c) => {
              const o = orig.get(c.id);

              return o ? { ...c, x: o.ox + dxmm, y: o.oy + dymm } : c;
            }),
          );
        } else {
          setComponentsRaw((prev) =>
            prev.map((c) =>
              c.id === dr.compId
                ? { ...c, x: Math.round(nx), y: Math.round(ny) }
                : c,
            ),
          );
        }
      } else if (dr.kind === "resize" && dr.compId) {
        const dx = (e.clientX - dr.sx) / (z * MM_TO_PX);

        const dy = (e.clientY - dr.sy) / (z * MM_TO_PX);

        const h = dr.handle!;

        let { ox, oy, ow, oh } = dr;

        if (h.includes("e")) ow = dr.ow + dx;

        if (h.includes("s")) oh = dr.oh + dy;

        if (h.includes("w")) {
          ow = dr.ow - dx;

          ox = dr.ox + dx;
        }

        if (h.includes("n")) {
          oh = dr.oh - dy;

          oy = dr.oy + dy;
        }

        ow = Math.max(8, ow);

        oh = Math.max(8, oh);

        setComponentsRaw((prev) =>
          prev.map((c) =>
            c.id === dr.compId
              ? {
                  ...c,

                  x: Math.round(ox),

                  y: Math.round(oy),

                  width: Math.round(ow),

                  height: Math.round(oh),
                }
              : c,
          ),
        );
      } else if (dr.kind === "rotate" && dr.compId) {
        const ang =
          (Math.atan2(e.clientY - dr.cyScreen, e.clientX - dr.cxScreen) * 180) /
            Math.PI +
          90;

        const snapped = e.shiftKey
          ? Math.round(ang / 15) * 15
          : Math.round(ang);

        setComponentsRaw((prev) =>
          prev.map((c) =>
            c.id === dr.compId ? { ...c, rotation: snapped } : c,
          ),
        );
      } else if (dr.kind === "marquee") {
        // Draw the band (canvas-relative px) and select intersecting components.

        const relLeft = Math.min(dr.sx, e.clientX) - dr.ox;

        const relTop = Math.min(dr.sy, e.clientY) - dr.oy;

        const w = Math.abs(e.clientX - dr.sx);

        const h = Math.abs(e.clientY - dr.sy);

        setMarquee({ x: relLeft, y: relTop, w, h });

        // Map to board mm using the pan captured at drag start.

        const x0 = (relLeft - dr.cxScreen) / (z * MM_TO_PX);

        const y0 = (relTop - dr.cyScreen) / (z * MM_TO_PX);

        const x1 = x0 + w / (z * MM_TO_PX);

        const y1 = y0 + h / (z * MM_TO_PX);

        const hits = componentsRef.current

          .filter(
            (c) =>
              c.x < x1 && c.x + c.width > x0 && c.y < y1 && c.y + c.height > y0,
          )

          .map((c) => c.id);

        setMultiIds(hits);

        setSelectedId(hits.length ? hits[hits.length - 1]! : null);
      }
    },

    [storeZoom, snapToGrid],
  );

  // Apply a snapshot received from a peer. Defer while the user is mid-drag so

  // we don't yank a component out from under them; flush on pointer up.

  const applyRemoteSnapshot = useCallback(
    (snap: unknown) => {
      if (dragRef.current) {
        pendingRemoteRef.current = snap;

        return;
      }

      const data = snap as {
        components?: CanvasComp[];

        pages?: StudioPage[];

        rules?: GameRule[];

        assets?: string[];

        guide?: GameGuide;
      } | null;

      if (!data) return;

      applyingRemoteRef.current = true;

      if (Array.isArray(data.pages)) {
        setPages(
          data.pages.map((p, i) => ({
            id: p.id || `page-${Date.now()}-${i}`,

            name: p.name || `Page ${i + 1}`,

            width: safeNum(p.width as number, 800) || 800,

            height: safeNum(p.height as number, 600) || 600,

            components: normalizeComponents(p.components),
          })),
        );
      } else if (Array.isArray(data.components)) {
        setComponentsRaw(normalizeComponents(data.components));
      }

      if (Array.isArray(data.rules)) setRules(data.rules);

      if (Array.isArray(data.assets)) setAssets(data.assets);

      if (data.guide) setGuide({ ...EMPTY_GUIDE, ...data.guide });
    },

    [setComponentsRaw],
  );

  const onPointerUp = useCallback(() => {
    const wasMarquee = dragRef.current?.kind === "marquee";

    dragRef.current = null;

    if (wasMarquee) setMarquee(null);

    if (pendingRemoteRef.current) {
      const snap = pendingRemoteRef.current;

      pendingRemoteRef.current = null;

      applyRemoteSnapshot(snap);
    }
  }, [applyRemoteSnapshot]);

  // Connect to the live collaboration room (presence + snapshot relay).

  const {
    presence,

    role: liveRole,

    connected: collabConnected,

    broadcast,
  } = useStudioCollab({
    gameId,

    enabled: collabEnabled,

    onRemoteUpdate: applyRemoteSnapshot,

    getSnapshot: () => ({ pages, rules, assets, guide }),
  });

  collabBroadcastRef.current = collabEnabled ? broadcast : null;

  const effectiveReadOnly = readOnly || liveRole === "viewer";

  readOnlyRef.current = effectiveReadOnly;

  const onWheel = useCallback(
    (e: ReactWheelEvent) => {
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    },

    [zoomIn, zoomOut],
  );


  return {
    onPointerMove,
    applyRemoteSnapshot,
    onPointerUp,
    presence,
    liveRole,
    collabConnected,
    broadcast,
    effectiveReadOnly,
    onWheel,
  };
}

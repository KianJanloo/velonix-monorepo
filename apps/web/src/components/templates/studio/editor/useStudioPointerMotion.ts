"use client";

import { useCallback, useRef } from "react";

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

// ── Guide types ───────────────────────────────────────────────────────────────

/** Standard snap / alignment guide line rendered across the full canvas. */
export interface AlignGuide {
  axis: "h" | "v";
  pos: number; // mm
  kind: "edge" | "center";
}

/**
 * Spacing / distance guide shown when Alt is held while dragging.
 * Renders a dimension line with an arrow and a pixel/mm label between
 * the dragged component and its nearest neighbour on each side.
 */
export interface SpacingGuide {
  /** Axis the gap is measured along. */
  axis: "h" | "v";
  /** Start of the gap (mm). */
  start: number;
  /** End of the gap (mm). */
  end: number;
  /**
   * Perpendicular position where the dimension line sits (mm).
   * For a horizontal gap this is the mid-Y; for vertical mid-X.
   */
  perp: number;
  /** Gap in mm (already rounded). */
  gapMm: number;
  /** Gap in pixels at 1× zoom (already rounded). */
  gapPx: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeSpacingGuides(
  dragged: CanvasComp,
  others: CanvasComp[],
): SpacingGuide[] {
  const guides: SpacingGuide[] = [];

  const dL = dragged.x;
  const dR = dragged.x + dragged.width;
  const dT = dragged.y;
  const dB = dragged.y + dragged.height;
  const dMidY = dragged.y + dragged.height / 2;
  const dMidX = dragged.x + dragged.width / 2;

  // For each other component, compute horizontal and vertical gaps
  let closestLeft = -Infinity;   // nearest right edge to our left
  let closestRight = Infinity;   // nearest left edge to our right
  let closestTop = -Infinity;    // nearest bottom edge above us
  let closestBottom = Infinity;  // nearest top edge below us

  for (const c of others) {
    if (!c.visible) continue;
    const cL = c.x, cR = c.x + c.width, cT = c.y, cB = c.y + c.height;

    // Horizontal neighbours (vertically overlapping)
    const vOverlap = dT < cB && dB > cT;
    if (vOverlap) {
      if (cR <= dL && cR > closestLeft) closestLeft = cR;
      if (cL >= dR && cL < closestRight) closestRight = cL;
    }

    // Vertical neighbours (horizontally overlapping)
    const hOverlap = dL < cR && dR > cL;
    if (hOverlap) {
      if (cB <= dT && cB > closestTop) closestTop = cB;
      if (cT >= dB && cT < closestBottom) closestBottom = cT;
    }
  }

  // Left gap
  if (closestLeft > -Infinity) {
    const gapMm = Math.max(0, Math.round(dL - closestLeft));
    guides.push({
      axis: "h", start: closestLeft, end: dL,
      perp: dMidY, gapMm, gapPx: Math.round(gapMm * MM_TO_PX),
    });
  }
  // Right gap
  if (closestRight < Infinity) {
    const gapMm = Math.max(0, Math.round(closestRight - dR));
    guides.push({
      axis: "h", start: dR, end: closestRight,
      perp: dMidY, gapMm, gapPx: Math.round(gapMm * MM_TO_PX),
    });
  }
  // Top gap
  if (closestTop > -Infinity) {
    const gapMm = Math.max(0, Math.round(dT - closestTop));
    guides.push({
      axis: "v", start: closestTop, end: dT,
      perp: dMidX, gapMm, gapPx: Math.round(gapMm * MM_TO_PX),
    });
  }
  // Bottom gap
  if (closestBottom < Infinity) {
    const gapMm = Math.max(0, Math.round(closestBottom - dB));
    guides.push({
      axis: "v", start: dB, end: closestBottom,
      perp: dMidX, gapMm, gapPx: Math.round(gapMm * MM_TO_PX),
    });
  }

  return guides;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStudioPointerMotion(S: StudioState) {
  const {
    gameId,
    snapToGrid,
    zoomIn,
    zoomOut,
    storeZoom,
    pages,
    setPages,
    canvasSizeRef: _canvasSizeRef,
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

  /** Spacing guides computed when Alt is held during a move drag. */
  const spacingGuidesRef = useRef<SpacingGuide[]>([]);
  /** Whether Alt is currently held (read by EditorBody each render frame). */
  const altActiveRef = useRef(false);

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const dr = dragRef.current;

      if (!dr) return;

      altActiveRef.current = e.altKey;

      const z = storeZoom;

      if (dr.kind === "pan") {
        setPanX(dr.ox + (e.clientX - dr.sx));

        setPanY(dr.oy + (e.clientY - dr.sy));

        spacingGuidesRef.current = [];
      } else if (dr.kind === "move" && dr.compId) {
        let nx = dr.ox + (e.clientX - dr.sx) / (z * MM_TO_PX);

        let ny = dr.oy + (e.clientY - dr.sy) / (z * MM_TO_PX);

        if (snapToGrid) {
          nx = Math.round(nx / GRID_MM) * GRID_MM;

          ny = Math.round(ny / GRID_MM) * GRID_MM;
        }



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

        // Compute Alt spacing guides
        if (e.altKey) {
          const all = componentsRef.current;
          const dragged = all.find((c) => c.id === dr.compId);
          const moveIds = dr.multi ? dr.multi.map((m) => m.id) : [dr.compId];
          const others = all.filter((c) => !moveIds.includes(c.id));
          if (dragged) {
            spacingGuidesRef.current = computeSpacingGuides(dragged, others);
          }
        } else {
          spacingGuidesRef.current = [];
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

        // Show dimension guides on resize too when Alt held
        if (e.altKey) {
          const all = componentsRef.current;
          const dragged = all.find((c) => c.id === dr.compId);
          const others = all.filter((c) => c.id !== dr.compId);
          if (dragged) spacingGuidesRef.current = computeSpacingGuides(dragged, others);
        } else {
          spacingGuidesRef.current = [];
        }
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

        spacingGuidesRef.current = [];
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

        spacingGuidesRef.current = [];
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

    altActiveRef.current = false;

    spacingGuidesRef.current = [];

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
    spacingGuidesRef,
    altActiveRef,
  };
}

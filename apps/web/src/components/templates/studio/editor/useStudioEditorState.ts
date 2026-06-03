"use client";

import { useState, useRef, useCallback, useEffect } from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useStudioStore,
  selectZoomPercent,
} from "@/stores/studioStore";

import {
  useGame,
  usePublishGame,
} from "@/hooks/useGames";

import {
  useMyMembership,
} from "@/hooks/useCollaborators";

import {
  useStudio,
} from "@/hooks/useStudio";

import {
  usePlan,
} from "@/hooks/usePlan";

import {
  STUDIO_TUTORIAL_KEY,
} from "@/components/templates/StudioTutorial";

import {
  safeNum,
  EMPTY_GUIDE,
  INITIAL,
  normalizeComponents,
} from "../core";

import type {
  CanvasComp,
  StudioPage,
  GameRule,
  GameGuide,
  ToolId,
  ResizeHandle,
} from "../core";

export function useStudioEditorState(gameId: string) {
  const isNew = gameId === "new";

  const router = useRouter();

  const {
    mode,

    setMode,

    leftPanelTab,

    setLeftPanelTab,

    rightPanelTab,

    setRightPanelTab,

    showGrid,

    toggleGrid,

    snapToGrid,

    toggleSnap,

    isDirty,

    isSaving,

    zoomIn,

    zoomOut,

    resetZoom,

    markDirty,
  } = useStudioStore();

  const zoomPercent = useStudioStore(selectZoomPercent);

  const storeZoom = useStudioStore((s) => s.viewport.zoom);

  const { saveNow } = useStudio(gameId);

  const plan = usePlan();

  const [activeTool, setActiveTool] = useState<ToolId>("select");

  // ── Pages (multiple canvases) ──────────────────────────────────────────────

  const firstPageId = useRef(`page-${Date.now()}`).current;

  const [pages, setPages] = useState<StudioPage[]>(() => [
    {
      id: firstPageId,

      name: "Main Board",

      width: 800,

      height: 600,

      components: INITIAL,
    },
  ]);

  const [activePageId, setActivePageId] = useState<string>(firstPageId);

  const activePageIdRef = useRef(activePageId);

  activePageIdRef.current = activePageId;

  const activePage = pages.find((p) => p.id === activePageId) ?? pages[0]!;

  const components = activePage.components;

  const canvasW = activePage.width;

  const canvasH = activePage.height;

  const canvasSizeRef = useRef({ w: canvasW, h: canvasH });

  canvasSizeRef.current = { w: canvasW, h: canvasH };

  // Live mirror of the active page's components for use inside pointer handlers.

  const componentsRef = useRef<CanvasComp[]>(components);

  componentsRef.current = components;

  // Rubber-band marquee rectangle (canvas-relative px), shown while drag-selecting.

  const [marquee, setMarquee] = useState<{
    x: number;

    y: number;

    w: number;

    h: number;
  } | null>(null);

  // Stable setter that always targets the *current* active page (read via ref).

  const setComponentsRaw = useCallback(
    (updater: CanvasComp[] | ((prev: CanvasComp[]) => CanvasComp[])) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id === activePageIdRef.current
            ? {
                ...p,

                components:
                  typeof updater === "function"
                    ? (updater as (c: CanvasComp[]) => CanvasComp[])(
                        p.components,
                      )
                    : updater,
              }
            : p,
        ),
      );
    },

    [],
  );

  const [rules, setRules] = useState<GameRule[]>([]);

  const [assets, setAssets] = useState<string[]>([]);

  const [guide, setGuide] = useState<GameGuide>(EMPTY_GUIDE);

  const [guideOpen, setGuideOpen] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);

  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);

  const pastRef = useRef<CanvasComp[][]>([]);

  const futureRef = useRef<CanvasComp[][]>([]);

  const [, forceRerender] = useState(0);

  const commit = useCallback((next: CanvasComp[], pushHistory = true) => {
    setComponentsRaw((prev) => {
      if (pushHistory) {
        pastRef.current.push(prev);

        if (pastRef.current.length > 80) pastRef.current.shift();

        futureRef.current = [];
      }

      return next;
    });
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(
    INITIAL[0]?.id ?? null,
  );

  const [panX, setPanX] = useState(60);

  const [panY, setPanY] = useState(60);

  const [leftOpen, setLeftOpen] = useState(true);

  const [rightOpen, setRightOpen] = useState(true);

  // Editing requires a desktop-sized screen

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");

    const update = () => setIsMobile(mq.matches);

    update();

    mq.addEventListener("change", update);

    return () => mq.removeEventListener("change", update);
  }, []);

  // First-visit studio walkthrough (desktop only).

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(max-width: 1023px)").matches) return;

    if (!localStorage.getItem(STUDIO_TUTORIAL_KEY)) setTutorialOpen(true);
  }, []);

  const closeTutorial = useCallback(() => {
    setTutorialOpen(false);

    try {
      localStorage.setItem(STUDIO_TUTORIAL_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const clipboardRef = useRef<CanvasComp | null>(null);

  const { data: game } = useGame(isNew ? "" : gameId);

  const publish = usePublishGame(gameId);

  // ── Collaboration ────────────────────────────────────────────────────────

  const { data: membership } = useMyMembership(gameId, !isNew);

  const myRole =
    membership?.kind === "owner"
      ? "owner"
      : membership?.kind === "collaborator"
        ? membership.role
        : null;

  const readOnly = myRole === "viewer";

  const collabEnabled = !isNew && !!membership && membership.kind !== "none";

  const [shareOpen, setShareOpen] = useState(false);

  const [tutorialOpen, setTutorialOpen] = useState(false);

  const [marketOpen, setMarketOpen] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);

  const [menu, setMenu] = useState<{
    x: number;

    y: number;

    targetId: string | null;

    mx?: number;

    my?: number;
  } | null>(null);

  // Refs used to coordinate remote (peer) snapshot application with local edits.

  const applyingRemoteRef = useRef(false);

  const pendingRemoteRef = useRef<unknown>(null);

  const broadcastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const collabBroadcastRef = useRef<((snapshot: unknown) => void) | null>(null);

  const readOnlyRef = useRef(false);

  const selectedComp = components.find((c) => c.id === selectedId) ?? null;

  const inPreview = mode !== "design";

  // ── Selection set (supports groups + shift multi-select) ─────────────────────

  // `selectedId` is the primary (drives Props/Style); `multiIds` is an explicit

  // shift-selection. The effective set expands to a component's group siblings.

  const [multiIds, setMultiIds] = useState<string[]>([]);

  const selectionIds: string[] = (() => {
    if (multiIds.length) return multiIds;

    if (!selectedId) return [];

    const g = selectedComp?.groupId;

    if (g) return components.filter((c) => c.groupId === g).map((c) => c.id);

    return [selectedId];
  })();

  const selectionRef = useRef<string[]>([]);

  selectionRef.current = selectionIds;

  const selectedGroupIds = Array.from(
    new Set(
      selectionIds

        .map((id) => components.find((c) => c.id === id)?.groupId)

        .filter(Boolean) as string[],
    ),
  );

  const canGroup = selectionIds.length >= 2;

  const canUngroup = selectedGroupIds.length > 0;

  // ── Hydration ──────────────────────────────────────────────────────────────

  const hydratedRef = useRef<string | null>(null);

  const suppressDirtyRef = useRef(false);

  useEffect(() => {
    if (!game || hydratedRef.current === game.id) return;

    hydratedRef.current = game.id;

    const data = game.studioData as {
      components?: CanvasComp[];

      pages?: StudioPage[];

      rules?: GameRule[];

      assets?: string[];

      guide?: GameGuide;
    } | null;

    if (Array.isArray(data?.pages) && data!.pages.length > 0) {
      suppressDirtyRef.current = true;

      const loaded = data!.pages.map((p, i) => ({
        id: p.id || `page-${Date.now()}-${i}`,

        name: p.name || `Page ${i + 1}`,

        width: safeNum(p.width as number, 800) || 800,

        height: safeNum(p.height as number, 600) || 600,

        components: normalizeComponents(p.components),
      }));

      setPages(loaded);

      setActivePageId(loaded[0]!.id);

      setSelectedId(loaded[0]!.components[0]?.id ?? null);
    } else if (Array.isArray(data?.components) && data!.components.length > 0) {
      // Legacy single-canvas project → migrate to one page.

      suppressDirtyRef.current = true;

      const page: StudioPage = {
        id: firstPageId,

        name: "Main Board",

        width: 800,

        height: 600,

        components: normalizeComponents(data!.components),
      };

      setPages([page]);

      setActivePageId(firstPageId);

      setSelectedId(page.components[0]?.id ?? null);
    }

    if (Array.isArray(data?.rules)) setRules(data!.rules);

    if (Array.isArray(data?.assets)) setAssets(data!.assets);

    if (data?.guide) setGuide({ ...EMPTY_GUIDE, ...data.guide });
  }, [game, firstPageId]);

  // ── Dirty tracking ─────────────────────────────────────────────────────────

  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;

      return;
    }

    if (suppressDirtyRef.current) {
      suppressDirtyRef.current = false;

      return;
    }

    // A change applied from a remote peer must not be re-broadcast or re-dirtied.

    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false;

      return;
    }

    markDirty();

    // Broadcast the local change to other editors in the room (debounced).

    if (collabBroadcastRef.current) {
      if (broadcastTimerRef.current) clearTimeout(broadcastTimerRef.current);

      broadcastTimerRef.current = setTimeout(() => {
        collabBroadcastRef.current?.({ pages, rules, assets, guide });
      }, 250);
    }
  }, [pages, rules, assets, guide, markDirty]);



  const dragRef = useRef<{
    kind: "move" | "pan" | "resize" | "rotate" | "marquee";

    compId?: string;

    handle?: ResizeHandle;

    sx: number;

    sy: number;

    ox: number;

    oy: number;

    ow: number;

    oh: number;

    orot: number;

    cxScreen: number;

    cyScreen: number;

    /** For group moves: original positions of every component being dragged. */

    multi?: { id: string; ox: number; oy: number }[];
  } | null>(null);


  return {
    gameId, dragRef, isNew, router, mode, setMode,
    leftPanelTab, setLeftPanelTab, rightPanelTab, setRightPanelTab, showGrid, toggleGrid,
    snapToGrid, toggleSnap, isDirty, isSaving, zoomIn, zoomOut,
    resetZoom, markDirty, zoomPercent, storeZoom, saveNow, plan,
    activeTool, setActiveTool, firstPageId, pages, setPages, activePageId,
    setActivePageId, activePageIdRef, activePage, components, canvasW, canvasH,
    canvasSizeRef, componentsRef, marquee, setMarquee, setComponentsRaw, rules,
    setRules, assets, setAssets, guide, setGuide, guideOpen,
    setGuideOpen, renamingId, setRenamingId, renamingPageId, setRenamingPageId, pastRef,
    futureRef, forceRerender, commit, selectedId, setSelectedId, panX,
    setPanX, panY, setPanY, leftOpen, setLeftOpen, rightOpen,
    setRightOpen, isMobile, setIsMobile, closeTutorial, clipboardRef, game,
    publish, membership, myRole, readOnly, collabEnabled, shareOpen,
    setShareOpen, tutorialOpen, setTutorialOpen, marketOpen, setMarketOpen, moreOpen,
    setMoreOpen, menu, setMenu, applyingRemoteRef, pendingRemoteRef, broadcastTimerRef,
    collabBroadcastRef, readOnlyRef, selectedComp, inPreview, multiIds, setMultiIds,
    selectionIds, selectionRef, selectedGroupIds, canGroup, canUngroup, hydratedRef,
    suppressDirtyRef, mountedRef,
  };
}

export type StudioState = ReturnType<typeof useStudioEditorState>;

"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";

import Link from "next/link";

import { toast } from "sonner";

import { useRouter } from "next/navigation";

import { useStudioStore, selectZoomPercent } from "@/stores/studioStore";

import { useGame, usePublishGame } from "@/hooks/useGames";

import {
  useMyMembership,
  useCollaborators,
  useInviteCollaborator,
  useUpdateCollaboratorRole,
  useRemoveCollaborator,
} from "@/hooks/useCollaborators";

import { useStudioCollab, type PresenceMember } from "@/hooks/useStudioCollab";

import {
  StudioTutorial,
  STUDIO_TUTORIAL_KEY,
} from "@/components/templates/StudioTutorial";

import { StudioMarketplace } from "@/components/templates/StudioMarketplace";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import type { CollaboratorRole } from "@velonix/types";

import { useStudio } from "@/hooks/useStudio";

import { usePlan } from "@/hooks/usePlan";

import { useImageUpload } from "@/hooks/useUpload";

// ── Studio model & render primitives (extracted to ./studio/core) ─────────────

import {
  MM_TO_PX,
  CANVAS_W_MM,
  CANVAS_H_MM,
  GRID_MM,
  safeColor,
  safeNum,
  isCircleType,
  isSilhouetteType,
  isChromeless,
  PAGE_MIN,
  PAGE_MAX,
  PAGE_SIZE_PRESETS,
  RULE_TRIGGERS,
  RULE_TARGETS,
  RULE_ACTIONS,
  RULE_TEMPLATES,
  ruleActionDef,
  buildRuleDescription,
  SCENARIO_DIFFICULTY,
  EMPTY_GUIDE,
  TYPE_DEFAULTS,
  makeComp,
  INITIAL,
  normalizeComponents,
  COMP_ICONS,
  TOOLS,
  ShapeInner,
  SilhouetteShape,
  CompView,
  Preview2D,
  Preview3D,
  ContextMenu,
} from "./studio/core";

import type {
  CompType,
  CanvasComp,
  StudioPage,
  RuleTrigger,
  RuleActionType,
  RuleTarget,
  RuleParams,
  GameRule,
  ScenarioDifficulty,
  GameScenario,
  GameGuide,
  ToolId,
  ResizeHandle,
  MenuItem,
} from "./studio/core";

// Re-export model types consumed by other modules (e.g. GameDetail).

export type {
  CanvasComp,
  GameRule,
  GameGuide,
  GameScenario,
} from "./studio/core";

// ── (model types + constants now imported from ./studio/core) ─────────────────

interface StudioLayoutProps {
  gameId: string;
}

export function StudioLayout({ gameId }: StudioLayoutProps) {
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

  // ── Mutations ──────────────────────────────────────────────────────────────

  const updateComp = useCallback(
    (id: string, patch: Partial<CanvasComp>, history = true) => {
      setComponentsRaw((prev) => {
        if (history) {
          pastRef.current.push(prev);

          futureRef.current = [];
        }

        return prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      });
    },

    [],
  );

  const addComp = useCallback(
    (
      type: CompType,

      x = 60 + Math.random() * 120,

      y = 60 + Math.random() * 90,
    ) => {
      const c = makeComp(type, x, y);

      commit([...components, c]);

      setSelectedId(c.id);

      setMultiIds([]);

      return c;
    },

    [components, commit],
  );

  const deleteSelected = useCallback(() => {
    const ids = selectionRef.current;

    if (ids.length === 0) return;

    const set = new Set(ids);

    commit(components.filter((c) => !set.has(c.id)));

    setSelectedId(null);

    setMultiIds([]);
  }, [components, commit]);

  const deleteComp = useCallback(
    (id: string) => {
      commit(components.filter((c) => c.id !== id));

      setSelectedId((prev) => (prev === id ? null : prev));

      setMultiIds((prev) => prev.filter((x) => x !== id));
    },

    [components, commit],
  );

  const duplicateSelected = useCallback(() => {
    const ids = selectionRef.current;

    if (ids.length === 0) return;

    const set = new Set(ids);

    const stamp = Date.now();

    // Preserve grouping in the copy by remapping group ids.

    const groupRemap = new Map<string, string>();

    const copies = components

      .filter((c) => set.has(c.id))

      .map((c, i) => {
        const copy: CanvasComp = {
          ...c,

          id: `${c.type}-${stamp}-${i}`,

          x: c.x + 10,

          y: c.y + 10,
        };

        if (c.groupId) {
          if (!groupRemap.has(c.groupId))
            groupRemap.set(c.groupId, `group-${stamp}`);

          copy.groupId = groupRemap.get(c.groupId)!;
        }

        return copy;
      });

    commit([...components, ...copies]);

    setSelectedId(copies[0]?.id ?? null);

    setMultiIds(copies.length > 1 ? copies.map((c) => c.id) : []);
  }, [components, commit]);

  // ── Grouping ────────────────────────────────────────────────────────────────

  // These read the live selection (selectionRef) and operate on the live

  // component list via a functional update, so they stay correct regardless of

  // when they were bound (e.g. from the keyboard handler).

  const groupSelection = useCallback(() => {
    const ids = selectionRef.current;

    if (ids.length < 2) {
      toast.info(
        "Select 2+ components to group (shift-click to add to the selection).",
      );

      return;
    }

    const gid = `group-${Date.now()}`;

    const set = new Set(ids);

    setComponentsRaw((prev) => {
      pastRef.current.push(prev);

      futureRef.current = [];

      return prev.map((c) => (set.has(c.id) ? { ...c, groupId: gid } : c));
    });

    setMultiIds([]); // selection now derives from the group
  }, [setComponentsRaw]);

  const ungroupById = useCallback(
    (groupId: string) => {
      setComponentsRaw((prev) => {
        pastRef.current.push(prev);

        futureRef.current = [];

        return prev.map((c) => {
          if (c.groupId === groupId) {
            const copy = { ...c };

            delete copy.groupId;

            return copy;
          }

          return c;
        });
      });
    },

    [setComponentsRaw],
  );

  const ungroupSelection = useCallback(() => {
    const ids = selectionRef.current;

    setComponentsRaw((prev) => {
      const groups = new Set(
        ids

          .map((id) => prev.find((c) => c.id === id)?.groupId)

          .filter(Boolean) as string[],
      );

      if (groups.size === 0) return prev;

      pastRef.current.push(prev);

      futureRef.current = [];

      return prev.map((c) => {
        if (c.groupId && groups.has(c.groupId)) {
          const copy = { ...c };

          delete copy.groupId;

          return copy;
        }

        return c;
      });
    });
  }, [setComponentsRaw]);

  const moveZ = useCallback(
    (id: string, dir: "up" | "down") => {
      const idx = components.findIndex((c) => c.id === id);

      if (idx < 0) return;

      const next = [...components];

      if (dir === "up" && idx < next.length - 1)
        [next[idx], next[idx + 1]] = [next[idx + 1]!, next[idx]!];
      else if (dir === "down" && idx > 0)
        [next[idx], next[idx - 1]] = [next[idx - 1]!, next[idx]!];

      commit(next);
    },

    [components, commit],
  );

  // ── Component marketplace (insert / publish) ───────────────────────────────

  // Drop a bought/acquired asset's components onto the active page.

  const insertAssetComponents = useCallback(
    (payload: unknown[]) => {
      const incoming = normalizeComponents(payload);

      if (incoming.length === 0) return;

      const stamp = Date.now();

      const groupRemap = new Map<string, string>();

      const placed = incoming.map((c, i) => {
        const copy: CanvasComp = {
          ...c,

          id: `${c.type}-${stamp}-${i}`,

          x: c.x + 16,

          y: c.y + 16,
        };

        if (c.groupId) {
          if (!groupRemap.has(c.groupId))
            groupRemap.set(c.groupId, `group-${stamp}`);

          copy.groupId = groupRemap.get(c.groupId)!;
        }

        return copy;
      });

      setComponentsRaw((prev) => {
        pastRef.current.push(prev);

        futureRef.current = [];

        return [...prev, ...placed];
      });

      setSelectedId(placed[0]!.id);

      setMultiIds(placed.length > 1 ? placed.map((c) => c.id) : []);

      toast.success(
        `Inserted ${placed.length} component${placed.length === 1 ? "" : "s"}.`,
      );
    },

    [setComponentsRaw],
  );

  // Deep-copy the currently selected components as a publishable payload.

  const getSelectionPayload = useCallback((): unknown[] => {
    const ids = new Set(selectionRef.current);

    return components

      .filter((c) => ids.has(c.id))

      .map((c) => {
        const { id: _id, ...rest } = c;

        void _id;

        return rest;
      });
  }, [components]);

  const reorderZ = useCallback(
    (id: string, where: "front" | "back") => {
      const c = components.find((x) => x.id === id);

      if (!c) return;

      const rest = components.filter((x) => x.id !== id);

      commit(where === "front" ? [...rest, c] : [c, ...rest]);
    },

    [components, commit],
  );

  // ── Pages ──────────────────────────────────────────────────────────────────

  const switchPage = useCallback((id: string) => {
    if (id === activePageIdRef.current) return;

    pastRef.current = [];

    futureRef.current = []; // history is per-active-canvas

    setActivePageId(id);

    setSelectedId(null);

    setMultiIds([]);
  }, []);

  const maxPages = plan.limits.maxPagesPerProject;

  const atPageLimit = maxPages !== null && pages.length >= maxPages;

  const addPage = useCallback(() => {
    if (maxPages !== null && pages.length >= maxPages) {
      toast.error(
        `Your ${plan.label} plan allows up to ${maxPages} page${maxPages === 1 ? "" : "s"} per game. Upgrade for more.`,
      );

      return;
    }

    const id = `page-${Date.now()}`;

    setPages((prev) => [
      ...prev,

      {
        id,

        name: `Page ${prev.length + 1}`,

        width: 800,

        height: 600,

        components: [],
      },
    ]);

    pastRef.current = [];

    futureRef.current = [];

    setActivePageId(id);

    setSelectedId(null);

    setMultiIds([]);
  }, [maxPages, pages.length, plan.label]);

  const deletePage = useCallback(
    (id: string) => {
      if (pages.length <= 1) return;

      const next = pages.filter((p) => p.id !== id);

      setPages(next);

      if (activePageId === id) {
        setActivePageId(next[0]!.id);

        setSelectedId(null);

        setMultiIds([]);

        pastRef.current = [];

        futureRef.current = [];
      }
    },

    [pages, activePageId],
  );

  const renamePage = useCallback((id: string, name: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, name: name.trim() || p.name } : p,
      ),
    );
  }, []);

  const resizePage = useCallback(
    (id: string, dim: "width" | "height", value: number) => {
      const v = Math.max(
        PAGE_MIN,

        Math.min(PAGE_MAX, Math.round(value) || PAGE_MIN),
      );

      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [dim]: v } : p)),
      );
    },

    [],
  );

  const setPageSize = useCallback((id: string, w: number, h: number) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, width: w, height: h } : p)),
    );
  }, []);

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();

    if (!prev) return;

    futureRef.current.push(components);

    setComponentsRaw(prev);

    forceRerender((n) => n + 1);
  }, [components]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();

    if (!next) return;

    pastRef.current.push(components);

    setComponentsRaw(next);

    forceRerender((n) => n + 1);
  }, [components]);

  const copy = useCallback(() => {
    if (selectedComp) clipboardRef.current = selectedComp;
  }, [selectedComp]);

  const paste = useCallback(() => {
    const c = clipboardRef.current;

    if (!c) return;

    const copyComp = {
      ...c,

      id: `${c.type}-${Date.now()}`,

      x: c.x + 15,

      y: c.y + 15,
    };

    commit([...components, copyComp]);

    setSelectedId(copyComp.id);
  }, [components, commit]);

  // ── Drag / resize / rotate ───────────────────────────────────────────────────

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

  // ── Context menu (right-click) ────────────────────────────────────────────

  const openCompMenu = useCallback((e: ReactMouseEvent, comp: CanvasComp) => {
    e.preventDefault();

    e.stopPropagation();

    if (readOnlyRef.current) return;

    if (!selectionRef.current.includes(comp.id)) {
      setSelectedId(comp.id);

      setMultiIds([]);
    }

    setMenu({ x: e.clientX, y: e.clientY, targetId: comp.id });
  }, []);

  const openCanvasMenu = useCallback(
    (e: ReactMouseEvent) => {
      // Only when the empty canvas (not a component) is right-clicked.

      if (
        e.target !== e.currentTarget &&
        !(e.target as HTMLElement).dataset.canvasbg
      )
        return;

      e.preventDefault();

      if (readOnlyRef.current) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

      const mx = (e.clientX - rect.left - panX) / (MM_TO_PX * storeZoom);

      const my = (e.clientY - rect.top - panY) / (MM_TO_PX * storeZoom);

      setSelectedId(null);

      setMultiIds([]);

      setMenu({ x: e.clientX, y: e.clientY, targetId: null, mx, my });
    },

    [panX, panY, storeZoom],
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  // Close the context menu on Escape.

  useEffect(() => {
    if (!menu) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  function buildMenuItems(): MenuItem[] {
    if (!menu) return [];

    if (menu.targetId) {
      const c = components.find((x) => x.id === menu.targetId);

      if (!c) return [];

      const multi = selectionIds.length > 1;

      return [
        {
          type: "item",

          label: multi ? `Duplicate (${selectionIds.length})` : "Duplicate",

          shortcut: "⌘D",

          onClick: duplicateSelected,
        },

        { type: "item", label: "Copy", shortcut: "⌘C", onClick: copy },

        { type: "sep" },

        {
          type: "item",

          label: "Bring to front",

          onClick: () => reorderZ(c.id, "front"),
        },

        {
          type: "item",

          label: "Bring forward",

          shortcut: "]",

          onClick: () => moveZ(c.id, "up"),
        },

        {
          type: "item",

          label: "Send backward",

          shortcut: "[",

          onClick: () => moveZ(c.id, "down"),
        },

        {
          type: "item",

          label: "Send to back",

          onClick: () => reorderZ(c.id, "back"),
        },

        { type: "sep" },

        ...(canGroup
          ? [
              {
                type: "item",

                label: "Group",

                shortcut: "⌘G",

                onClick: groupSelection,
              } as MenuItem,
            ]
          : []),

        ...(canUngroup
          ? [
              {
                type: "item",

                label: "Ungroup",

                shortcut: "⌘⇧G",

                onClick: ungroupSelection,
              } as MenuItem,
            ]
          : []),

        {
          type: "item",

          label: c.locked ? "Unlock" : "Lock",

          onClick: () => updateComp(c.id, { locked: !c.locked }),
        },

        {
          type: "item",

          label: c.visible ? "Hide" : "Show",

          onClick: () => updateComp(c.id, { visible: !c.visible }),
        },

        { type: "sep" },

        {
          type: "item",

          label: multi ? `Delete (${selectionIds.length})` : "Delete",

          shortcut: "⌫",

          danger: true,

          onClick: deleteSelected,
        },
      ];
    }

    // Empty-canvas menu

    return [
      {
        type: "item",

        label: "Paste",

        shortcut: "⌘V",

        disabled: !clipboardRef.current,

        onClick: paste,
      },

      { type: "sep" },

      {
        type: "item",

        label: "Add card",

        onClick: () => addComp("card", menu.mx, menu.my),
      },

      {
        type: "item",

        label: "Add token",

        onClick: () => addComp("token", menu.mx, menu.my),
      },

      {
        type: "item",

        label: "Add board",

        onClick: () => addComp("board", menu.mx, menu.my),
      },

      {
        type: "item",

        label: "Add note",

        onClick: () => addComp("note", menu.mx, menu.my),
      },
    ];
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;

      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();

        undo();

        return;
      }

      if (
        mod &&
        (e.key.toLowerCase() === "y" ||
          (e.shiftKey && e.key.toLowerCase() === "z"))
      ) {
        e.preventDefault();

        redo();

        return;
      }

      if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();

        copy();

        return;
      }

      if (mod && e.key.toLowerCase() === "v") {
        e.preventDefault();

        paste();

        return;
      }

      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();

        duplicateSelected();

        return;
      }

      if (mod && e.key.toLowerCase() === "g" && e.shiftKey) {
        e.preventDefault();

        ungroupSelection();

        return;
      }

      if (mod && e.key.toLowerCase() === "g") {
        e.preventDefault();

        groupSelection();

        return;
      }

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();

        void handleSave();

        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();

        return;
      }

      if (e.key === "Escape") {
        setSelectedId(null);

        setMultiIds([]);

        return;
      }

      if (e.key === "v" || e.key === "V") setActiveTool("select");

      if (e.key === "h" || e.key === "H") setActiveTool("hand");

      if (e.key === "t" || e.key === "T") setActiveTool("text");

      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key) &&
        selectedComp
      ) {
        e.preventDefault();

        const step = e.shiftKey ? GRID_MM : 1;

        updateComp(selectedComp.id, {
          x:
            selectedComp.x +
            (e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0),

          y:
            selectedComp.y +
            (e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0),
        });
      }
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    undo,

    redo,

    copy,

    paste,

    duplicateSelected,

    deleteSelected,

    groupSelection,

    ungroupSelection,

    selectedComp,

    updateComp,
  ]);

  // ── Save / publish ──────────────────────────────────────────────────────────

  // `components` mirrors the first page for any legacy consumer of studioData.

  const handleSave = useCallback(async () => {
    if (isNew) {
      toast.error("Create the game first.");

      return;
    }

    if (readOnlyRef.current) {
      toast.error("You have view-only access to this studio.");

      return;
    }

    await saveNow({
      pages,

      components: pages[0]?.components ?? [],

      rules,

      assets,

      guide,
    } as unknown as Record<string, unknown>);
  }, [isNew, saveNow, pages, rules, assets, guide]);

  async function handlePublish() {
    if (isNew) {
      toast.error("Create the game first.");

      return;
    }

    // Persist the design, then go to the publish settings page (price, details, submit)

    await saveNow({
      pages,

      components: pages[0]?.components ?? [],

      rules,

      assets,

      guide,
    } as unknown as Record<string, unknown>);

    router.push(`/studio/${gameId}/publish`);
  }

  // ── 3D gating ───────────────────────────────────────────────────────────────

  function handleMode(m: "design" | "preview_2d" | "preview_3d") {
    if (m === "preview_3d" && !plan.has3DPreview) {
      toast.error(
        "3D preview is a paid feature. Upgrade your plan to unlock it.",
      );

      return;
    }

    setMode(m);
  }

  const toolCursor =
    TOOLS.find((t) => t.id === activeTool)?.cursor ?? "default";

  const reversed = [...components].reverse();

  // ── Mobile: editing is desktop-only; offer preview ───────────────────────────

  if (isMobile && !inPreview) {
    return (
      <div className="min-h-screen bg-deep-void flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-warm-wood/40 border border-warm-wood flex items-center justify-center">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            className="text-royal-gold"
          >
            <rect
              x="3"
              y="4"
              width="18"
              height="13"
              rx="2"
              stroke="currentColor"
              strokeWidth="1.5"
            />

            <path
              d="M8 20h8M12 17v3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <h1 className="font-display text-xl font-bold text-parchment-light mb-2">
            Studio editing is desktop-only
          </h1>

          <p className="text-soft-gray text-sm font-ui max-w-xs">
            The design canvas needs a larger screen. You can still preview your
            game here, or open the Studio on a desktop to edit.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={() => setMode("preview_2d")}
            className="w-full py-3 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm"
          >
            Preview Game
          </button>

          <Link
            href="/dashboard"
            className="w-full py-3 rounded-xl border border-warm-wood text-parchment-light font-ui font-semibold text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Preview overlay (fullscreen, no editor chrome) ───────────────────────────

  if (inPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-deep-void flex flex-col">
        {/* minimal preview bar — responsive down to small phones */}

        <div className="h-12 bg-rich-wood-dark border-b border-warm-wood flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0">
          <span className="font-display text-sm font-bold text-royal-gold truncate min-w-0 flex-1">
            {game?.title ?? "Preview"}
          </span>

          <span className="text-2xs text-soft-gray font-ui hidden md:inline shrink-0">
            {mode === "preview_3d" ? "3D Preview" : "2D Preview"}
          </span>

          <div className="flex items-center gap-1 bg-warm-wood rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => handleMode("preview_2d")}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "preview_2d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
            >
              2D
            </button>

            <button
              onClick={() => handleMode("preview_3d")}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "preview_3d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
            >
              3D
            </button>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={zoomOut} className="v-tool-btn font-mono text-xs">
              −
            </button>

            <button
              onClick={resetZoom}
              className="font-mono text-2xs text-soft-gray bg-warm-wood px-1.5 py-1 rounded min-w-[40px] hidden sm:inline-block"
            >
              {zoomPercent}%
            </button>

            <button onClick={zoomIn} className="v-tool-btn font-mono text-xs">
              +
            </button>
          </div>

          <button
            onClick={() => setMode("design")}
            title="Exit preview"
            className="px-2.5 sm:px-3 py-1.5 rounded-md bg-warm-wood text-parchment-light text-xs font-ui font-semibold hover:bg-warm-wood-light transition-colors shrink-0"
          >
            <span className="hidden sm:inline">✕ Exit Preview</span>

            <span className="sm:hidden">✕</span>
          </button>
        </div>

        {/* preview canvas with pan */}

        <PreviewStage
          mode={mode}
          components={components}
          zoom={storeZoom}
          width={canvasW}
          height={canvasH}
        />
      </div>
    );
  }

  // ── Editor ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-deep-void overflow-hidden">
      {/* Toolbar */}

      <header className="min-h-11 bg-rich-wood-dark border-b border-warm-wood flex items-center px-2 gap-1 shrink-0 z-40 overflow-x-auto flex-wrap">
        <Link
          href="/dashboard"
          title="Dashboard"
          className="font-display text-royal-gold text-sm font-bold mr-1 hover:text-royal-gold-bright shrink-0"
        >
          ✦
        </Link>

        <span className="text-2xs text-soft-gray font-ui truncate max-w-[120px] hidden sm:block mr-1 shrink-0">
          {game?.title ?? (isNew ? "New Game" : gameId.slice(0, 8))}
        </span>

        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        {TOOLS.map((t) => (
          <button
            key={t.id}
            title={t.label}
            onClick={() => setActiveTool(t.id)}
            className={`v-tool-btn shrink-0 ${activeTool === t.id ? "active" : ""}`}
          >
            {t.icon}
          </button>
        ))}

        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        <button
          title="Undo (⌘Z)"
          disabled={pastRef.current.length === 0}
          className="v-tool-btn disabled:opacity-30 shrink-0"
          onClick={undo}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M3 8A4 4 0 019 4h2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            <path
              d="M3 4.5l-.5 3.5L6 9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          title="Redo (⌘⇧Z)"
          disabled={futureRef.current.length === 0}
          className="v-tool-btn disabled:opacity-30 shrink-0"
          onClick={redo}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M10 8A4 4 0 004 4H2"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            <path
              d="M10 4.5l.5 3.5L7 9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        <button
          title="Grid"
          onClick={toggleGrid}
          className={`v-tool-btn shrink-0 ${showGrid ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M1 4.5h11M1 8.5h11M4.5 1v11M8.5 1v11"
              stroke="currentColor"
              strokeWidth="1.2"
            />
          </svg>
        </button>

        <button
          title="Snap"
          onClick={toggleSnap}
          className={`v-tool-btn shrink-0 ${snapToGrid ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle
              cx="6.5"
              cy="6.5"
              r="2"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <path
              d="M6.5 1v2M6.5 10v2M1 6.5h2M10 6.5h2"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <button
          title="Layers"
          onClick={() => setLeftOpen((v) => !v)}
          className={`v-tool-btn shrink-0 lg:hidden ${leftOpen ? "active" : ""}`}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect
              x="1"
              y="1"
              width="4"
              height="11"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <path
              d="M7 1h5M7 5h5M7 9h5"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="w-px h-5 bg-warm-wood mx-0.5 shrink-0" />

        <button
          title="Group (⌘G) — select 2+ first"
          disabled={!canGroup || effectiveReadOnly}
          onClick={groupSelection}
          className="v-tool-btn shrink-0 disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <rect
              x="6.5"
              y="6.5"
              width="5"
              height="5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <path
              d="M6.5 4h2.5a1 1 0 011 1V6.5"
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.6"
            />
          </svg>
        </button>

        <button
          title="Ungroup (⌘⇧G)"
          disabled={!canUngroup || effectiveReadOnly}
          onClick={ungroupSelection}
          className="v-tool-btn shrink-0 disabled:opacity-30"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <rect
              x="1.5"
              y="1.5"
              width="4.5"
              height="4.5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
            />

            <rect
              x="7"
              y="7"
              width="4.5"
              height="4.5"
              rx="1"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeDasharray="1.6 1.4"
            />
          </svg>
        </button>

        {/* Mode */}

        <div className="ml-auto flex items-center gap-0.5 bg-warm-wood rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => handleMode("design")}
            className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold ${mode === "design" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            Design
          </button>

          <button
            onClick={() => handleMode("preview_2d")}
            className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold ${(mode as string) === "preview_2d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            Preview
          </button>

          <button
            onClick={() => handleMode("preview_3d")}
            title={
              plan.has3DPreview ? "3D Preview" : "3D preview — upgrade required"
            }
            className={`px-2 py-1 rounded-md text-2xs font-ui font-semibold flex items-center gap-1 ${(mode as string) === "preview_3d" ? "bg-emerald-glow text-deep-void" : "text-soft-gray hover:text-parchment-light"}`}
          >
            3D{" "}
            {!plan.has3DPreview && (
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <rect
                  x="2.5"
                  y="5.5"
                  width="7"
                  height="5"
                  rx="1"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />

                <path
                  d="M4 5.5V4a2 2 0 014 0v1.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            )}
          </button>
        </div>

        <div className="flex items-center gap-0.5 mx-1.5 shrink-0">
          <button onClick={zoomOut} className="v-tool-btn font-mono text-xs">
            −
          </button>

          <button
            onClick={resetZoom}
            className="font-mono text-2xs text-soft-gray bg-warm-wood px-1.5 py-1 rounded min-w-[40px] text-center hover:text-parchment-light"
          >
            {zoomPercent}%
          </button>

          <button onClick={zoomIn} className="v-tool-btn font-mono text-xs">
            +
          </button>
        </div>

        {/* Live presence */}

        {collabEnabled && presence.length > 0 && (
          <div
            className="flex items-center -space-x-1.5 mr-1 shrink-0"
            title={`${presence.length} in this studio${collabConnected ? " · live" : ""}`}
          >
            {presence.slice(0, 4).map((m) => (
              <PresenceAvatar key={m.socketId} member={m} />
            ))}

            {presence.length > 4 && (
              <span className="w-6 h-6 rounded-full bg-warm-wood border border-rich-wood-dark flex items-center justify-center text-[9px] font-ui text-parchment-light z-10">
                +{presence.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {effectiveReadOnly ? (
            <span className="text-2xs font-ui font-semibold text-royal-gold bg-[rgba(245,196,81,0.12)] px-2 py-1 rounded">
              View only
            </span>
          ) : (
            <>
              <span
                className={`text-2xs font-ui hidden md:inline ${isSaving ? "text-royal-gold" : isDirty ? "text-soft-gray-dark" : "text-emerald-glow"}`}
              >
                {isSaving ? "Saving…" : isDirty ? "Unsaved" : "Saved"}
              </span>

              <button
                onClick={() => void handleSave()}
                className="v-tool-btn text-2xs font-ui px-2"
                title="Save (⌘S)"
              >
                Save
              </button>
            </>
          )}

          {/* More — secondary actions tucked away to keep the bar uncluttered */}

          <div className="relative shrink-0">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className={`v-tool-btn ${moreOpen ? "active" : ""}`}
              title="More — marketplace, guide, share, help"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="3" cy="7.5" r="1.2" fill="currentColor" />

                <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />

                <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
              </svg>
            </button>

            {moreOpen && (
              <>
                <div
                  className="fixed inset-0 z-[55]"
                  onPointerDown={() => setMoreOpen(false)}
                />

                {/* Fixed (not absolute) so it escapes the toolbar's overflow-x clip */}

                <div className="fixed right-2 top-12 z-[56] w-48 bg-rich-wood-dark border border-warm-wood rounded-lg shadow-2xl py-1">
                  <button
                    onClick={() => {
                      setMoreOpen(false);

                      setMarketOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M2 4.5h10l-.8 6a1 1 0 01-1 .9H3.8a1 1 0 01-1-.9L2 4.5z"
                        stroke="currentColor"
                        strokeWidth="1.1"
                        strokeLinejoin="round"
                      />

                      <path
                        d="M4.7 4.5a2.3 2.3 0 014.6 0"
                        stroke="currentColor"
                        strokeWidth="1.1"
                      />
                    </svg>
                    Component marketplace
                  </button>

                  {!isNew && (
                    <button
                      onClick={() => {
                        setMoreOpen(false);

                        setGuideOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2.5 2.5h6a1.5 1.5 0 011.5 1.5v7.5H4a1.5 1.5 0 01-1.5-1.5v-7.5z"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />

                        <path
                          d="M4.5 5h4M4.5 7h4M4.5 9h2.5"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                        />
                      </svg>
                      Rule guide &amp; scenarios
                    </button>
                  )}

                  {!isNew &&
                    myRole === "owner" &&
                    plan.hasTeamCollaboration && (
                      <button
                        onClick={() => {
                          setMoreOpen(false);

                          setShareOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <circle
                            cx="7"
                            cy="4"
                            r="2.2"
                            stroke="currentColor"
                            strokeWidth="1.2"
                          />

                          <path
                            d="M2.5 12a4.5 4.5 0 019 0"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />

                          <path
                            d="M11.5 3.5v3M13 5h-3"
                            stroke="currentColor"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                          />
                        </svg>
                        Invite collaborators
                      </button>
                    )}

                  <div className="h-px bg-warm-wood my-1" />

                  <button
                    onClick={() => {
                      setMoreOpen(false);

                      setTutorialOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-2xs font-ui text-parchment-light hover:bg-warm-wood text-left"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <circle
                        cx="7"
                        cy="7"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />

                      <path
                        d="M5.4 5.3a1.7 1.7 0 013.2.6c0 1.1-1.6 1.4-1.6 2.4"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />

                      <circle cx="7" cy="10.3" r="0.7" fill="currentColor" />
                    </svg>
                    How the studio works
                  </button>
                </div>
              </>
            )}
          </div>

          {myRole === "owner" && (
            <button
              onClick={handlePublish}
              disabled={publish.isPending || game?.status === "reviewing"}
              className="px-3 py-1 rounded-md bg-emerald-glow text-deep-void text-xs font-ui font-bold hover:bg-emerald-bright disabled:opacity-50"
            >
              {game?.status === "reviewing" ? "In Review" : "Publish"}
            </button>
          )}
        </div>
      </header>

      {shareOpen && (
        <ShareDialog gameId={gameId} onClose={() => setShareOpen(false)} />
      )}

      {guideOpen && (
        <GuideDialog
          guide={guide}
          readOnly={effectiveReadOnly}
          onChange={setGuide}
          onClose={() => setGuideOpen(false)}
        />
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={buildMenuItems()}
          onClose={closeMenu}
        />
      )}

      {tutorialOpen && <StudioTutorial onClose={closeTutorial} />}

      {marketOpen && (
        <StudioMarketplace
          selection={selectionIds.map((id) => ({ id }))}
          onInsert={insertAssetComponents}
          getSelectionPayload={getSelectionPayload}
          onClose={() => setMarketOpen(false)}
        />
      )}

      {/* Pages bar — switch / add / rename / resize canvases */}

      <div className="h-9 bg-rich-wood-dark border-b border-warm-wood flex items-center px-2 gap-1 shrink-0 overflow-x-auto z-30">
        <span className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-wider mr-1 shrink-0">
          Pages
        </span>

        {pages.map((p) => {
          const active = p.id === activePageId;

          return (
            <div
              key={p.id}
              onClick={() => switchPage(p.id)}
              className={`group flex items-center gap-1 pl-2 pr-1 h-6 rounded-md shrink-0 cursor-pointer transition-colors ${active ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/30" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"}`}
            >
              {renamingPageId === p.id ? (
                <input
                  autoFocus
                  defaultValue={p.name}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => {
                    renamePage(p.id, e.target.value);

                    setRenamingPageId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "Escape")
                      (e.target as HTMLInputElement).blur();
                  }}
                  className="w-24 bg-deep-void/60 border border-emerald-glow/40 rounded px-1 text-2xs text-parchment-light outline-none"
                />
              ) : (
                <span
                  className="text-2xs font-ui whitespace-nowrap"
                  onDoubleClick={(e) => {
                    e.stopPropagation();

                    if (!effectiveReadOnly) setRenamingPageId(p.id);
                  }}
                >
                  {p.name}
                </span>
              )}

              {pages.length > 1 && !effectiveReadOnly && (
                <ConfirmDialog
                  title="Delete page?"
                  description={`"${p.name}" and all its components will be permanently removed. This cannot be undone.`}
                  confirmLabel="Delete page"
                  variant="danger"
                  onConfirm={() => deletePage(p.id)}
                >
                  {(open) => (
                    <button
                      title="Delete page"
                      onClick={(e) => {
                        e.stopPropagation();

                        open();
                      }}
                      className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-crimson-flame p-0.5 transition-opacity"
                    >
                      <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                        <path
                          d="M1 1l6 6M7 1L1 7"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </ConfirmDialog>
              )}
            </div>
          );
        })}

        {!effectiveReadOnly && (
          <button
            onClick={addPage}
            disabled={atPageLimit}
            title={atPageLimit ? `Plan limit: ${maxPages} pages` : "Add page"}
            className="h-6 px-2 rounded-md text-2xs font-ui text-soft-gray hover:text-parchment-light hover:bg-warm-wood shrink-0 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            + Page{" "}
            {maxPages !== null && (
              <span className="text-soft-gray-dark">
                ({pages.length}/{maxPages})
              </span>
            )}
          </button>
        )}

        {/* Active page size */}

        {!effectiveReadOnly && (
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <select
              value=""
              title="Size preset"
              onChange={(e) => {
                const pre = PAGE_SIZE_PRESETS[Number(e.target.value)];

                if (pre) setPageSize(activePageId, pre.w, pre.h);
              }}
              className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 text-2xs text-parchment-light outline-none"
            >
              <option value="" disabled>
                Size…
              </option>

              {PAGE_SIZE_PRESETS.map((pre, i) => (
                <option key={pre.label} value={i}>
                  {pre.label} ({pre.w}×{pre.h})
                </option>
              ))}
            </select>

            <input
              type="number"
              value={canvasW}
              min={PAGE_MIN}
              max={PAGE_MAX}
              onChange={(e) =>
                resizePage(activePageId, "width", Number(e.target.value))
              }
              className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 w-14 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
            />

            <span className="text-soft-gray-dark text-2xs">×</span>

            <input
              type="number"
              value={canvasH}
              min={PAGE_MIN}
              max={PAGE_MAX}
              onChange={(e) =>
                resizePage(activePageId, "height", Number(e.target.value))
              }
              className="bg-rich-wood-mid border border-warm-wood rounded px-1 py-0.5 w-14 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
            />

            <span className="text-soft-gray-dark text-[10px]">mm</span>
          </div>
        )}
      </div>

      {/* Body */}

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel */}

        <aside
          className={`${leftOpen ? "w-52" : "w-0"} bg-rich-wood-dark border-r border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:z-30 max-lg:h-full`}
        >
          <div className="flex border-b border-warm-wood shrink-0">
            {(["layers", "components", "assets"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setLeftPanelTab(tab)}
                className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase border-b-2 -mb-px ${leftPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}
              >
                {tab === "layers"
                  ? "Layers"
                  : tab === "components"
                    ? "Parts"
                    : "Assets"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {leftPanelTab === "layers" && (
              <LayersPanel
                components={reversed}
                total={components.length}
                selectedId={selectedId}
                renamingId={renamingId}
                onSelect={(id) => {
                  setSelectedId(id);

                  setMultiIds([]);
                }}
                onStartRename={setRenamingId}
                onChange={updateComp}
                onDelete={deleteComp}
                onMove={moveZ}
                onUngroup={ungroupById}
              />
            )}

            {leftPanelTab === "components" && (
              <PartsPanel onAdd={(t) => addComp(t)} />
            )}

            {leftPanelTab === "assets" && (
              <AssetsPanel
                assets={assets}
                appliedUrl={selectedComp?.image}
                hasSelection={!!selectedComp}
                onUploaded={(url) => {
                  setAssets((a) => (a.includes(url) ? a : [url, ...a]));
                }}
                onApply={(url) => {
                  if (!selectedComp) {
                    toast.error("Select a component first.");

                    return;
                  }

                  updateComp(selectedComp.id, { image: url });

                  toast.success("Image applied to component.");
                }}
                onRemoveFromComp={() => {
                  if (selectedComp) updateComp(selectedComp.id, { image: "" });
                }}
                onDeleteAsset={(url) =>
                  setAssets((a) => a.filter((x) => x !== url))
                }
              />
            )}
          </div>
        </aside>

        {/* Canvas */}

        <main
          data-canvas
          className="flex-1 relative overflow-hidden"
          style={{
            cursor: activeTool === "hand" ? "grab" : toolCursor,

            backgroundColor: "#0c0c0c",
          }}
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
          onContextMenu={openCanvasMenu}
        >
          {showGrid && (
            <div
              data-canvasbg
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(58,42,31,0.4) 1px,transparent 1px),linear-gradient(90deg,rgba(58,42,31,0.4) 1px,transparent 1px)",

                backgroundSize: `${GRID_MM * MM_TO_PX * storeZoom}px ${GRID_MM * MM_TO_PX * storeZoom}px`,

                backgroundPosition: `${panX}px ${panY}px`,
              }}
            />
          )}

          {/* Rubber-band marquee */}

          {marquee && (
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: marquee.x,

                top: marquee.y,

                width: marquee.w,

                height: marquee.h,

                border: "1px solid #7c5cff",

                background: "rgba(124,92,255,0.12)",

                borderRadius: 2,
              }}
            />
          )}

          <div
            style={{
              position: "absolute",

              transformOrigin: "0 0",

              transform: `translate(${panX}px,${panY}px) scale(${storeZoom})`,
            }}
          >
            <div
              data-canvasbg
              style={{
                position: "relative",

                width: canvasW * MM_TO_PX,

                height: canvasH * MM_TO_PX,

                backgroundColor: "#111214",

                border: "1px solid rgba(58,42,31,0.6)",

                boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
              }}
            >
              <div
                style={{
                  position: "absolute",

                  top: -20,

                  left: 0,

                  color: "rgba(168,162,158,0.4)",

                  fontSize: 10,

                  fontFamily: "monospace",
                }}
              >
                {activePage.name} · {canvasW} × {canvasH} mm
              </div>

              {components.map((c) => (
                <CompView
                  key={c.id}
                  comp={c}
                  selected={selectionIds.includes(c.id)}
                  primary={selectedId === c.id}
                  editable={!effectiveReadOnly}
                  onPointerDown={onCompPointerDown}
                  onResizeStart={onResizeStart}
                  onRotateStart={onRotateStart}
                  onContextMenu={openCompMenu}
                  onTextChange={(id, text) => updateComp(id, { text }, false)}
                />
              ))}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 text-2xs text-soft-gray-dark font-mono bg-rich-wood-dark/80 rounded px-2 py-1 pointer-events-none">
            {selectedComp
              ? `${selectedComp.name} · ${Math.round(selectedComp.x)},${Math.round(selectedComp.y)} · ${selectedComp.width}×${selectedComp.height}mm`
              : `${canvasW}×${canvasH}mm`}
          </div>

          <div className="absolute bottom-3 right-3 text-2xs text-soft-gray-dark font-ui bg-rich-wood-dark/70 rounded px-2 py-1 pointer-events-none hidden lg:block">
            drag to box-select · shift-click to add · ⌘G group / ⌘⇧G ungroup ·
            right-click for menu
          </div>

          {/* Panel collapse toggles (desktop) */}

          <button
            onClick={() => setLeftOpen((v) => !v)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-l-0 border-warm-wood rounded-r-lg items-center justify-center text-soft-gray hover:text-parchment-light z-10 hidden lg:flex"
          >
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
              <path
                d={leftOpen ? "M5.5 1L2 5l3.5 4" : "M1.5 1L5 5l-3.5 4"}
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            onClick={() => setRightOpen((v) => !v)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-10 bg-rich-wood-dark border border-r-0 border-warm-wood rounded-l-lg items-center justify-center text-soft-gray hover:text-parchment-light z-10 hidden lg:flex"
          >
            <svg width="7" height="10" viewBox="0 0 7 10" fill="none">
              <path
                d={rightOpen ? "M1.5 1L5 5l-3.5 4" : "M5.5 1L2 5l3.5 4"}
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </main>

        {/* Right panel */}

        <aside
          className={`${rightOpen ? "w-60" : "w-0"} bg-rich-wood-dark border-l border-warm-wood flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 max-lg:absolute max-lg:right-0 max-lg:z-30 max-lg:h-full`}
        >
          <div className="flex border-b border-warm-wood shrink-0">
            {(["properties", "styling", "rules"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRightPanelTab(tab)}
                className={`flex-1 py-2 text-2xs font-ui font-bold tracking-[0.07em] uppercase border-b-2 -mb-px ${rightPanelTab === tab ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}
              >
                {tab === "properties"
                  ? "Props"
                  : tab === "styling"
                    ? "Style"
                    : "Rules"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 p-3">
            {!selectedComp && rightPanelTab !== "rules" && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-soft-gray-dark"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />

                  <path
                    d="M9 12h6M12 9v6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>

                <p className="text-2xs text-soft-gray-dark font-ui">
                  Select a component
                </p>
              </div>
            )}

            {rightPanelTab === "properties" && selectedComp && (
              <div className="space-y-3">
                {(canGroup || canUngroup) && !effectiveReadOnly && (
                  <GroupBar
                    count={selectionIds.length}
                    canGroup={canGroup}
                    canUngroup={canUngroup}
                    onGroup={groupSelection}
                    onUngroup={ungroupSelection}
                  />
                )}

                <PropertiesPanel
                  comp={selectedComp}
                  multiCount={selectionIds.length}
                  canvasW={canvasW}
                  canvasH={canvasH}
                  onChange={(p) => updateComp(selectedComp.id, p, false)}
                  onDup={duplicateSelected}
                  onDel={deleteSelected}
                  onZ={(d) => moveZ(selectedComp.id, d)}
                />
              </div>
            )}

            {rightPanelTab === "styling" && selectedComp && (
              <StylePanel
                comp={selectedComp}
                onChange={(p) => updateComp(selectedComp.id, p, false)}
              />
            )}

            {rightPanelTab === "rules" && (
              <RulesPanel
                hasEngine={plan.hasTeamCollaboration}
                rules={rules}
                onAdd={(rule) =>
                  setRules((rs) => [
                    ...rs,

                    {
                      ...rule,

                      id: `rule-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    },
                  ])
                }
                onUpdate={(id, patch) =>
                  setRules((rs) =>
                    rs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
                  )
                }
                onDelete={(id) =>
                  setRules((rs) => rs.filter((r) => r.id !== id))
                }
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Preview stage with pan ────────────────────────────────────────────────────

function PreviewStage({
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

// ── Shared inspector controls ─────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
    {children}
  </p>
);

/** Numeric input with −/+ steppers, optional unit, clamping. */

function Stepper({
  value,

  onChange,

  min = -Infinity,

  max = Infinity,

  step = 1,

  label,

  unit,
}: {
  value: number;

  onChange: (v: number) => void;

  min?: number;

  max?: number;

  step?: number;

  label?: string;

  unit?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const set = (n: number) => onChange(clamp(Math.round(n)));

  return (
    <label className="block">
      {label && (
        <span className="text-2xs text-soft-gray-dark font-ui block mb-1">
          {label}
        </span>
      )}

      <div className="flex items-stretch bg-rich-wood-mid border border-warm-wood rounded-lg overflow-hidden focus-within:border-emerald-glow transition-colors">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => set(value - step)}
          className="px-2 text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood transition-colors"
        >
          −
        </button>

        <div className="relative flex-1 min-w-0">
          <input
            type="number"
            value={Math.round(value)}
            min={min}
            max={max}
            onChange={(e) => set(safeNum(Number(e.target.value)))}
            className="w-full bg-transparent text-center text-xs font-mono text-parchment-light py-2 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />

          {unit && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-soft-gray-dark font-ui pointer-events-none">
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          tabIndex={-1}
          onClick={() => set(value + step)}
          className="px-2 text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood transition-colors"
        >
          +
        </button>
      </div>
    </label>
  );
}

/** Slider + numeric readout combo. */

function SliderField({
  label,

  value,

  onChange,

  min,

  max,

  step = 1,

  unit,
}: {
  label: string;

  value: number;

  onChange: (v: number) => void;

  min: number;

  max: number;

  step?: number;

  unit?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-2xs text-soft-gray-dark font-ui">{label}</span>

        <span className="text-2xs text-soft-gray font-mono">
          {Math.round(value)}

          {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-glow"
      />
    </div>
  );
}

/** Small pill-button group of presets. */

function Presets<T>({
  options,

  isActive,

  onPick,
}: {
  options: { label: string; value: T }[];

  isActive: (v: T) => boolean;

  onPick: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((o) => (
        <button
          key={o.label}
          onClick={() => onPick(o.value)}
          className={`px-2 py-1 rounded-md text-[10px] font-ui font-semibold transition-colors ${isActive(o.value) ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/40" : "bg-warm-wood/40 text-soft-gray hover:text-parchment-light hover:bg-warm-wood"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Properties panel ──────────────────────────────────────────────────────────

const SIZE_PRESETS: Partial<
  Record<CompType, { label: string; w: number; h: number }[]>
> = {
  card: [
    { label: "Poker", w: 63, h: 88 },

    { label: "Mini", w: 44, h: 68 },

    { label: "Tarot", w: 70, h: 120 },

    { label: "Square", w: 63, h: 63 },
  ],

  tile: [
    { label: "Sm", w: 32, h: 32 },

    { label: "Md", w: 48, h: 48 },

    { label: "Lg", w: 64, h: 64 },
  ],

  board: [
    { label: "Sm", w: 240, h: 180 },

    { label: "Md", w: 320, h: 240 },

    { label: "Lg", w: 420, h: 300 },
  ],
};

function GroupBar({
  count,

  canGroup,

  canUngroup,

  onGroup,

  onUngroup,
}: {
  count: number;

  canGroup: boolean;

  canUngroup: boolean;

  onGroup: () => void;

  onUngroup: () => void;
}) {
  return (
    <div className="rounded-lg border border-[rgba(124,92,255,0.3)] bg-[rgba(124,92,255,0.08)] p-2.5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xs font-ui font-semibold text-[#a78bff]">
          {count > 1 ? `${count} selected` : "Group"}
        </span>

        <span className="text-[10px] text-soft-gray-dark font-ui">
          ⌘G / ⌘⇧G
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onGroup}
          disabled={!canGroup}
          className="flex-1 py-1.5 rounded-lg bg-[rgba(124,92,255,0.15)] text-[#a78bff] text-2xs font-ui font-semibold hover:bg-[rgba(124,92,255,0.25)] disabled:opacity-30"
        >
          Group
        </button>

        <button
          onClick={onUngroup}
          disabled={!canUngroup}
          className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui font-semibold hover:text-parchment-light hover:bg-warm-wood disabled:opacity-30"
        >
          Ungroup
        </button>
      </div>
    </div>
  );
}

function PropertiesPanel({
  comp,

  onChange,

  onDup,

  onDel,

  onZ,

  multiCount = 1,

  canvasW = CANVAS_W_MM,

  canvasH = CANVAS_H_MM,
}: {
  comp: CanvasComp;

  onChange: (p: Partial<CanvasComp>) => void;

  onDup: () => void;

  onDel: () => void;

  onZ: (d: "up" | "down") => void;

  multiCount?: number;

  canvasW?: number;

  canvasH?: number;
}) {
  const [lockAspect, setLockAspect] = useState(false);

  const ratio = comp.width / Math.max(1, comp.height);

  const setWidth = (w: number) =>
    onChange(
      lockAspect
        ? { width: w, height: Math.max(1, Math.round(w / ratio)) }
        : { width: w },
    );

  const setHeight = (h: number) =>
    onChange(
      lockAspect
        ? { height: h, width: Math.max(1, Math.round(h * ratio)) }
        : { height: h },
    );

  const sizePresets = SIZE_PRESETS[comp.type];

  const isSquareType =
    isCircleType(comp.type) ||
    comp.type === "die" ||
    comp.type === "cube" ||
    comp.type === "tile";

  const hasText = comp.type === "text" || comp.type === "note";

  return (
    <div className="space-y-4">
      {/* Header: type + quick toggles */}

      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg bg-warm-wood/40 flex items-center justify-center text-emerald-glow shrink-0">
          {COMP_ICONS[comp.type]}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-2xs font-ui font-semibold text-parchment-light capitalize leading-tight">
            {comp.type === "text" ? "Title / Text" : comp.type}
          </p>

          <p className="text-[10px] text-soft-gray-dark font-ui truncate">
            {comp.width}×{comp.height} mm
          </p>
        </div>

        <button
          title={comp.visible ? "Hide" : "Show"}
          onClick={() => onChange({ visible: !comp.visible })}
          className={`p-1.5 rounded-lg hover:bg-warm-wood ${comp.visible ? "text-soft-gray hover:text-parchment-light" : "text-royal-gold"}`}
        >
          {comp.visible ? EyeOpen : EyeOff}
        </button>

        <button
          title={comp.locked ? "Unlock" : "Lock"}
          onClick={() => onChange({ locked: !comp.locked })}
          className={`p-1.5 rounded-lg hover:bg-warm-wood ${comp.locked ? "text-royal-gold" : "text-soft-gray hover:text-parchment-light"}`}
        >
          {comp.locked ? LockClosed : LockOpen}
        </button>
      </div>

      {multiCount > 1 && (
        <p className="text-[10px] text-soft-gray-dark font-ui -mt-1">
          Editing primary of {multiCount}. Move, duplicate &amp; delete affect
          all selected.
        </p>
      )}

      <label className="block">
        <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">
          Name
        </span>

        <input
          className="v-input text-xs"
          value={comp.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </label>

      {hasText && (
        <label className="block">
          <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1.5">
            {comp.type === "note" ? "Note text" : "Text"}
          </span>

          <input
            className="v-input text-xs"
            value={comp.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </label>
      )}

      <div className="h-px bg-warm-wood" />

      {/* Position + alignment */}

      <div>
        <SectionLabel>Position (mm)</SectionLabel>

        <div className="grid grid-cols-2 gap-2">
          <Stepper label="X" value={comp.x} onChange={(x) => onChange({ x })} />

          <Stepper label="Y" value={comp.y} onChange={(y) => onChange({ y })} />
        </div>

        <div className="flex gap-1 mt-2">
          <button
            title="Center horizontally"
            onClick={() =>
              onChange({ x: Math.round((canvasW - comp.width) / 2) })
            }
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Center H
          </button>

          <button
            title="Center vertically"
            onClick={() =>
              onChange({ y: Math.round((canvasH - comp.height) / 2) })
            }
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Center V
          </button>
        </div>
      </div>

      {/* Size */}

      <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Size (mm)</SectionLabel>

          <button
            onClick={() => setLockAspect((v) => !v)}
            title="Lock aspect ratio"
            className={`flex items-center gap-1 text-[10px] font-ui px-1.5 py-0.5 rounded ${lockAspect ? "text-emerald-glow bg-emerald-ghost" : "text-soft-gray-dark hover:text-parchment-light"}`}
          >
            {lockAspect ? LockClosed : LockOpen} ratio
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Stepper label="W" value={comp.width} min={1} onChange={setWidth} />

          <Stepper label="H" value={comp.height} min={1} onChange={setHeight} />
        </div>

        {sizePresets && (
          <div className="mt-2">
            <Presets
              options={sizePresets.map((p) => ({ label: p.label, value: p }))}
              isActive={(p) => comp.width === p.w && comp.height === p.h}
              onPick={(p) => onChange({ width: p.w, height: p.h })}
            />
          </div>
        )}

        {isSquareType && (
          <button
            onClick={() => onChange({ height: comp.width })}
            className="mt-2 w-full py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Make square
          </button>
        )}
      </div>

      {/* Rotation */}

      <div>
        <SectionLabel>Rotation</SectionLabel>

        <Stepper
          value={comp.rotation}
          min={-360}
          max={360}
          unit="°"
          onChange={(rotation) => onChange({ rotation })}
        />

        <div className="flex gap-1 mt-2">
          <button
            title="Rotate -90°"
            onClick={() => onChange({ rotation: comp.rotation - 90 })}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ⟲ 90
          </button>

          <button
            title="Rotate +90°"
            onClick={() => onChange({ rotation: comp.rotation + 90 })}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ⟳ 90
          </button>

          <button
            title="Reset rotation"
            onClick={() => onChange({ rotation: 0 })}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/40 text-soft-gray text-[10px] font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Quantity */}

      <div>
        <SectionLabel>Quantity in game</SectionLabel>

        <Stepper
          value={comp.quantity}
          min={1}
          max={1000}
          onChange={(quantity) => onChange({ quantity })}
        />
      </div>

      <div className="h-px bg-warm-wood" />

      {/* Arrange */}

      <div>
        <SectionLabel>Arrange</SectionLabel>

        <div className="flex gap-2">
          <button
            onClick={() => onZ("up")}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ↑ Forward
          </button>

          <button
            onClick={() => onZ("down")}
            className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood"
          >
            ↓ Back
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDup}
          className="flex-1 py-1.5 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood"
        >
          ⌘D Duplicate
        </button>

        <button
          onClick={onDel}
          className="flex-1 py-1.5 rounded-lg bg-crimson-ghost border border-crimson-flame/20 text-crimson-flame text-2xs font-ui hover:bg-crimson-flame hover:text-white"
        >
          ✕ Delete
        </button>
      </div>
    </div>
  );
}

// ── Style panel (nicer color picker) ──────────────────────────────────────────

const SWATCHES = [
  "#1a2535",

  "#1c1a2e",

  "#2a251a",

  "#1e2a1c",

  "#7c5cff",

  "#00e5ff",

  "#f5c451",

  "#ff3b5c",

  "#e8d5b8",

  "#a8a29e",

  "#0a0a0a",

  "#ffffff",
];

function ColorField({
  label,

  value,

  onChange,

  allowTransparent = false,
}: {
  label: string;

  value: string;

  onChange: (v: string) => void;

  allowTransparent?: boolean;
}) {
  const isTransparent = value === "transparent";

  const safe = value?.startsWith("#") ? value : "#1a2535";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
          {label}
        </p>

        {allowTransparent && (
          <button
            onClick={() => onChange(isTransparent ? "#1a2535" : "transparent")}
            className={`text-[10px] font-ui px-1.5 py-0.5 rounded ${isTransparent ? "text-emerald-glow bg-emerald-ghost" : "text-soft-gray-dark hover:text-parchment-light"}`}
          >
            None
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div
          className="relative w-9 h-9 rounded-lg overflow-hidden border border-warm-wood shrink-0"
          style={
            isTransparent
              ? {
                  backgroundImage:
                    "linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%),linear-gradient(45deg,#3a2a1f 25%,transparent 25%,transparent 75%,#3a2a1f 75%)",

                  backgroundSize: "8px 8px",

                  backgroundPosition: "0 0,4px 4px",
                }
              : { background: safe }
          }
        >
          <input
            type="color"
            value={safe}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </div>

        <input
          className="v-input text-xs font-mono flex-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {SWATCHES.map((s) => (
          <button
            key={s}
            onClick={() => onChange(s)}
            title={s}
            className={`aspect-square rounded-md border transition-transform hover:scale-110 ${value === s ? "border-emerald-glow ring-1 ring-emerald-glow" : "border-warm-wood"}`}
            style={{ background: s }}
          />
        ))}
      </div>
    </div>
  );
}

/** Live preview of the component's current style. */

function StylePreview({ comp }: { comp: CanvasComp }) {
  const isCircle = isCircleType(comp.type);

  return (
    <div className="rounded-lg bg-deep-void border border-warm-wood/60 h-20 flex items-center justify-center overflow-hidden">
      {comp.type === "text" ? (
        <span
          style={{
            color: comp.textColor ?? "#e8d5b8",

            fontFamily: "var(--font-display)",

            fontWeight: 700,

            fontSize: Math.min(28, comp.fontSize ?? 18),

            opacity: comp.opacity / 100,
          }}
        >
          {comp.text || "Aa"}
        </span>
      ) : (
        <div
          style={{
            position: "relative",

            width: 48,

            height:
              comp.type === "card" ||
              comp.type === "deck" ||
              isSilhouetteType(comp.type)
                ? 60
                : 48,

            backgroundColor: isChromeless(comp.type)
              ? "transparent"
              : safeColor(comp.fill, "#1a2535"),

            backgroundImage: comp.image ? `url("${comp.image}")` : undefined,

            backgroundSize: "cover",

            backgroundPosition: "center",

            border: isChromeless(comp.type)
              ? "none"
              : `${comp.strokeWidth}px solid ${safeColor(comp.stroke, "transparent")}`,

            borderRadius: isCircle ? "50%" : comp.cornerRadius,

            opacity: comp.opacity / 100,
          }}
        >
          {isSilhouetteType(comp.type) ? (
            <SilhouetteShape comp={comp} />
          ) : !comp.image ? (
            <ShapeInner comp={comp} />
          ) : null}
        </div>
      )}
    </div>
  );
}

function StylePanel({
  comp,

  onChange,
}: {
  comp: CanvasComp;

  onChange: (p: Partial<CanvasComp>) => void;
}) {
  const maxDim = Math.max(comp.width, comp.height);

  return (
    <div className="space-y-5">
      <StylePreview comp={comp} />

      {comp.type === "text" ? (
        <>
          <ColorField
            label="Text Color"
            value={comp.textColor ?? "#e8d5b8"}
            onChange={(v) => onChange({ textColor: v })}
          />

          <div>
            <SliderField
              label="Font size"
              value={comp.fontSize ?? 18}
              min={6}
              max={120}
              unit="px"
              onChange={(fontSize) => onChange({ fontSize })}
            />

            <div className="mt-2">
              <Presets
                options={[
                  { label: "S", value: 14 },

                  { label: "M", value: 24 },

                  { label: "L", value: 40 },

                  { label: "XL", value: 64 },
                ]}
                isActive={(v) => (comp.fontSize ?? 18) === v}
                onPick={(fontSize) => onChange({ fontSize })}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <ColorField
            label="Fill"
            value={comp.fill}
            onChange={(v) => onChange({ fill: v })}
            allowTransparent
          />

          <div className="h-px bg-warm-wood" />

          <ColorField
            label="Stroke"
            value={comp.stroke}
            onChange={(v) => onChange({ stroke: v })}
            allowTransparent
          />

          <SliderField
            label="Stroke width"
            value={comp.strokeWidth}
            min={0}
            max={20}
            unit="px"
            onChange={(strokeWidth) => onChange({ strokeWidth })}
          />

          {comp.type !== "token" && (
            <div>
              <SliderField
                label="Corner radius"
                value={comp.cornerRadius}
                min={0}
                max={Math.round(maxDim / 2)}
                unit="px"
                onChange={(cornerRadius) => onChange({ cornerRadius })}
              />

              <div className="mt-2">
                <Presets
                  options={[
                    { label: "Sharp", value: 0 },

                    { label: "Rounded", value: 8 },

                    { label: "Soft", value: 20 },

                    { label: "Pill", value: Math.round(maxDim / 2) },
                  ]}
                  isActive={(v) => comp.cornerRadius === v}
                  onPick={(cornerRadius) => onChange({ cornerRadius })}
                />
              </div>
            </div>
          )}
        </>
      )}

      <div className="h-px bg-warm-wood" />

      <SliderField
        label="Opacity"
        value={comp.opacity}
        min={0}
        max={100}
        unit="%"
        onChange={(opacity) => onChange({ opacity })}
      />
    </div>
  );
}

// ── Layers panel ──────────────────────────────────────────────────────────────

interface LayersPanelProps {
  components: CanvasComp[]; // already reversed (top layer first)

  total: number;

  selectedId: string | null;

  renamingId: string | null;

  onSelect: (id: string) => void;

  onStartRename: (id: string | null) => void;

  onChange: (id: string, patch: Partial<CanvasComp>, history?: boolean) => void;

  onDelete: (id: string) => void;

  onMove: (id: string, dir: "up" | "down") => void;

  onUngroup: (groupId: string) => void;
}

interface LayerRowProps {
  c: CanvasComp;

  idx: number;

  total: number;

  indent: number;

  selectedId: string | null;

  renamingId: string | null;

  onSelect: (id: string) => void;

  onStartRename: (id: string | null) => void;

  onChange: (id: string, patch: Partial<CanvasComp>, history?: boolean) => void;

  onDelete: (id: string) => void;

  onMove: (id: string, dir: "up" | "down") => void;
}

function LayerRow({
  c,

  idx,

  total,

  indent,

  selectedId,

  renamingId,

  onSelect,

  onStartRename,

  onChange,

  onDelete,

  onMove,
}: LayerRowProps) {
  const sel = selectedId === c.id;

  return (
    <div
      onClick={() => onSelect(c.id)}
      style={{ paddingLeft: 8 + indent * 16 }}
      className={`flex items-center gap-1.5 pr-1 py-1.5 rounded-lg mb-0.5 cursor-pointer group transition-colors ${sel ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/30" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"} ${!c.visible ? "opacity-50" : ""}`}
    >
      <span className={`shrink-0 ${sel ? "text-emerald-glow" : "opacity-60"}`}>
        {COMP_ICONS[c.type]}
      </span>

      {renamingId === c.id ? (
        <input
          autoFocus
          defaultValue={c.name}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => {
            onChange(c.id, { name: e.target.value.trim() || c.name });

            onStartRename(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape")
              (e.target as HTMLInputElement).blur();
          }}
          className="flex-1 min-w-0 bg-deep-void/60 border border-emerald-glow/40 rounded px-1 py-0.5 text-2xs font-ui text-parchment-light outline-none"
        />
      ) : (
        <span
          className="text-2xs font-ui truncate flex-1 min-w-0 select-none"
          onDoubleClick={(e) => {
            e.stopPropagation();

            onStartRename(c.id);
          }}
          title="Double-click to rename"
        >
          {c.name}

          {c.quantity > 1 && (
            <span className="ml-1 text-[10px] text-soft-gray-dark">
              ×{c.quantity}
            </span>
          )}
        </span>
      )}

      <div
        className={`flex items-center gap-0.5 shrink-0 ${sel ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
      >
        <button
          title="Bring forward"
          disabled={idx === 0}
          onClick={(e) => {
            e.stopPropagation();

            onMove(c.id, "up");
          }}
          className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 2.5l3.5 4M6 2.5L2.5 6.5M6 2.5v7"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          title="Send backward"
          disabled={idx === total - 1}
          onClick={(e) => {
            e.stopPropagation();

            onMove(c.id, "down");
          }}
          className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 9.5l3.5-4M6 9.5L2.5 5.5M6 9.5v-7"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          title={c.locked ? "Unlock" : "Lock"}
          onClick={(e) => {
            e.stopPropagation();

            onChange(c.id, { locked: !c.locked }, false);
          }}
          className={`p-1 rounded hover:bg-warm-wood-light ${c.locked ? "text-royal-gold" : "text-soft-gray-dark hover:text-parchment-light"}`}
        >
          {c.locked ? LockClosed : LockOpen}
        </button>

        <button
          title={c.visible ? "Hide" : "Show"}
          onClick={(e) => {
            e.stopPropagation();

            onChange(c.id, { visible: !c.visible }, false);
          }}
          className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light"
        >
          {c.visible ? EyeOpen : EyeOff}
        </button>

        <button
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();

            onDelete(c.id);
          }}
          className="p-1 rounded hover:bg-crimson-flame/20 text-soft-gray-dark hover:text-crimson-flame"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 3.5h7M5 3.5V2.5h2v1M3.5 3.5l.4 6h4.2l.4-6"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

const EyeOpen = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.2" />

    <path
      d="M1 6c1.5-3 9-3 10 0-1.5 3-9 3-10 0z"
      stroke="currentColor"
      strokeWidth="1.2"
    />
  </svg>
);

const EyeOff = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path
      d="M2 2l8 8M1 6c1.5-3 9-3 10 0"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

const LockClosed = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect
      x="2.5"
      y="5"
      width="7"
      height="5"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.2"
    />

    <path d="M4 5V3.6a2 2 0 014 0V5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const LockOpen = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect
      x="2.5"
      y="5"
      width="7"
      height="5"
      rx="1"
      stroke="currentColor"
      strokeWidth="1.2"
    />

    <path
      d="M4 5V3.6a2 2 0 013.9-.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

function LayersPanel({
  components,

  total,

  selectedId,

  renamingId,

  onSelect,

  onStartRename,

  onChange,

  onDelete,

  onMove,

  onUngroup,
}: LayersPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (gid: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);

      next.has(gid) ? next.delete(gid) : next.add(gid);

      return next;
    });

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          className="text-soft-gray-dark"
        >
          <path
            d="M12 3l9 5-9 5-9-5 9-5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />

          <path
            d="M3 13l9 5 9-5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>

        <p className="text-2xs text-soft-gray-dark font-ui">No layers yet</p>

        <p className="text-[10px] text-soft-gray-dark font-ui leading-relaxed">
          Add pieces from the <span className="text-soft-gray">Parts</span> tab
          or draw on the canvas.
        </p>
      </div>
    );
  }

  // Build a display list: each group becomes one parent node (at its top-most

  // member's position) with its members nested underneath.

  type Node =
    | { type: "leaf"; c: CanvasComp }
    | { type: "group"; groupId: string; members: CanvasComp[] };

  const seen = new Set<string>();

  const nodes: Node[] = [];

  for (const c of components) {
    if (c.groupId) {
      if (seen.has(c.groupId)) continue;

      seen.add(c.groupId);

      nodes.push({
        type: "group",

        groupId: c.groupId,

        members: components.filter((x) => x.groupId === c.groupId),
      });
    } else {
      nodes.push({ type: "leaf", c });
    }
  }

  const idxOf = (c: CanvasComp) => components.indexOf(c);

  const rowProps = {
    total: components.length,

    selectedId,

    renamingId,

    onSelect,

    onStartRename,

    onChange,

    onDelete,

    onMove,
  };

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between px-3 pb-1.5">
        <span className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em]">
          {total} layer{total === 1 ? "" : "s"}
        </span>

        <span className="text-[10px] text-soft-gray-dark font-ui">
          top → bottom
        </span>
      </div>

      <div className="px-1.5">
        {nodes.map((node) => {
          if (node.type === "leaf") {
            return (
              <LayerRow
                key={node.c.id}
                c={node.c}
                idx={idxOf(node.c)}
                indent={0}
                {...rowProps}
              />
            );
          }

          const isOpen = !collapsed.has(node.groupId);

          const groupSel = node.members.some((m) => m.id === selectedId);

          const allHidden = node.members.every((m) => !m.visible);

          return (
            <div key={node.groupId} className="mb-0.5">
              {/* Group header */}

              <div
                onClick={() => onSelect(node.members[0]!.id)}
                className={`flex items-center gap-1 pl-1 pr-1 py-1.5 rounded-lg cursor-pointer group transition-colors ${groupSel ? "bg-[rgba(124,92,255,0.14)] text-[#a78bff] ring-1 ring-[rgba(124,92,255,0.4)]" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    toggleCollapse(node.groupId);
                  }}
                  className="p-0.5 shrink-0 text-soft-gray-dark hover:text-parchment-light"
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 10 10"
                    fill="none"
                    style={{
                      transform: isOpen ? "rotate(90deg)" : "none",

                      transition: "transform .12s",
                    }}
                  >
                    <path d="M3 2l4 3-4 3z" fill="currentColor" />
                  </svg>
                </button>

                <span className="text-[#a78bff] shrink-0" title="Group">
                  ⛓
                </span>

                <span className="text-2xs font-ui font-semibold truncate flex-1 min-w-0">
                  Group{" "}
                  <span className="text-[10px] text-soft-gray-dark">
                    ({node.members.length})
                  </span>
                </span>

                <div
                  className={`flex items-center gap-0.5 shrink-0 ${groupSel ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                >
                  <button
                    title="Show/hide group"
                    onClick={(e) => {
                      e.stopPropagation();

                      node.members.forEach((m) =>
                        onChange(m.id, { visible: allHidden }, false),
                      );
                    }}
                    className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light"
                  >
                    {allHidden ? EyeOff : EyeOpen}
                  </button>

                  <button
                    title="Ungroup"
                    onClick={(e) => {
                      e.stopPropagation();

                      onUngroup(node.groupId);
                    }}
                    className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <rect
                        x="1.5"
                        y="1.5"
                        width="4"
                        height="4"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.1"
                      />

                      <rect
                        x="6.5"
                        y="6.5"
                        width="4"
                        height="4"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.1"
                        strokeDasharray="1.5 1.3"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Members */}

              {isOpen &&
                node.members.map((m) => (
                  <LayerRow
                    key={m.id}
                    c={m}
                    idx={idxOf(m)}
                    indent={1}
                    {...rowProps}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Parts panel ───────────────────────────────────────────────────────────────

const PART_META: { type: CompType; label: string; hint: string }[] = [
  { type: "board", label: "Board", hint: "Play surface" },

  { type: "card", label: "Card", hint: "63 × 88 mm" },

  { type: "deck", label: "Deck", hint: "Card stack" },

  { type: "tile", label: "Tile", hint: "Square tile" },

  { type: "hex", label: "Hex Tile", hint: "Hexagon" },

  { type: "token", label: "Token", hint: "Round marker" },

  { type: "marker", label: "Marker", hint: "Status disc" },

  { type: "cube", label: "Cube", hint: "Resource" },

  { type: "coin", label: "Coin", hint: "Currency" },

  { type: "die", label: "Die", hint: "Dice" },

  { type: "pawn", label: "Pawn", hint: "Player piece" },

  { type: "meeple", label: "Meeple", hint: "Worker" },

  { type: "note", label: "Note", hint: "Sticky note" },

  { type: "rulebook", label: "Rulebook", hint: "Reference" },

  { type: "text", label: "Title / Text", hint: "Label" },
];

/** Tiny visual preview of a part type, rendered from its TYPE_DEFAULTS. */

function PartThumb({ type }: { type: CompType }) {
  const d = TYPE_DEFAULTS[type];

  const isCircle = isCircleType(type);

  if (isSilhouetteType(type)) {
    return (
      <div className="w-7 h-7 flex items-center justify-center">
        <SilhouetteShape comp={makeComp(type, 0, 0)} />
      </div>
    );
  }

  if (type === "text") {
    return (
      <span
        style={{
          color: d.textColor,

          fontFamily: "var(--font-display)",

          fontWeight: 700,

          fontSize: 13,
        }}
      >
        Aa
      </span>
    );
  }

  // Fit the default footprint inside a 28px box, preserving aspect ratio.

  const maxW = d.width ?? 40,
    maxH = d.height ?? 40;

  const scale = 28 / Math.max(maxW, maxH);

  const w = Math.max(10, Math.round(maxW * scale));

  const h = Math.max(10, Math.round(maxH * scale));

  return (
    <div
      style={{
        width: w,

        height: h,

        backgroundColor: safeColor(d.fill, "#1a2535"),

        border: `${Math.min(2, d.strokeWidth ?? 1)}px solid ${safeColor(d.stroke, "#f5c451")}`,

        borderRadius: isCircle ? "50%" : Math.min(6, d.cornerRadius ?? 2),
      }}
    />
  );
}

function PartsPanel({ onAdd }: { onAdd: (type: CompType) => void }) {
  return (
    <div className="p-2.5">
      <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em] px-1 mb-2">
        Click a part to add it
      </p>

      <div className="grid grid-cols-2 gap-1.5">
        {PART_META.map((p) => (
          <button
            key={p.type}
            onClick={() => onAdd(p.type)}
            className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-warm-wood/60 bg-warm-wood/15 hover:bg-warm-wood/40 hover:border-emerald-glow/40 transition-all active:scale-[0.97]"
          >
            <div className="h-9 flex items-center justify-center text-soft-gray group-hover:text-parchment-light">
              <PartThumb type={p.type} />
            </div>

            <span className="text-2xs font-ui font-semibold text-parchment-mid group-hover:text-parchment-light leading-none">
              {p.label}
            </span>

            <span className="text-[10px] font-ui text-soft-gray-dark leading-none">
              {p.hint}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Assets panel ──────────────────────────────────────────────────────────────

interface AssetsPanelProps {
  assets: string[];

  appliedUrl: string | undefined;

  hasSelection: boolean;

  onUploaded: (url: string) => void;

  onApply: (url: string) => void;

  onRemoveFromComp: () => void;

  onDeleteAsset: (url: string) => void;
}

function AssetsPanel({
  assets,

  appliedUrl,

  hasSelection,

  onUploaded,

  onApply,

  onRemoveFromComp,

  onDeleteAsset,
}: AssetsPanelProps) {
  const { upload, uploading } = useImageUpload();

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    for (const file of files) {
      const uploaded = await upload(file);

      if (uploaded) onUploaded(uploaded);
    }

    e.target.value = "";
  }

  return (
    <div className="p-2.5">
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em]">
          Asset library
        </p>

        <span className="text-[10px] text-soft-gray-dark font-ui">
          {assets.length}
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full py-4 rounded-xl border border-dashed border-warm-wood hover:border-emerald-glow/50 flex flex-col items-center gap-1.5 text-soft-gray hover:text-parchment-light transition-colors disabled:opacity-50 mb-2.5"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4m0 0L7 9m5-5l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}

        <span className="text-2xs font-ui">
          {uploading ? "Uploading…" : "Upload images"}
        </span>

        <span className="text-[10px] font-ui text-soft-gray-dark">
          PNG / JPG · max 5MB
        </span>
      </button>

      {!hasSelection && assets.length > 0 && (
        <p className="text-[10px] text-royal-gold/80 font-ui px-1 mb-2">
          Select a component to apply an image.
        </p>
      )}

      {assets.length === 0 ? (
        <p className="text-2xs text-soft-gray-dark font-ui text-center py-6 leading-relaxed">
          No assets yet.
          <br />
          Uploaded images appear here and can be reused across components.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {assets.map((url) => {
            const active = appliedUrl === url;

            return (
              <div key={url} className="relative group aspect-square">
                <button
                  onClick={() => onApply(url)}
                  disabled={!hasSelection}
                  title={
                    hasSelection
                      ? "Apply to selected component"
                      : "Select a component first"
                  }
                  className={`w-full h-full rounded-lg overflow-hidden border transition-all disabled:cursor-not-allowed ${active ? "border-emerald-glow ring-1 ring-emerald-glow" : "border-warm-wood hover:border-emerald-glow/50"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}

                  <img
                    src={url}
                    alt="asset"
                    className="w-full h-full object-cover"
                  />
                </button>

                {active && (
                  <span className="absolute bottom-0.5 left-0.5 text-[9px] font-ui font-bold text-deep-void bg-emerald-glow rounded px-1 leading-tight pointer-events-none">
                    on
                  </span>
                )}

                <button
                  onClick={() => onDeleteAsset(url)}
                  title="Remove from library"
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-deep-void border border-warm-wood text-soft-gray-dark hover:text-crimson-flame hover:border-crimson-flame flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1 1l6 6M7 1L1 7"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {appliedUrl && (
        <button
          onClick={onRemoveFromComp}
          className="w-full mt-3 py-1.5 rounded-lg border border-warm-wood/60 text-soft-gray-dark hover:text-crimson-flame hover:border-crimson-flame/40 text-2xs font-ui transition-colors"
        >
          Remove image from component
        </button>
      )}
    </div>
  );
}

// ── Rules panel ───────────────────────────────────────────────────────────────

function RulesPanel({
  hasEngine,

  rules,

  onAdd,

  onUpdate,

  onDelete,
}: {
  hasEngine: boolean;

  rules: GameRule[];

  onAdd: (rule: Omit<GameRule, "id">) => void;

  onUpdate: (id: string, patch: Partial<GameRule>) => void;

  onDelete: (id: string) => void;
}) {
  const [trigger, setTrigger] = useState<RuleTrigger>("turn_start");

  const [action, setAction] = useState<RuleActionType>("draw_cards");

  const [amount, setAmount] = useState(1);

  const [target, setTarget] = useState<RuleTarget>("current");

  const [value, setValue] = useState("");

  const def = ruleActionDef(action)!;

  const triggerLabel = (t: RuleTrigger) =>
    RULE_TRIGGERS.find((x) => x.value === t)?.short ?? t;

  const draftParams: RuleParams = {
    ...(def.hasAmount ? { amount } : {}),

    ...(def.hasTarget ? { target } : {}),

    ...(def.hasValue ? { value } : {}),
  };

  const preview = buildRuleDescription(action, draftParams);

  const canAdd = !def.hasValue || value.trim().length > 0;

  function chooseAction(a: RuleActionType) {
    setAction(a);

    setAmount(ruleActionDef(a)?.defaultAmount ?? 1);
  }

  function add() {
    if (!canAdd) return;

    onAdd({
      trigger,

      action,

      params: draftParams,

      description: preview,

      enabled: true,
    });

    setValue("");
  }

  if (!hasEngine) {
    return (
      <div className="space-y-3">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
          Rule Engine
        </p>

        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[rgba(245,196,81,0.1)] border border-royal-gold/30 flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="text-royal-gold"
            >
              <rect
                x="3"
                y="8"
                width="12"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />

              <path
                d="M6 8V5.5a3 3 0 016 0V8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <p className="text-2xs text-soft-gray font-ui leading-relaxed">
            The visual rule engine is available on{" "}
            <span className="text-royal-gold font-semibold">Pro</span> and{" "}
            <span className="text-royal-gold font-semibold">Studio</span>.
          </p>

          <Link
            href="/pricing"
            className="w-full py-2 rounded-lg bg-royal-gold/10 border border-royal-gold/30 text-royal-gold text-2xs font-ui font-semibold hover:bg-royal-gold/20"
          >
            Upgrade →
          </Link>
        </div>
      </div>
    );
  }

  const activeCount = rules.filter((r) => r.enabled !== false).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
          Rule Engine
        </p>

        {rules.length > 0 && (
          <span className="text-[10px] text-soft-gray-dark font-ui">
            {activeCount}/{rules.length} active
          </span>
        )}
      </div>

      {/* Visual WHEN → THEN builder */}

      <div className="rounded-xl border border-warm-wood/50 bg-warm-wood/15 overflow-hidden">
        {/* WHEN */}

        <div className="p-2.5 border-b border-warm-wood/40">
          <span className="text-[10px] font-ui font-bold text-cyan-spark uppercase tracking-[0.12em]">
            When
          </span>

          <select
            className="v-input text-xs mt-1"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as RuleTrigger)}
          >
            {RULE_TRIGGERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* THEN */}

        <div className="p-2.5 space-y-2">
          <span className="text-[10px] font-ui font-bold text-emerald-glow uppercase tracking-[0.12em]">
            Then
          </span>

          <select
            className="v-input text-xs"
            value={action}
            onChange={(e) => chooseAction(e.target.value as RuleActionType)}
          >
            {RULE_ACTIONS.map((a) => (
              <option key={a.type} value={a.type}>
                {a.label}
              </option>
            ))}
          </select>

          {(def.hasAmount || def.hasTarget) && (
            <div className="grid grid-cols-2 gap-2">
              {def.hasAmount && (
                <Stepper
                  label={def.amountLabel ?? "Amount"}
                  value={amount}
                  min={1}
                  max={99}
                  onChange={setAmount}
                />
              )}

              {def.hasTarget && (
                <label className="block">
                  <span className="text-2xs text-soft-gray-dark font-ui block mb-1">
                    Who
                  </span>

                  <select
                    className="v-input text-xs !py-2"
                    value={target}
                    onChange={(e) => setTarget(e.target.value as RuleTarget)}
                  >
                    {RULE_TARGETS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {def.hasValue && (
            <input
              className="v-input text-xs"
              placeholder={def.valuePlaceholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </div>

        {/* Live preview */}

        <div className="px-2.5 pb-2.5">
          <div className="rounded-lg bg-deep-void/60 border border-warm-wood/40 px-2.5 py-2">
            <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-wider mb-0.5">
              Preview
            </p>

            <p className="text-2xs text-parchment-light font-ui leading-relaxed">
              <span className="text-cyan-spark font-semibold">
                {triggerLabel(trigger)}:{" "}
              </span>

              {preview}
            </p>
          </div>

          <button
            onClick={add}
            disabled={!canAdd}
            className="w-full mt-2 py-2 rounded-lg bg-emerald-ghost border border-emerald-glow/20 text-emerald-glow text-2xs font-ui font-semibold hover:bg-emerald-glow hover:text-deep-void transition-all disabled:opacity-40"
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Starter templates */}

      {rules.length === 0 && (
        <div>
          <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em] mb-1.5">
            Quick templates
          </p>

          <div className="flex flex-wrap gap-1.5">
            {RULE_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() =>
                  onAdd({
                    trigger: t.trigger,

                    action: t.action,

                    params: t.params,

                    description: buildRuleDescription(t.action, t.params),

                    enabled: true,
                  })
                }
                className="px-2 py-1 rounded-md text-[10px] font-ui font-semibold bg-warm-wood/40 text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}

      {rules.length === 0 ? (
        <p className="text-2xs text-soft-gray-dark font-ui text-center py-2">
          No rules yet. Build one above.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const enabled = rule.enabled !== false;

            return (
              <div
                key={rule.id}
                className={`rounded-lg border group transition-colors ${enabled ? "border-warm-wood" : "border-warm-wood/40 opacity-55"}`}
              >
                <div className="flex items-center gap-1.5 px-2.5 pt-2">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-[10px] font-ui font-bold text-cyan-spark bg-[rgba(0,229,255,0.1)] px-1.5 py-0.5 rounded shrink-0">
                      {triggerLabel(rule.trigger)}
                    </span>

                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-soft-gray-dark shrink-0"
                    >
                      <path
                        d="M2 6h7M6.5 3l3 3-3 3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {rule.action && (
                      <span className="text-[10px] font-ui font-semibold text-emerald-glow bg-emerald-ghost px-1.5 py-0.5 rounded truncate min-w-0">
                        {ruleActionDef(rule.action)?.label ?? rule.action}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      title={enabled ? "Disable" : "Enable"}
                      onClick={() => onUpdate(rule.id, { enabled: !enabled })}
                      className={`relative w-7 h-4 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-glow" : "bg-warm-wood"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-deep-void transition-all ${enabled ? "left-3.5" : "left-0.5"}`}
                      />
                    </button>

                    <button
                      title="Duplicate"
                      onClick={() => onAdd({ ...rule })}
                      className="p-1 rounded text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood-light opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <rect
                          x="3.5"
                          y="3.5"
                          width="6"
                          height="6"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />

                        <path
                          d="M2.5 8V2.5h5.5"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />
                      </svg>
                    </button>

                    <button
                      title="Delete"
                      onClick={() => onDelete(rule.id)}
                      className="p-1 rounded text-soft-gray-dark hover:text-crimson-flame hover:bg-crimson-flame/10 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 3.5h7M5 3.5V2.5h2v1M3.5 3.5l.4 6h4.2l.4-6"
                          stroke="currentColor"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <textarea
                  className="w-full bg-transparent text-2xs text-parchment-mid font-ui resize-none outline-none px-2.5 pb-2 pt-1.5 leading-relaxed"
                  rows={2}
                  value={rule.description}
                  placeholder="Describe what happens…"
                  onChange={(e) =>
                    onUpdate(rule.id, { description: e.target.value })
                  }
                />

                {idx === rules.length - 1 && (
                  <div className="px-2.5 pb-1.5 text-[10px] text-soft-gray-dark font-ui">
                    Edit the text to fine-tune wording.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Collaboration UI ──────────────────────────────────────────────────────────

function PresenceAvatar({ member }: { member: PresenceMember }) {
  const initials = (member.displayName || member.username || "?")

    .slice(0, 2)

    .toUpperCase();

  const ring =
    member.role === "owner"
      ? "ring-royal-gold"
      : member.role === "viewer"
        ? "ring-soft-gray"
        : "ring-emerald-glow";

  return (
    <div
      className={`w-6 h-6 rounded-full bg-warm-wood border border-rich-wood-dark ring-1 ${ring} overflow-hidden flex items-center justify-center text-[9px] font-ui font-bold text-parchment-light z-10`}
      title={`${member.displayName} · ${member.role}`}
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element

        <img
          src={member.avatarUrl}
          alt={member.displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

function ShareDialog({
  gameId,

  onClose,
}: {
  gameId: string;

  onClose: () => void;
}) {
  const plan = usePlan();

  const { data: collaborators, isLoading } = useCollaborators(gameId);

  const invite = useInviteCollaborator(gameId);

  const updateRole = useUpdateCollaboratorRole(gameId);

  const remove = useRemoveCollaborator(gameId);

  const [identifier, setIdentifier] = useState("");

  const [role, setRole] = useState<CollaboratorRole>("editor");

  const max = plan.limits.maxCollaborators;

  const used = collaborators?.length ?? 0;

  const full = used >= max;

  function submit() {
    const id = identifier.trim();

    if (!id || full) return;

    invite.mutate(
      { identifier: id, role },

      { onSuccess: () => setIdentifier("") },
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="v-card w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-parchment-light">
            Share studio
          </h2>

          <button
            onClick={onClose}
            className="text-soft-gray hover:text-parchment-light p-1 -mr-1"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-2xs text-soft-gray font-ui mb-5">
          Invite people to co-edit this game in real time. {plan.label} plan ·{" "}
          {used}/{max} collaborator seat{max === 1 ? "" : "s"} used.
        </p>

        {/* Invite form */}

        <div className="flex gap-2 mb-2">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Email or username"
            disabled={full}
            className="v-input text-sm flex-1 disabled:opacity-50"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as CollaboratorRole)}
            disabled={full}
            className="v-input text-sm w-24 disabled:opacity-50"
          >
            <option value="editor">Editor</option>

            <option value="viewer">Viewer</option>
          </select>
        </div>

        <button
          onClick={submit}
          disabled={full || !identifier.trim() || invite.isPending}
          className="w-full py-2 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-all disabled:opacity-40 mb-1"
        >
          {invite.isPending ? "Inviting…" : "Send invite"}
        </button>

        {full && (
          <p className="text-2xs text-royal-gold font-ui text-center mb-2">
            Seat limit reached for your plan.{" "}
            <Link href="/pricing" className="underline">
              Upgrade
            </Link>{" "}
            for more.
          </p>
        )}

        {/* List */}

        <div className="mt-4 border-t border-warm-wood pt-4 space-y-2">
          <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
            Collaborators
          </p>

          {isLoading ? (
            <p className="text-2xs text-soft-gray-dark font-ui py-2">
              Loading…
            </p>
          ) : !collaborators || collaborators.length === 0 ? (
            <p className="text-2xs text-soft-gray-dark font-ui py-2">
              No collaborators yet. Invite someone above.
            </p>
          ) : (
            collaborators.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 py-1.5">
                <div className="w-8 h-8 rounded-full bg-warm-wood overflow-hidden flex items-center justify-center text-2xs font-ui font-bold text-parchment-light shrink-0">
                  {c.user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element

                    <img
                      src={c.user.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (c.user?.displayName ?? "?").slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-ui font-semibold text-parchment-light truncate">
                    {c.user?.displayName ?? c.userId}
                  </p>

                  <p className="text-[10px] text-soft-gray-dark font-ui truncate">
                    @{c.user?.username}
                  </p>
                </div>

                <select
                  value={c.role}
                  onChange={(e) =>
                    updateRole.mutate({
                      userId: c.userId,

                      role: e.target.value as CollaboratorRole,
                    })
                  }
                  className="v-input text-2xs !py-1 w-20 shrink-0"
                >
                  <option value="editor">Editor</option>

                  <option value="viewer">Viewer</option>
                </select>

                <button
                  onClick={() => remove.mutate(c.userId)}
                  title="Remove"
                  className="p-1 rounded text-soft-gray-dark hover:text-crimson-flame shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 3.5h7M5 3.5V2.5h2v1M3.5 3.5l.4 6h4.2l.4-6"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Rule guide & scenarios editor ─────────────────────────────────────────────

/** Editable ordered list of short text steps. */

function StepList({
  label,

  items,

  placeholder,

  readOnly,

  onChange,
}: {
  label: string;

  items: string[];

  placeholder: string;

  readOnly: boolean;

  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (draft.trim()) {
      onChange([...items, draft.trim()]);

      setDraft("");
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;

    if (j < 0 || j >= items.length) return;

    const next = [...items];

    [next[i], next[j]] = [next[j]!, next[i]!];

    onChange(next);
  };

  return (
    <div>
      <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
        {label}
      </p>

      <ol className="space-y-1.5 mb-2">
        {items.map((step, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <span className="w-5 h-5 rounded-full bg-warm-wood/50 text-emerald-glow text-[10px] font-ui font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>

            <input
              value={step}
              disabled={readOnly}
              onChange={(e) => {
                const n = [...items];

                n[i] = e.target.value;

                onChange(n);
              }}
              className="v-input text-xs flex-1 disabled:opacity-70"
            />

            {!readOnly && (
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 text-soft-gray-dark hover:text-parchment-light disabled:opacity-25"
                >
                  ↑
                </button>

                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-0.5 text-soft-gray-dark hover:text-parchment-light disabled:opacity-25"
                >
                  ↓
                </button>

                <button
                  onClick={() => onChange(items.filter((_, k) => k !== i))}
                  className="p-0.5 text-soft-gray-dark hover:text-crimson-flame"
                >
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}

        {items.length === 0 && (
          <li className="text-2xs text-soft-gray-dark font-ui pl-7">
            Nothing yet.
          </li>
        )}
      </ol>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={placeholder}
            className="v-input text-xs flex-1"
          />

          <button
            onClick={add}
            disabled={!draft.trim()}
            className="px-3 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function GuideDialog({
  guide,

  readOnly,

  onChange,

  onClose,
}: {
  guide: GameGuide;

  readOnly: boolean;

  onChange: (g: GameGuide) => void;

  onClose: () => void;
}) {
  const patch = (p: Partial<GameGuide>) => onChange({ ...guide, ...p });

  const addScenario = () =>
    patch({
      scenarios: [
        ...guide.scenarios,

        {
          id: `scn-${Date.now()}`,

          name: `Scenario ${guide.scenarios.length + 1}`,

          description: "",

          players: "2–4",

          difficulty: "standard",

          winCondition: "",
        },
      ],
    });

  const updateScenario = (id: string, p: Partial<GameScenario>) =>
    patch({
      scenarios: guide.scenarios.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });

  const removeScenario = (id: string) =>
    patch({ scenarios: guide.scenarios.filter((s) => s.id !== id) });

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="v-card w-full max-w-2xl p-6 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-parchment-light">
            Rule guide & scenarios
          </h2>

          <button
            onClick={onClose}
            className="text-soft-gray hover:text-parchment-light p-1 -mr-1"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-2xs text-soft-gray font-ui mb-5">
          A how-to-play guide shown on your game&apos;s marketplace page.{" "}
          {readOnly && <span className="text-royal-gold">View only.</span>}
        </p>

        <div className="space-y-6">
          {/* Objective */}

          <div>
            <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
              Objective
            </p>

            <textarea
              value={guide.objective}
              disabled={readOnly}
              onChange={(e) => patch({ objective: e.target.value })}
              placeholder="In one or two sentences, how do you win?"
              className="v-input text-xs resize-none h-16 disabled:opacity-70"
            />
          </div>

          <StepList
            label="Setup"
            items={guide.setupSteps}
            placeholder="Add a setup step…"
            readOnly={readOnly}
            onChange={(setupSteps) => patch({ setupSteps })}
          />

          <StepList
            label="Turn structure"
            items={guide.turnStructure}
            placeholder="Add a phase…"
            readOnly={readOnly}
            onChange={(turnStructure) => patch({ turnStructure })}
          />

          {/* Scenarios */}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
                Scenarios & variants
              </p>

              {!readOnly && (
                <button
                  onClick={addScenario}
                  className="text-2xs font-ui text-emerald-glow hover:underline"
                >
                  + Add scenario
                </button>
              )}
            </div>

            {guide.scenarios.length === 0 ? (
              <p className="text-2xs text-soft-gray-dark font-ui">
                No scenarios yet. Add variants like a 2-player short game or an
                advanced mode.
              </p>
            ) : (
              <div className="space-y-3">
                {guide.scenarios.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-warm-wood p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={s.name}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateScenario(s.id, { name: e.target.value })
                        }
                        className="v-input text-xs font-semibold flex-1 disabled:opacity-70"
                        placeholder="Scenario name"
                      />

                      {!readOnly && (
                        <button
                          onClick={() => removeScenario(s.id)}
                          className="p-1 text-soft-gray-dark hover:text-crimson-flame shrink-0"
                          title="Remove scenario"
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 3.5h7M5 3.5V2.5h2v1M3.5 3.5l.4 6h4.2l.4-6"
                              stroke="currentColor"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[10px] text-soft-gray-dark font-ui block mb-1">
                          Players
                        </span>

                        <input
                          value={s.players}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateScenario(s.id, { players: e.target.value })
                          }
                          className="v-input text-xs disabled:opacity-70"
                          placeholder="2–4"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] text-soft-gray-dark font-ui block mb-1">
                          Difficulty
                        </span>

                        <select
                          value={s.difficulty}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateScenario(s.id, {
                              difficulty: e.target.value as ScenarioDifficulty,
                            })
                          }
                          className="v-input text-xs disabled:opacity-70"
                        >
                          {SCENARIO_DIFFICULTY.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <textarea
                      value={s.description}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateScenario(s.id, { description: e.target.value })
                      }
                      placeholder="How this scenario differs / its setup."
                      className="v-input text-xs resize-none h-14 disabled:opacity-70"
                    />

                    <input
                      value={s.winCondition}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateScenario(s.id, { winCondition: e.target.value })
                      }
                      placeholder="Win condition"
                      className="v-input text-xs disabled:opacity-70"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

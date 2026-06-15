"use client";

import { useCallback } from "react";

import { toast } from "sonner";

import { PAGE_MIN, PAGE_MAX, makeComp, normalizeComponents } from "../core";

import type { CompType, CanvasComp } from "../core";

import type { StudioState } from "./useStudioEditorState";

export function useStudioActions(S: StudioState) {
  const {
    plan,
    pages,
    setPages,
    activePageId,
    setActivePageId,
    activePageIdRef,
    components,
    setComponentsRaw,
    pastRef,
    futureRef,
    forceRerender,
    commit,
    setSelectedId,
    clipboardRef,
    selectedComp,
    setMultiIds,
    selectionRef,
    setRules,
  } = S;

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

  // ── Template merge ──────────────────────────────────────────────────────────

  const mergeTemplate = useCallback(
    (template: import("@/lib/templateRegistry").StudioTemplate) => {
      const base = Date.now();
      const newComps = template.components.map((c, i) => ({
        ...c,
        id: `${c.type}-tmpl-${base}-${i}`,
      }));
      const newRules = template.rules.map((r, i) => ({
        ...r,
        id: `rule-tmpl-${base}-${i}`,
      }));
      setComponentsRaw((prev) => {
        pastRef.current.push(prev);
        futureRef.current = [];
        return [...prev, ...newComps];
      });
      setRules((prev) => [...prev, ...newRules]);
      toast.success(
        `Merged "${template.name}" — ${newComps.length} components, ${newRules.length} rules added.`,
      );
    },
    [setComponentsRaw, setRules],
  );

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

      // Detect if all selected components share the same existing groupId —
      // if so, we are nesting that group into a new parent group.
      const existingGroupIds = Array.from(
        new Set(
          ids
            .map((id) => prev.find((c) => c.id === id)?.groupId)
            .filter(Boolean) as string[],
        ),
      );

      return prev.map((c) => {
        if (!set.has(c.id)) return c;

        const updated = { ...c, groupId: gid };

        // If this component already had a groupId, preserve it as parentGroupId
        // so the nested group hierarchy is recorded.
        if (c.groupId && c.groupId !== gid) {
          updated.parentGroupId = c.groupId;
        }

        return updated;
      });
    });

    setMultiIds([]); // selection now derives from the group
  }, [setComponentsRaw]);

  /**
   * Rotate all components in a group by a given angle delta (degrees).
   * Rotates each component's position around the group's bounding-box centre,
   * and adds the delta to each component's own rotation.
   */
  const rotateGroup = useCallback(
    (groupId: string, angleDeg: number) => {
      setComponentsRaw((prev) => {
        const members = prev.filter((c) => c.groupId === groupId);
        if (members.length === 0) return prev;

        pastRef.current.push(prev);
        futureRef.current = [];

        // Compute group bounding-box centre
        const minX = Math.min(...members.map((c) => c.x));
        const minY = Math.min(...members.map((c) => c.y));
        const maxX = Math.max(...members.map((c) => c.x + c.width));
        const maxY = Math.max(...members.map((c) => c.y + c.height));
        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;

        const rad = (angleDeg * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        return prev.map((c) => {
          if (c.groupId !== groupId) return c;

          // Rotate the component's own centre around the group centre
          const compCx = c.x + c.width / 2;
          const compCy = c.y + c.height / 2;
          const dx = compCx - cx;
          const dy = compCy - cy;
          const newCx = cx + dx * cos - dy * sin;
          const newCy = cy + dx * sin + dy * cos;

          return {
            ...c,
            x: Math.round(newCx - c.width / 2),
            y: Math.round(newCy - c.height / 2),
            rotation: Math.round((((c.rotation + angleDeg) % 360) + 360) % 360),
          };
        });
      });
    },
    [setComponentsRaw],
  );

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

  return {
    updateComp,
    addComp,
    deleteSelected,
    deleteComp,
    duplicateSelected,
    mergeTemplate,
    groupSelection,
    ungroupById,
    ungroupSelection,
    rotateGroup,
    moveZ,
    insertAssetComponents,
    getSelectionPayload,
    reorderZ,
    switchPage,
    maxPages,
    atPageLimit,
    addPage,
    deletePage,
    renamePage,
    resizePage,
    setPageSize,
    undo,
    redo,
    copy,
    paste,
  };
}

export type StudioActions = ReturnType<typeof useStudioActions>;

"use client";

import { useCallback, useEffect } from "react";

import type { MouseEvent as ReactMouseEvent } from "react";

import {
  toast,
} from "sonner";

import {
  MM_TO_PX,
  GRID_MM,
  TOOLS,
} from "../core";

import type {
  CanvasComp,
  MenuItem,
} from "../core";

import type { StudioState } from "./useStudioEditorState";
import type { StudioActions } from "./useStudioActions";

export function useStudioMenuKeyboard(S: StudioState, A: StudioActions) {
  const {
    router,
    setMode,
    storeZoom,
    saveNow,
    plan,
    activeTool,
    setActiveTool,
    pages,
    components,
    rules,
    assets,
    guide,
    setSelectedId,
    panX,
    panY,
    clipboardRef,
    menu,
    setMenu,
    readOnlyRef,
    selectedComp,
    setMultiIds,
    selectionIds,
    selectionRef,
    canGroup,
    canUngroup,
    isNew,
    gameId,
  } = S;

  const {
    updateComp,
    addComp,
    deleteSelected,
    duplicateSelected,
    groupSelection,
    ungroupSelection,
    moveZ,
    reorderZ,
    undo,
    redo,
    copy,
    paste,
  } = A;

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


  return {
    openCompMenu,
    handlePublish,
    openCanvasMenu,
    closeMenu,
    buildMenuItems,
    handleSave,
    handleMode,
    toolCursor,
    reversed,
  };
}

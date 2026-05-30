/**
 * Studio Editor Store — Zustand + Immer
 *
 * Manages all client-side state for the Board Game Designer Studio:
 * - Active tool selection
 * - Viewport pan/zoom/rotation
 * - Component selection
 * - Undo/redo history stack
 * - Editor mode (design / preview / playtest)
 * - Dirty/saving state for auto-save
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type {
  EditorMode,
  EditorTool,
  EditorViewport,
  EditorSelection,
  ID,
  ISODateString,
} from "@velonix/types";

// ---------------------------------------------------------------------------
// STATE SHAPE
// ---------------------------------------------------------------------------

interface HistoryEntry {
  timestamp: number;
  description: string;
  snapshot: string; // JSON snapshot of the relevant game data
}

interface StudioState {
  // ── Identity ─────────────────────────────────────────────────────────────
  gameId: ID | null;

  // ── Mode & Tool ──────────────────────────────────────────────────────────
  mode: EditorMode;
  activeTool: EditorTool;
  previousTool: EditorTool; // For tool toggle shortcuts (e.g. V = back to select)

  // ── Viewport ─────────────────────────────────────────────────────────────
  viewport: EditorViewport;

  // ── Selection ────────────────────────────────────────────────────────────
  selection: EditorSelection;

  // ── History ──────────────────────────────────────────────────────────────
  history: HistoryEntry[];
  historyIndex: number; // Points to current state; -1 = empty

  // ── Persistence ──────────────────────────────────────────────────────────
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: ISODateString | null;
  autoSaveEnabled: boolean;

  // ── UI State ─────────────────────────────────────────────────────────────
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  leftPanelTab: "layers" | "components" | "assets";
  rightPanelTab: "properties" | "styling" | "rules";
  isFullscreen: boolean;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number; // px
}

// ---------------------------------------------------------------------------
// ACTIONS
// ---------------------------------------------------------------------------

interface StudioActions {
  // ── Session ──────────────────────────────────────────────────────────────
  openGame: (gameId: ID) => void;
  closeGame: () => void;

  // ── Mode & Tool ──────────────────────────────────────────────────────────
  setMode: (mode: EditorMode) => void;
  setTool: (tool: EditorTool) => void;
  toggleTool: (tool: EditorTool) => void; // Toggles back to previous if same tool

  // ── Viewport ─────────────────────────────────────────────────────────────
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setPan: (x: number, y: number) => void;
  resetViewport: () => void;

  // ── Selection ────────────────────────────────────────────────────────────
  selectComponent: (id: ID, addToSelection?: boolean) => void;
  selectLayer: (id: ID, addToSelection?: boolean) => void;
  clearSelection: () => void;
  selectAll: (componentIds: ID[]) => void;

  // ── History ──────────────────────────────────────────────────────────────
  pushHistory: (description: string, snapshot: string) => void;
  undo: () => string | null; // Returns snapshot to restore
  redo: () => string | null;

  // ── Persistence ──────────────────────────────────────────────────────────
  markDirty: () => void;
  markSaving: () => void;
  markSaved: () => void;
  setAutoSave: (enabled: boolean) => void;

  // ── UI ───────────────────────────────────────────────────────────────────
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelTab: (tab: StudioState["leftPanelTab"]) => void;
  setRightPanelTab: (tab: StudioState["rightPanelTab"]) => void;
  toggleFullscreen: () => void;
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnap: () => void;
  setGridSize: (size: number) => void;
}

// ---------------------------------------------------------------------------
// INITIAL STATE
// ---------------------------------------------------------------------------

const INITIAL_VIEWPORT: EditorViewport = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
};

const INITIAL_SELECTION: EditorSelection = {
  componentIds: [],
  layerIds: [],
};

const initialState: StudioState = {
  gameId: null,
  mode: "design",
  activeTool: "select",
  previousTool: "select",
  viewport: INITIAL_VIEWPORT,
  selection: INITIAL_SELECTION,
  history: [],
  historyIndex: -1,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  autoSaveEnabled: true,
  leftPanelVisible: true,
  rightPanelVisible: true,
  leftPanelTab: "layers",
  rightPanelTab: "properties",
  isFullscreen: false,
  showGrid: true,
  showRulers: false,
  snapToGrid: true,
  gridSize: 20,
};

// Max history entries to keep in memory (each entry is a JSON snapshot)
const MAX_HISTORY = 50;

const ZOOM_STEP = 0.15;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

// ---------------------------------------------------------------------------
// STORE
// ---------------------------------------------------------------------------

export const useStudioStore = create<StudioState & StudioActions>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // ── Session ────────────────────────────────────────────────────────
        openGame: (gameId) =>
          set((state) => {
            state.gameId = gameId;
            state.isDirty = false;
            state.history = [];
            state.historyIndex = -1;
            state.selection = INITIAL_SELECTION;
            state.viewport = INITIAL_VIEWPORT;
          }),

        closeGame: () =>
          set((state) => {
            Object.assign(state, { ...initialState });
          }),

        // ── Mode & Tool ───────────────────────────────────────────────────
        setMode: (mode) =>
          set((state) => {
            state.mode = mode;
            // In non-design modes, reset to select tool
            if (mode !== "design") state.activeTool = "select";
          }),

        setTool: (tool) =>
          set((state) => {
            state.previousTool = state.activeTool;
            state.activeTool = tool;
          }),

        toggleTool: (tool) =>
          set((state) => {
            if (state.activeTool === tool) {
              // Toggle back to previous tool
              const prev = state.previousTool;
              state.previousTool = state.activeTool;
              state.activeTool = prev;
            } else {
              state.previousTool = state.activeTool;
              state.activeTool = tool;
            }
          }),

        // ── Viewport ──────────────────────────────────────────────────────
        setZoom: (zoom) =>
          set((state) => {
            state.viewport.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
          }),

        zoomIn: () =>
          set((state) => {
            const next = state.viewport.zoom * (1 + ZOOM_STEP);
            state.viewport.zoom = Math.min(MAX_ZOOM, next);
          }),

        zoomOut: () =>
          set((state) => {
            const next = state.viewport.zoom * (1 - ZOOM_STEP);
            state.viewport.zoom = Math.max(MIN_ZOOM, next);
          }),

        resetZoom: () =>
          set((state) => {
            state.viewport.zoom = 1;
            state.viewport.panX = 0;
            state.viewport.panY = 0;
          }),

        setPan: (x, y) =>
          set((state) => {
            state.viewport.panX = x;
            state.viewport.panY = y;
          }),

        resetViewport: () =>
          set((state) => {
            state.viewport = INITIAL_VIEWPORT;
          }),

        // ── Selection ─────────────────────────────────────────────────────
        selectComponent: (id, addToSelection = false) =>
          set((state) => {
            if (addToSelection) {
              if (!state.selection.componentIds.includes(id)) {
                state.selection.componentIds.push(id);
              }
            } else {
              state.selection.componentIds = [id];
              state.selection.layerIds = [];
            }
          }),

        selectLayer: (id, addToSelection = false) =>
          set((state) => {
            if (addToSelection) {
              if (!state.selection.layerIds.includes(id)) {
                state.selection.layerIds.push(id);
              }
            } else {
              state.selection.layerIds = [id];
            }
          }),

        clearSelection: () =>
          set((state) => {
            state.selection = INITIAL_SELECTION;
          }),

        selectAll: (componentIds) =>
          set((state) => {
            state.selection.componentIds = [...componentIds];
          }),

        // ── History ───────────────────────────────────────────────────────
        pushHistory: (description, snapshot) =>
          set((state) => {
            // Truncate redo branches
            const cutoff = state.historyIndex + 1;
            state.history = state.history.slice(0, cutoff);

            state.history.push({
              timestamp: Date.now(),
              description,
              snapshot,
            });

            // Cap history length
            if (state.history.length > MAX_HISTORY) {
              state.history = state.history.slice(-MAX_HISTORY);
            }

            state.historyIndex = state.history.length - 1;
            state.isDirty = true;
          }),

        undo: () => {
          const state = get();
          if (state.historyIndex <= 0) return null;
          const targetIndex = state.historyIndex - 1;
          const entry = state.history[targetIndex];
          if (!entry) return null;
          set((s) => {
            s.historyIndex = targetIndex;
            s.isDirty = true;
          });
          return entry.snapshot;
        },

        redo: () => {
          const state = get();
          if (state.historyIndex >= state.history.length - 1) return null;
          const targetIndex = state.historyIndex + 1;
          const entry = state.history[targetIndex];
          if (!entry) return null;
          set((s) => {
            s.historyIndex = targetIndex;
            s.isDirty = true;
          });
          return entry.snapshot;
        },

        // ── Persistence ───────────────────────────────────────────────────
        markDirty: () => set((state) => { state.isDirty = true; }),
        markSaving: () => set((state) => { state.isSaving = true; }),
        markSaved: () =>
          set((state) => {
            state.isSaving = false;
            state.isDirty = false;
            state.lastSavedAt = new Date()
            .toISOString();
          }),
        setAutoSave: (enabled) =>
          set((state) => { state.autoSaveEnabled = enabled; }),

        // ── UI ────────────────────────────────────────────────────────────
        toggleLeftPanel:  () => set((s) => { s.leftPanelVisible  = !s.leftPanelVisible; }),
        toggleRightPanel: () => set((s) => { s.rightPanelVisible = !s.rightPanelVisible; }),
        setLeftPanelTab:  (tab) => set((s) => { s.leftPanelTab  = tab; }),
        setRightPanelTab: (tab) => set((s) => { s.rightPanelTab = tab; }),
        toggleFullscreen: () => set((s) => { s.isFullscreen = !s.isFullscreen; }),
        toggleGrid:   () => set((s) => { s.showGrid   = !s.showGrid; }),
        toggleRulers: () => set((s) => { s.showRulers = !s.showRulers; }),
        toggleSnap:   () => set((s) => { s.snapToGrid = !s.snapToGrid; }),
        setGridSize:  (size) => set((s) => { s.gridSize = size; }),
      }))
    ),
    { name: "velonix-studio", enabled: process.env.NODE_ENV === "development" }
  )
);

// ---------------------------------------------------------------------------
// SELECTORS (memoized per SoC)
// ---------------------------------------------------------------------------

export const selectCanUndo = (s: StudioState) => s.historyIndex > 0;
export const selectCanRedo = (s: StudioState) =>
  s.historyIndex < s.history.length - 1;
export const selectIsDesignMode = (s: StudioState) => s.mode === "design";
export const selectHasSelection = (s: StudioState) =>
  s.selection.componentIds.length > 0 || s.selection.layerIds.length > 0;
export const selectZoomPercent = (s: StudioState) =>
  Math.round(s.viewport.zoom * 100);

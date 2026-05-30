"use client";

import { useCallback } from "react";
import { useStudioStore } from "@/stores/studioStore";
import { useUpdateGame } from "./useGames";
import type { ID } from "@velonix/types";

/**
 * useStudio — high-level hook combining the Zustand studio store
 * with server-side autosave via TanStack Query mutations.
 *
 * Handles the save-debounce cycle:
 *   user edits → markDirty → autosave timer → saveNow → markSaved
 */
export function useStudio(gameId: ID) {
  const {
    isDirty,
    isSaving,
    lastSavedAt,
    markDirty,
    markSaving,
    markSaved,
    autoSaveEnabled,
    pushHistory,
  } = useStudioStore();

  const updateGame = useUpdateGame(gameId);

  /** Immediately persist current studio data to the API */
  const saveNow = useCallback(async (snapshot?: Record<string, unknown>) => {
    if (!isDirty && !snapshot) return;
    markSaving();
    try {
      await updateGame.mutateAsync({ studioData: snapshot } as never);
      markSaved();
    } catch {
      // On failure, leave isDirty=true so auto-save retries
      useStudioStore.setState({ isSaving: false });
    }
  }, [isDirty, markSaving, markSaved, updateGame]);

  /**
   * Record a named change to the undo stack and mark the project dirty.
   * Call this after any mutation to the game data.
   */
  const recordChange = useCallback(
    (description: string, snapshot: string) => {
      pushHistory(description, snapshot);
      markDirty();
    },
    [pushHistory, markDirty]
  );

  return {
    isDirty,
    isSaving,
    lastSavedAt,
    autoSaveEnabled,
    saveNow,
    recordChange,
  };
}

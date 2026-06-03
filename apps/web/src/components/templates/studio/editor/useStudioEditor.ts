"use client";

import { useStudioEditorState } from "./useStudioEditorState";
import { useStudioActions } from "./useStudioActions";
import { useStudioGestures } from "./useStudioGestures";
import { useStudioPointerMotion } from "./useStudioPointerMotion";
import { useStudioMenuKeyboard } from "./useStudioMenuKeyboard";

export function useStudioEditor(gameId: string) {
  const state = useStudioEditorState(gameId);
  const actions = useStudioActions(state);
  const gestures = useStudioGestures(state, actions);
  const motion = useStudioPointerMotion(state);
  const menu = useStudioMenuKeyboard(state, actions);
  return { ...state, ...actions, ...gestures,
    ...motion, ...menu };
}

export type StudioEditor = ReturnType<typeof useStudioEditor>;

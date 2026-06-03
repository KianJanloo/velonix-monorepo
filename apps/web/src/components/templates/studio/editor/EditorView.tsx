"use client";

import {
  StudioTutorial,
} from "@/components/templates/StudioTutorial";

import {
  StudioMarketplace,
} from "@/components/templates/StudioMarketplace";

import {
  ShareDialog,
  GuideDialog,
} from "../dialogs";

import {
  ContextMenu,
} from "../core";

import type { StudioEditor } from "./useStudioEditor";
import { EditorToolbar } from "./EditorToolbar";
import { EditorPagesBar } from "./EditorPagesBar";
import { EditorBody } from "./EditorBody";

export function EditorView({ ed }: { ed: StudioEditor }) {
  const {
    gameId,
    guide,
    setGuide,
    guideOpen,
    setGuideOpen,
    closeTutorial,
    shareOpen,
    setShareOpen,
    tutorialOpen,
    marketOpen,
    setMarketOpen,
    menu,
    selectionIds,
    insertAssetComponents,
    getSelectionPayload,
    effectiveReadOnly,
    closeMenu,
    buildMenuItems,
  } = ed;

  return (
    <div className="flex flex-col h-screen bg-deep-void overflow-hidden">
      <EditorToolbar ed={ed} />

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


      <EditorPagesBar ed={ed} />

      <EditorBody ed={ed} />
    </div>
  );
}

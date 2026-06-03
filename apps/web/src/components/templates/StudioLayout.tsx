"use client";

import { useStudioEditor } from "./studio/editor/useStudioEditor";
import { MobileNotice } from "./studio/editor/MobileNotice";
import { PreviewScreen } from "./studio/editor/PreviewScreen";
import { EditorView } from "./studio/editor/EditorView";

export type {
  CanvasComp,
  GameRule,
  GameGuide,
} from "./studio/core";

interface StudioLayoutProps {
  gameId: string;
}

export function StudioLayout({ gameId }: StudioLayoutProps) {
  const ed = useStudioEditor(gameId);

  if (ed.isMobile && !ed.inPreview) return <MobileNotice ed={ed} />;
  if (ed.inPreview) return <PreviewScreen ed={ed} />;
  return <EditorView ed={ed} />;
}

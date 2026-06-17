"use client";

import { use } from "react";
import Link from "next/link";
import { GameDetail } from "@/components/organisms/game/GameDetail";

export default function AdminGamePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <Link href="/admin/games" className="inline-flex items-center gap-1.5 text-soft-gray text-sm font-ui hover:text-parchment-light mb-4">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to games
      </Link>
      <GameDetail gameId={id} adminPreview />
    </div>
  );
}

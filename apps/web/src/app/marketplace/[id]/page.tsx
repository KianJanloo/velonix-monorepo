import type { Metadata } from "next";
import { GameDetail } from "@/components/organisms/GameDetail";

export const metadata: Metadata = { title: "Game" };

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GameDetail gameId={id} />;
}

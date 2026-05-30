import type { Metadata } from "next";
import { StudioLayout } from "@/components/templates/StudioLayout";

export const metadata: Metadata = { title: "Studio" };

interface StudioPageProps {
  params: Promise<{ gameId: string }>;
}

export default async function StudioPage({ params }: StudioPageProps) {
  const { gameId } = await params;
  return <StudioLayout gameId={gameId} />;
}

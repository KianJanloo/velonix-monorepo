import type { Metadata } from "next";
import { PublishSettings } from "@/components/organisms/studio/PublishSettings";

export const metadata: Metadata = { title: "Publish — Studio" };

export default async function PublishPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <PublishSettings gameId={gameId} />;
}

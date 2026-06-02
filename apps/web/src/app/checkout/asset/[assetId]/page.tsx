import type { Metadata } from "next";
import { AssetCheckoutView } from "@/components/organisms/AssetCheckoutView";

export const metadata: Metadata = { title: "Buy component — Velonix" };

export default async function AssetCheckoutPage({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  return <AssetCheckoutView assetId={assetId} />;
}

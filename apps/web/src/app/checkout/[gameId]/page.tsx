import type { Metadata } from "next";
import { CheckoutView } from "@/components/organisms/CheckoutView";

export const metadata: Metadata = { title: "Checkout — Velonix" };

export default async function CheckoutPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return <CheckoutView gameId={gameId} />;
}

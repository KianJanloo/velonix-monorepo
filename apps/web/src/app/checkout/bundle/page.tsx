import type { Metadata } from "next";
import { BundleCheckoutView } from "@/components/organisms/checkout/BundleCheckoutView";

export const metadata: Metadata = { title: "Build a bundle — Velonix" };

export default function BundleCheckoutPage() {
  return <BundleCheckoutView />;
}

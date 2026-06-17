import type { Metadata } from "next";
import Link from "next/link";
import { CreatorAnalytics } from "@/components/organisms/dashboard/CreatorAnalytics";

export const metadata: Metadata = { title: "Analytics — Velonix" };

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard" className="text-soft-gray text-sm font-ui hover:text-parchment-light">
          ← Back to dashboard
        </Link>
        <h1 className="font-display text-2xl font-bold tracking-display mt-4 mb-6">Creator Analytics</h1>
        <CreatorAnalytics />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { DemoVideoStudio } from "@/components/organisms/studio/DemoVideoStudio";

export const metadata: Metadata = { title: "Demo video — Velonix" };

export default async function DemoVideoPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/dashboard" className="text-soft-gray text-sm font-ui hover:text-parchment-light">
          ← Back to dashboard
        </Link>
        <div className="mt-4">
          <DemoVideoStudio gameId={gameId} />
        </div>
      </div>
    </div>
  );
}

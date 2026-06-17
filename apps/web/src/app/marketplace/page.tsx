import type { Metadata } from "next";
import { MarketplaceFiltersPanel } from "@/components/organisms/marketplace/MarketplaceFiltersPanel";
import { MarketplaceGrid } from "@/components/organisms/marketplace/MarketplaceGrid";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse and purchase premium digital board games created by independent designers.",
};

interface MarketplacePageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const search = params["search"] ?? "";
  const category = params["category"] ?? "";
  const sort = params["sort"] ?? "newest";

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-black tracking-display text-parchment-light mb-3">
            Marketplace
          </h1>
          <div className="flex items-center gap-4 max-w-xs mx-auto mb-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-wood-light to-transparent" />
            <div className="w-1.5 h-1.5 rotate-45 bg-royal-gold shadow-gold" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm-wood-light to-transparent" />
          </div>
          <p className="font-body text-lg text-parchment-mid italic max-w-xl mx-auto">
            Discover games crafted by independent designers. Every purchase directly supports the creator.
          </p>
        </div>

        {/* Filters + Grid */}
        <div className="flex gap-8">
          <aside className="w-64 shrink-0 hidden lg:block">
            <MarketplaceFiltersPanel initialCategory={category} />
          </aside>
          <main className="flex-1 min-w-0">
            <MarketplaceGrid initialSearch={search} initialSort={sort} />
          </main>
        </div>
      </div>
    </div>
  );
}

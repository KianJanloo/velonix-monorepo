"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { GameCard } from "@/components/molecules/GameCard";
import { useMarketplace } from "@/hooks/useGames";
import { Pagination } from "@/components/atoms/Pagination";

interface MarketplaceGridProps {
  initialSearch?: string;
  initialSort?: string;
}

export function MarketplaceGrid({ initialSearch = "", initialSort = "newest" }: MarketplaceGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? initialSearch;
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search input into URL param
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (localSearch) {
        params.set("search", localSearch);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);
  const category = searchParams.get("category") ?? "";
  const sort = searchParams.get("sort") ?? initialSort;
  const price = searchParams.get("price") ?? "all";
  const complexity = searchParams.get("complexity") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const setPage = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const validSorts = ["newest","popular","top_rated","price_asc","price_desc","most_sold"] as const;
  type SortOption = typeof validSorts[number];
  const validSort = validSorts.includes(sort as SortOption) ? (sort as SortOption) : ("newest" as const);

  // Category is now dynamic from DB — pass raw string, API validates server-side
  type MarketplaceComplexity = "light"|"medium"|"medium_heavy"|"heavy";
  const validComplexities: MarketplaceComplexity[] = ["light","medium","medium_heavy","heavy"];
  const typedComplexity = validComplexities.includes(complexity as MarketplaceComplexity) ? (complexity as MarketplaceComplexity) : undefined;

  const filters = {
    ...(search ? { search } : {}),
    ...(category ? { category: category as never } : {}),
    sort: validSort,
    ...(price === "free" ? { isFree: true } : price === "paid" ? { isFree: false } : {}),
    ...(typedComplexity ? { complexity: typedComplexity } : {}),
    page,
    perPage: 24,
  };

  const { data, isLoading, isError } = useMarketplace(filters);

  if (isLoading) {
    return (
      <div>
        <div className="mb-6 h-10 bg-warm-wood/20 rounded-lg animate-pulse" />
        <p className="text-2xs text-soft-gray font-ui uppercase tracking-widest mb-4">Loading...</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="v-card h-48 animate-pulse bg-warm-wood/20" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="v-card flex flex-col items-center justify-center py-16 text-center">
        <p className="font-display text-parchment-mid text-lg mb-2">Failed to load marketplace</p>
        <p className="text-soft-gray text-sm font-ui">Check your connection and refresh the page.</p>
      </div>
    );
  }

  const games = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6 relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soft-gray-dark pointer-events-none"
          width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"
        >
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search games, designers..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="v-input pl-10"
        />
      </div>

      {/* Results count */}
      <p className="text-2xs text-soft-gray font-ui uppercase tracking-widest mb-4">
        {total} game{total !== 1 ? "s" : ""} found
      </p>

      {/* Grid */}
      {games.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-parchment-mid text-lg mb-2">No games found</p>
          <p className="text-soft-gray text-sm font-ui">Try adjusting your search or filters.</p>
        </div>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

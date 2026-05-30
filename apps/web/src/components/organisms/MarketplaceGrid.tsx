"use client";

import { useState } from "react";
import { GameCard } from "@/components/molecules/GameCard";
import type { GameSummary } from "@velonix/types";

// Placeholder data — replace with useQuery(() => fetchMarketplace(filters))
const MOCK_LISTINGS: GameSummary[] = [
  {
    id: "1", creatorId: "u1", creatorUsername: "stormrider",
    title: "Verdant Conquest", shortDescription: "A strategic territory control game for 2-4 players set in a lush mythical world.",
    thumbnailUrl: null, category: "strategy", isFree: false, priceUsd: 899,
    averageRating: 4.8, totalRatings: 142, totalPurchases: 142, status: "published", publishedAt: "2024-10-01",
  },
  {
    id: "2", creatorId: "u2", creatorUsername: "darkweave",
    title: "Shadow Tribunal", shortDescription: "Hidden role deduction with asymmetric powers. Can you find the traitor before it's too late?",
    thumbnailUrl: null, category: "strategy", isFree: false, priceUsd: 1499,
    averageRating: 4.4, totalRatings: 87, totalPurchases: 87, status: "published", publishedAt: "2024-11-15",
  },
  {
    id: "3", creatorId: "u3", creatorUsername: "aurumcraft",
    title: "Gilded Realm", shortDescription: "An epic cooperative RPG board game. Build kingdoms, slay dragons, earn glory.",
    thumbnailUrl: null, category: "cooperative", isFree: true, priceUsd: null,
    averageRating: 4.9, totalRatings: 23, totalPurchases: 156, status: "published", publishedAt: "2025-01-05",
  },
  {
    id: "4", creatorId: "u4", creatorUsername: "hexmind",
    title: "Quantum Tiles", shortDescription: "An elegant abstract puzzle. Place tiles, shift the grid, dominate the board.",
    thumbnailUrl: null, category: "abstract", isFree: false, priceUsd: 499,
    averageRating: 4.2, totalRatings: 61, totalPurchases: 61, status: "published", publishedAt: "2024-09-20",
  },
  {
    id: "5", creatorId: "u5", creatorUsername: "ironforge",
    title: "Engine Empire", shortDescription: "Build your engine, corner the market, outlast your rivals in this deck-building masterpiece.",
    thumbnailUrl: null, category: "deck_building", isFree: false, priceUsd: 1199,
    averageRating: 4.6, totalRatings: 204, totalPurchases: 204, status: "published", publishedAt: "2024-08-01",
  },
  {
    id: "6", creatorId: "u6", creatorUsername: "mistveil",
    title: "The Fog Between", shortDescription: "Cooperative horror adventure. Explore a shifting mansion before the fog takes you.",
    thumbnailUrl: null, category: "cooperative", isFree: false, priceUsd: 999,
    averageRating: 4.7, totalRatings: 115, totalPurchases: 115, status: "published", publishedAt: "2024-12-01",
  },
];

interface MarketplaceGridProps {
  initialSearch?: string;
  initialSort?: string;
}

export function MarketplaceGrid({ initialSearch = "" }: MarketplaceGridProps) {
  const [search, setSearch] = useState(initialSearch);

  const filtered = MOCK_LISTINGS.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase()) ||
    g.shortDescription.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6 relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-soft-gray-dark"
          width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"
        >
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search games, designers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="v-input pl-10"
        />
      </div>

      {/* Results count */}
      <p className="text-2xs text-soft-gray font-ui uppercase tracking-widest mb-4">
        {filtered.length} games found
      </p>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="v-card flex flex-col items-center justify-center py-16 text-center">
          <p className="font-display text-parchment-mid text-lg mb-2">No games found</p>
          <p className="text-soft-gray text-sm font-ui">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}

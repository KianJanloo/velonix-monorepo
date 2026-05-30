"use client";

import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";

// Placeholder data — replace with useQuery(() => fetchMyGames())
const MOCK_GAMES = [
  {
    id: "1",
    title: "Verdant Conquest",
    status: "published" as const,
    category: "Strategy",
    isFree: false,
    priceUsd: 899,
    totalSales: 142,
    averageRating: 4.8,
    updatedAt: "2024-12-15",
  },
  {
    id: "2",
    title: "Shadow Tribunal",
    status: "reviewing" as const,
    category: "Deduction",
    isFree: false,
    priceUsd: 1499,
    totalSales: 0,
    averageRating: null,
    updatedAt: "2025-01-10",
  },
  {
    id: "3",
    title: "Gilded Realm",
    status: "draft" as const,
    category: "RPG",
    isFree: true,
    priceUsd: null,
    totalSales: 0,
    averageRating: null,
    updatedAt: "2025-01-14",
  },
];

const statusBadge = (status: string) => {
  if (status === "published") return <Badge variant="published" dot>Published</Badge>;
  if (status === "reviewing") return <Badge variant="info">In Review</Badge>;
  return <Badge variant="draft">Draft</Badge>;
};

export function GameGrid() {
  if (MOCK_GAMES.length === 0) {
    return (
      <div className="v-card flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-warm-wood flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="22" height="22" rx="3" stroke="rgba(245,196,81,0.4)" strokeWidth="1.5" />
            <path d="M14 9v10M9 14h10" stroke="rgba(245,196,81,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="font-display text-lg font-semibold text-parchment-light mb-2">No games yet</h3>
        <p className="text-soft-gray text-sm font-ui mb-6">Your first masterpiece awaits. Start creating.</p>
        <Link href="/studio/new">
          <Button variant="primary">Create Your First Game</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {MOCK_GAMES.map((game) => (
        <div
          key={game.id}
          className="v-card flex items-center gap-4 p-4 hover:border-warm-wood-light"
        >
          {/* Thumbnail placeholder */}
          <div className="w-14 h-14 rounded-lg bg-felt-dark border border-warm-wood shrink-0 flex items-center justify-center">
            <span className="font-display text-royal-gold text-xl font-bold opacity-40">
              {game.title[0]}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display text-sm font-bold tracking-wide text-parchment-light truncate">
                {game.title}
              </span>
              {statusBadge(game.status)}
            </div>
            <div className="flex items-center gap-3 text-2xs text-soft-gray font-ui">
              <span>{game.category}</span>
              <span className="text-warm-wood-light">|</span>
              <span>
                {game.isFree ? "Free" : `$${((game.priceUsd ?? 0) / 100).toFixed(2)}`}
              </span>
              {game.totalSales > 0 && (
                <>
                  <span className="text-warm-wood-light">|</span>
                  <span className="text-emerald-glow">{game.totalSales} sales</span>
                </>
              )}
              <span className="text-warm-wood-light">|</span>
              <span>Updated {game.updatedAt}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/studio/${game.id}`}>
              <Button variant="ghost" size="sm">Edit</Button>
            </Link>
            {game.status === "draft" && (
              <Button variant="primary" size="sm">Publish</Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

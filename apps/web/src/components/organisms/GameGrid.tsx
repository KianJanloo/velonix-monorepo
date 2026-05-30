"use client";

import Link from "next/link";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { useMyGames, useDeleteGame, usePublishGame } from "@/hooks/useGames";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { GameRecord } from "@/types/game";

const statusBadge = (status: GameRecord["status"]) => {
  if (status === "published") return <Badge variant="published" dot>Published</Badge>;
  if (status === "reviewing") return <Badge variant="info">In Review</Badge>;
  if (status === "rejected") return <Badge variant="danger">Rejected</Badge>;
  return <Badge variant="draft">Draft</Badge>;
};

export function GameGrid() {
  const { data: games, isLoading, isError } = useMyGames();
  const deleteGame = useDeleteGame();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="v-card flex items-center gap-4 p-4 animate-pulse">
            <div className="w-14 h-14 rounded-lg bg-warm-wood shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-warm-wood rounded w-1/3" />
              <div className="h-3 bg-warm-wood/60 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="v-card flex flex-col items-center justify-center py-12 text-center">
        <p className="text-crimson-flame font-ui text-sm mb-2">Failed to load games.</p>
        <p className="text-soft-gray text-xs font-ui">Check your connection and try again.</p>
      </div>
    );
  }

  if (!games || games.length === 0) {
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
      {games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          onDelete={() => deleteGame.mutate(game.id)}
          isDeleting={deleteGame.isPending && deleteGame.variables === game.id}
        />
      ))}
    </div>
  );
}

function GameRow({
  game,
  onDelete,
  isDeleting,
}: {
  game: GameRecord;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const publish = usePublishGame(game.id);

  return (
    <div className="v-card flex items-center gap-4 p-4 hover:border-warm-wood-light">
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-lg bg-felt-dark border border-warm-wood shrink-0 flex items-center justify-center overflow-hidden">
        {game.thumbnailUrl ? (
          <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-royal-gold text-xl font-bold opacity-40">
            {game.title[0]}
          </span>
        )}
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
          <span className="capitalize">{game.category}</span>
          <span className="text-warm-wood-light">|</span>
          <span>
            {game.isFree ? "Free" : `$${((game.priceUsd ?? 0) / 100).toFixed(2)}`}
          </span>
          {game.totalPurchases > 0 && (
            <>
              <span className="text-warm-wood-light">|</span>
              <span className="text-emerald-glow">{game.totalPurchases} sales</span>
            </>
          )}
          <span className="text-warm-wood-light">|</span>
          <span>Updated {new Date(game.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href={`/studio/${game.id}`}>
          <Button variant="ghost" size="sm">Edit</Button>
        </Link>
        {game.status === "draft" && (
          <Button
            variant="primary"
            size="sm"
            isLoading={publish.isPending}
            onClick={() => publish.mutate()}
          >
            Publish
          </Button>
        )}
        <ConfirmDialog
          title="Delete game?"
          description={`"${game.title}" will be permanently deleted along with all its components and data. This cannot be undone.`}
          confirmLabel="Yes, delete"
          variant="danger"
          onConfirm={onDelete}
        >
          {(open) => (
            <Button variant="danger" size="sm" isLoading={isDeleting} onClick={open}>
              Delete
            </Button>
          )}
        </ConfirmDialog>
      </div>
    </div>
  );
}

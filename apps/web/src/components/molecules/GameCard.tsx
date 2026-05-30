import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/atoms/Badge";
import { cn } from "@/lib/utils";
import type { GameSummary } from "@velonix/types";

interface GameCardProps {
  game: GameSummary;
  className?: string;
}

function StarRating({ rating, count }: { rating: number | null; count: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex text-royal-gold text-xs" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={i < full ? "opacity-100" : i === full && hasHalf ? "opacity-50" : "opacity-20"}>
            &#9733;
          </span>
        ))}
      </div>
      <span className="text-soft-gray-dark text-2xs font-ui">({count})</span>
    </div>
  );
}

export function GameCard({ game, className }: GameCardProps) {
  const statusBadge = () => {
    if (game.status === "published") return <Badge variant="published" dot>Live</Badge>;
    if (game.status === "draft") return <Badge variant="draft">Draft</Badge>;
    if (game.status === "reviewing") return <Badge variant="info">In Review</Badge>;
    return null;
  };

  return (
    <Link
      href={`/marketplace/${game.id}`}
      className={cn(
        "group flex flex-col bg-rich-wood-dark border border-warm-wood rounded-xl overflow-hidden",
        "transition-all duration-200 hover:border-warm-wood-light hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-felt-dark overflow-hidden flex items-center justify-center">
        {game.thumbnailUrl ? (
          <Image
            src={game.thumbnailUrl}
            alt={game.title ?? "Game thumbnail"}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-warm-wood/50 border border-royal-gold/15 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="26" height="26" rx="3" stroke="rgba(245,196,81,0.4)" strokeWidth="1.5" />
              <path d="M3 12h26M12 3v26" stroke="rgba(245,196,81,0.2)" strokeWidth="1" />
              <circle cx="16" cy="16" r="4" fill="rgba(245,196,81,0.15)" />
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-rich-wood-dark/90 via-transparent to-transparent" />
        {/* Status badge */}
        <div className="absolute top-2.5 right-2.5">{statusBadge()}</div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-display text-sm font-bold tracking-wide text-parchment-light mb-1 truncate">
          {game.title}
        </h3>
        <p className="text-2xs text-soft-gray font-ui mb-3">
          by <span className="text-emerald-glow">{game.creatorUsername}</span>
        </p>

        <p className="text-xs text-parchment-mid font-ui line-clamp-2 mb-3 leading-relaxed flex-1">
          {game.shortDescription}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-warm-wood mt-auto">
          <div className="font-ui font-bold text-sm">
            {game.isFree ? (
              <span className="text-soft-gray font-normal text-xs">Free</span>
            ) : (
              <span className="text-emerald-glow">
                ${((game.priceUsd ?? 0) / 100).toFixed(2)}
              </span>
            )}
          </div>
          <StarRating rating={game.averageRating} count={game.totalRatings} />
        </div>
      </div>
    </Link>
  );
}

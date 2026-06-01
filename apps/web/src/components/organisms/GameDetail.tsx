"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useGame, useGameReviews, useCreateReview, usePurchaseGame } from "@/hooks/useGames";
import { useCurrentUser } from "@/hooks/useAuth";
import { ApiError } from "@/lib/apiClient";
import { Button } from "@/components/atoms/Button";
import type { GameGuide } from "@/components/templates/StudioLayout";

interface GameRule { id: string; trigger: string; description: string }

const DIFFICULTY_STYLE: Record<string, string> = {
  intro: "bg-emerald-ghost text-emerald-glow",
  standard: "bg-[rgba(0,229,255,0.12)] text-cyan-spark",
  advanced: "bg-crimson-ghost text-crimson-flame",
};

function Stars({ rating, size = 14 }: { rating: number | null; size?: number }) {
  const r = rating ?? 0;
  return (
    <span className="inline-flex text-royal-gold" style={{ fontSize: size }}>
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} className={i < Math.round(r) ? "opacity-100" : "opacity-25"}>★</span>
      ))}
    </span>
  );
}

const TRIGGER_LABEL: Record<string, string> = {
  turn_start: "On turn start", turn_end: "On turn end", card_played: "When a card is played",
  token_moved: "When a token moves", dice_rolled: "When dice are rolled", game_end: "Win / end condition",
};

export function GameDetail({ gameId, adminPreview = false }: { gameId: string; adminPreview?: boolean }) {
  const { data: game, isLoading, error } = useGame(gameId);
  const { data: reviews } = useGameReviews(gameId);
  const purchase = usePurchaseGame();
  const createReview = useCreateReview(gameId);
  const user = useCurrentUser();

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  // Auth + query state only exist on the client; render a stable skeleton until
  // mounted to avoid hydration mismatches (server HTML has no user/cached data).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-deep-void">
        <div className="max-w-5xl mx-auto px-6 py-12 animate-pulse">
          <div className="h-64 bg-warm-wood/20 rounded-2xl mb-6" />
          <div className="h-8 w-1/3 bg-warm-wood/20 rounded mb-3" />
          <div className="h-4 w-2/3 bg-warm-wood/10 rounded" />
        </div>
      </div>
    );
  }

  // Inline not-found / error state (avoids throwing notFound() where no boundary exists)
  if (error || !game) {
    const is404 = error instanceof ApiError && error.statusCode === 404;
    return (
      <div className="min-h-screen bg-deep-void flex items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-2xl font-bold text-parchment-light mb-2">
            {is404 ? "Game not found" : "Couldn't load this game"}
          </p>
          <p className="text-soft-gray text-sm font-ui mb-6">
            {is404 ? "This game may have been removed or unpublished." : "Please try again in a moment."}
          </p>
          <Link href="/marketplace" className="inline-flex px-5 py-2.5 rounded-xl bg-emerald-glow text-deep-void font-ui font-bold text-sm hover:bg-emerald-bright transition-all">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const studio = game.studioData as { rules?: GameRule[]; guide?: GameGuide } | null;
  const rules = studio?.rules ?? [];
  const guide = studio?.guide ?? null;
  const hasGuide = !!guide && (
    !!guide.objective?.trim() || (guide.setupSteps?.length ?? 0) > 0 ||
    (guide.turnStructure?.length ?? 0) > 0 || (guide.scenarios?.length ?? 0) > 0
  );
  const owns = false; // ownership lookup could be added via library endpoint
  const price = game.isFree ? "Free" : `$${((game.priceUsd ?? 0) / 100).toFixed(2)}`;

  function buy() {
    if (!user) { window.location.href = `/auth/login?next=/marketplace/${gameId}`; return; }
    if (game!.isFree) { toast.success("Added to your library!"); return; }
    // Paid games go through the dedicated payment page (Stripe Elements).
    window.location.href = `/checkout/${gameId}`;
  }

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {adminPreview && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-crimson-ghost border border-crimson-flame/30 text-crimson-flame text-sm font-ui">
            Admin preview — reviewing submission. Status: <span className="font-semibold capitalize">{game.status}</span>
          </div>
        )}

        <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-soft-gray text-sm font-ui hover:text-parchment-light mb-6">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2L3 6l4.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero image */}
            <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden bg-felt-dark border border-warm-wood flex items-center justify-center">
              {game.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.thumbnailUrl} alt={game.title} className="w-full h-full object-cover" />
              ) : (
                <svg width="64" height="64" viewBox="0 0 80 80" fill="none" className="opacity-20"><polyline points="8,18 40,62 72,18" fill="none" stroke="#f5c451" strokeWidth="5"/></svg>
              )}
            </div>

            {/* Preview images */}
            {game.previewImages?.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {game.previewImages.slice(0, 6).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt={`preview ${i + 1}`} className="rounded-lg border border-warm-wood object-cover h-24 w-full" />
                ))}
              </div>
            )}

            {/* Title + meta */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xs text-emerald-glow font-ui uppercase tracking-wider bg-emerald-ghost px-2 py-1 rounded-full">{game.category?.replace("_", " ")}</span>
                <span className="text-2xs text-soft-gray font-ui capitalize">{game.complexity?.replace("_", " ")}</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black tracking-display mb-2">{game.title}</h1>
              {game.creator && (
                <Link href={`/profile/${game.creator.username}`} className="text-sm text-soft-gray font-ui hover:text-emerald-glow">
                  by <span className="text-emerald-glow">{game.creator.displayName}</span>
                </Link>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={game.averageRating} />
                <span className="text-2xs text-soft-gray font-ui">{game.averageRating ?? "—"} ({game.totalRatings} reviews)</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Players", value: `${game.playerCountMin}–${game.playerCountMax}` },
                { label: "Playtime", value: `${game.playtimeMin}–${game.playtimeMax} min` },
                { label: "Age", value: `${game.minAge}+` },
                { label: "Downloads", value: String(game.totalPurchases) },
              ].map(s => (
                <div key={s.label} className="v-card p-3 text-center">
                  <p className="font-display text-lg font-bold text-parchment-light">{s.value}</p>
                  <p className="text-2xs text-soft-gray font-ui uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            <section>
              <h2 className="font-display text-lg font-bold tracking-wide mb-3">About this game</h2>
              <p className="text-parchment-mid font-body text-base leading-relaxed whitespace-pre-line break-words">{game.description}</p>
            </section>

            {/* Rule guide */}
            {hasGuide && guide && (
              <section className="space-y-5">
                <h2 className="font-display text-lg font-bold tracking-wide">How to play</h2>

                {guide.objective?.trim() && (
                  <div className="v-card p-4">
                    <p className="text-2xs font-ui font-semibold text-emerald-glow uppercase tracking-wider mb-1">Objective</p>
                    <p className="text-sm text-parchment-mid font-ui leading-relaxed whitespace-pre-line">{guide.objective}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {guide.setupSteps?.length > 0 && (
                    <div>
                      <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Setup</p>
                      <ol className="space-y-1.5">
                        {guide.setupSteps.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-parchment-mid font-ui">
                            <span className="w-5 h-5 rounded-full bg-warm-wood/50 text-emerald-glow text-2xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {guide.turnStructure?.length > 0 && (
                    <div>
                      <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">On your turn</p>
                      <ol className="space-y-1.5">
                        {guide.turnStructure.map((s, i) => (
                          <li key={i} className="flex gap-2 text-sm text-parchment-mid font-ui">
                            <span className="text-royal-gold font-mono text-2xs mt-0.5 shrink-0">{i + 1}.</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>

                {guide.scenarios?.length > 0 && (
                  <div>
                    <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Scenarios & variants</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {guide.scenarios.map(s => (
                        <div key={s.id} className="v-card p-3.5">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-ui font-semibold text-parchment-light text-sm truncate">{s.name}</span>
                            <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize shrink-0 ${DIFFICULTY_STYLE[s.difficulty] ?? "bg-warm-wood text-soft-gray"}`}>{s.difficulty}</span>
                          </div>
                          {s.players && <p className="text-2xs text-soft-gray font-ui mb-1.5">{s.players} players</p>}
                          {s.description && <p className="text-sm text-parchment-mid font-ui leading-relaxed mb-2">{s.description}</p>}
                          {s.winCondition && <p className="text-2xs text-soft-gray font-ui"><span className="text-emerald-glow">Win:</span> {s.winCondition}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Rules (trigger → effect) */}
            {rules.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-bold tracking-wide mb-3">{hasGuide ? "Rules" : "How to play"}</h2>
                <div className="space-y-2">
                  {rules.map(r => (
                    <div key={r.id} className="v-card p-3">
                      <p className="text-2xs font-ui font-semibold text-emerald-glow mb-1">{TRIGGER_LABEL[r.trigger] ?? r.trigger}</p>
                      <p className="text-sm text-parchment-mid font-ui">{r.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            {game.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.tags.map(t => <span key={t} className="text-2xs text-soft-gray font-ui bg-warm-wood/40 px-2.5 py-1 rounded-full">#{t}</span>)}
              </div>
            )}

            {/* Reviews */}
            <section>
              <h2 className="font-display text-lg font-bold tracking-wide mb-4">Reviews</h2>
              {!adminPreview && (
                user ? (
                  <div className="v-card p-4 mb-4 space-y-3">
                    <p className="text-sm font-ui font-semibold text-parchment-light">Write a review</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xs text-soft-gray font-ui uppercase tracking-wider">Your rating</span>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setReviewRating(n)} className={`text-xl leading-none transition-colors ${n <= reviewRating ? "text-royal-gold" : "text-warm-wood-light hover:text-royal-gold/50"}`}>★</button>
                      ))}
                    </div>
                    <input className="v-input text-sm" placeholder="Review title (optional)" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} />
                    <textarea className="v-input text-sm resize-none h-20" placeholder="Share your thoughts…" value={reviewBody} onChange={e => setReviewBody(e.target.value)} />
                    <Button variant="primary" size="sm" isLoading={createReview.isPending} disabled={!reviewBody.trim()}
                      onClick={() => createReview.mutate({ gameId, rating: reviewRating, title: reviewTitle || undefined, body: reviewBody || undefined }, {
                        onSuccess: () => { setReviewTitle(""); setReviewBody(""); setReviewRating(5); },
                      })}>
                      Post Review
                    </Button>
                  </div>
                ) : (
                  <div className="v-card p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm text-soft-gray font-ui">Sign in to share your review of this game.</p>
                    <Link href={`/auth/login?next=/marketplace/${gameId}`} className="px-4 py-2 rounded-lg bg-emerald-glow text-deep-void text-sm font-ui font-bold hover:bg-emerald-bright transition-all shrink-0">
                      Sign in to review
                    </Link>
                  </div>
                )
              )}
              <div className="space-y-3">
                {reviews?.length ? reviews.map(rev => (
                  <div key={rev.id} className="v-card p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-ui font-semibold text-parchment-light">{rev.author?.displayName ?? "Player"}</span>
                      <Stars rating={rev.rating} size={12} />
                    </div>
                    {rev.title && <p className="text-sm font-ui font-semibold text-parchment-mid mb-1">{rev.title}</p>}
                    {rev.body && <p className="text-sm text-soft-gray font-ui">{rev.body}</p>}
                    {rev.isVerifiedPurchase && <span className="text-2xs text-emerald-glow font-ui mt-1 inline-block">✓ Verified purchase</span>}
                  </div>
                )) : (
                  <p className="text-soft-gray text-sm font-ui py-4 text-center">No reviews yet. Be the first!</p>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar — purchase */}
          <div className="lg:col-span-1">
            <div className="v-card p-6 lg:sticky lg:top-20">
              <p className="font-display text-3xl font-black text-parchment-light mb-1">{price}</p>
              {!game.isFree && game.hasTrial && <p className="text-2xs text-emerald-glow font-ui mb-3">Free trial available</p>}
              {!adminPreview && (
                <Button variant="primary" className="w-full mt-3" isLoading={purchase.isPending} onClick={buy} disabled={owns}>
                  {owns ? "In your library" : game.isFree ? "Get it free" : "Buy now"}
                </Button>
              )}
              <div className="mt-4 pt-4 border-t border-warm-wood space-y-2 text-sm font-ui">
                <div className="flex justify-between"><span className="text-soft-gray">Category</span><span className="text-parchment-light capitalize">{game.category?.replace("_"," ")}</span></div>
                <div className="flex justify-between"><span className="text-soft-gray">Complexity</span><span className="text-parchment-light capitalize">{game.complexity?.replace("_"," ")}</span></div>
                <div className="flex justify-between"><span className="text-soft-gray">Version</span><span className="text-parchment-light font-mono">{game.version}</span></div>
                <div className="flex justify-between"><span className="text-soft-gray">Language</span><span className="text-parchment-light uppercase">{game.language}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

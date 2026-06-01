import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import type { GameRecord, GameReview } from "@/types/game";
import type { GameSummary, PaginatedResponse } from "@velonix/types";
import type { CreateGameDto, UpdateGameDto, MarketplaceFiltersDto, PriceSuggestion } from "@velonix/game-engine";

// ── Query Keys ────────────────────────────────────────────────────────────────

export const gameKeys = {
  all: ["games"] as const,
  lists: () => [...gameKeys.all, "list"] as const,
  list: (filters: Partial<MarketplaceFiltersDto>) => [...gameKeys.lists(), filters] as const,
  myGames: () => [...gameKeys.all, "mine"] as const,
  detail: (id: string) => [...gameKeys.all, "detail", id] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch all games in the authenticated user's library */
export function useMyGames() {
  return useQuery({
    queryKey: gameKeys.myGames(),
    queryFn: () => apiClient.get<GameRecord[]>("/games/mine"),
  });
}

/** Fetch marketplace listings with optional filters */
export function useMarketplace(filters: Partial<MarketplaceFiltersDto> = {}) {
  return useQuery({
    queryKey: gameKeys.list(filters),
    queryFn: () =>
      apiClient.get<PaginatedResponse<GameSummary>>("/marketplace", { params: filters as Record<string, string | number | boolean | string[] | undefined | null> }),
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetch a single game by ID */
export function useGame(gameId: string) {
  return useQuery({
    queryKey: gameKeys.detail(gameId),
    queryFn: () => apiClient.get<GameRecord>(`/games/${gameId}`),
    enabled: !!gameId,
  });
}

/** Reviews for a game */
export function useGameReviews(gameId: string) {
  return useQuery({
    queryKey: [...gameKeys.detail(gameId), "reviews"],
    queryFn: () => apiClient.get<GameReview[]>(`/marketplace/${gameId}/reviews`),
    enabled: !!gameId,
  });
}

/** Submit a review for a purchased game */
export function useCreateReview(gameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { gameId: string; rating: number; title?: string | undefined; body?: string | undefined }) =>
      apiClient.post("/marketplace/reviews", dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...gameKeys.detail(gameId), "reviews"] });
      void qc.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      toast.success("Review posted!");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to post review."),
  });
}

export interface GamePurchaseIntent {
  clientSecret: string | null;
  amount: number;
  platformFee: number;
  creatorEarnings: number;
}

/** Create a Stripe PaymentIntent for purchasing a game (drives the payment page) */
export function usePurchaseGame() {
  return useMutation({
    mutationFn: (gameId: string) =>
      apiClient.post<GamePurchaseIntent>(`/payments/game/${gameId}/intent`),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not start checkout."),
  });
}

/** Create a new game */
export function useCreateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGameDto) => apiClient.post<GameRecord>("/games", dto),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gameKeys.myGames() });
    },
  });
}

/** Update an existing game */
export function useUpdateGame(gameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateGameDto) => apiClient.patch<GameRecord>(`/games/${gameId}`, dto),
    onSuccess: (updated) => {
      qc.setQueryData(gameKeys.detail(gameId), updated);
      void qc.invalidateQueries({ queryKey: gameKeys.myGames() });
      // Complexity may have changed, which drives the price suggestion.
      void qc.invalidateQueries({ queryKey: [...gameKeys.detail(gameId), "price-suggestion"] });
    },
  });
}

/** Submit a game for marketplace review */
export function usePublishGame(gameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<GameRecord>(`/games/${gameId}/publish`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gameKeys.detail(gameId) });
      void qc.invalidateQueries({ queryKey: gameKeys.myGames() });
    },
  });
}

/** Smart price suggestion based on complexity and similar published games */
export function usePriceSuggestion(gameId: string, enabled = true) {
  return useQuery({
    queryKey: [...gameKeys.detail(gameId), "price-suggestion"],
    queryFn: () => apiClient.get<PriceSuggestion>(`/games/${gameId}/price-suggestion`),
    enabled: !!gameId && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** Delete a game */
export function useDeleteGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gameId: string) => apiClient.delete(`/games/${gameId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: gameKeys.myGames() });
    },
  });
}

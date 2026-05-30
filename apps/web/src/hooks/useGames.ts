import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { GameRecord } from "@/types/game";
import type { GameSummary, PaginatedResponse } from "@velonix/types";
import type { CreateGameDto, UpdateGameDto, MarketplaceFiltersDto } from "@velonix/game-engine";

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

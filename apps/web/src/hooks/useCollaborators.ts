import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import { gameKeys } from "./useGames";
import type { CollaboratorRole } from "@velonix/types";

export interface CollaboratorDto {
  id: string;
  gameId: string;
  userId: string;
  role: CollaboratorRole;
  invitedById: string;
  createdAt: string;
  user?: { id: string; username: string; displayName: string; avatarUrl: string | null };
}

export type StudioMembership =
  | { kind: "owner" }
  | { kind: "collaborator"; role: CollaboratorRole }
  | { kind: "none" };

const collabKey = (gameId: string) => [...gameKeys.detail(gameId), "collaborators"] as const;

export function useCollaborators(gameId: string, enabled = true) {
  return useQuery({
    queryKey: collabKey(gameId),
    queryFn: () => apiClient.get<CollaboratorDto[]>(`/games/${gameId}/collaborators`),
    enabled: !!gameId && enabled,
  });
}

export function useMyMembership(gameId: string, enabled = true) {
  return useQuery({
    queryKey: [...gameKeys.detail(gameId), "membership"],
    queryFn: () => apiClient.get<StudioMembership>(`/games/${gameId}/collaborators/me`),
    enabled: !!gameId && enabled,
    staleTime: 60 * 1000,
  });
}

export function useInviteCollaborator(gameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { identifier: string; role: CollaboratorRole }) =>
      apiClient.post<CollaboratorDto>(`/games/${gameId}/collaborators`, input),
    onSuccess: (c) => {
      void qc.invalidateQueries({ queryKey: collabKey(gameId) });
      toast.success(`${c.user?.displayName ?? "Collaborator"} added as ${c.role}.`);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not add collaborator."),
  });
}

export function useUpdateCollaboratorRole(gameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { userId: string; role: CollaboratorRole }) =>
      apiClient.patch<CollaboratorDto>(`/games/${gameId}/collaborators/${input.userId}`, { role: input.role }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: collabKey(gameId) }); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not update role."),
  });
}

export function useRemoveCollaborator(gameId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiClient.delete(`/games/${gameId}/collaborators/${userId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: collabKey(gameId) });
      toast.success("Collaborator removed.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not remove collaborator."),
  });
}

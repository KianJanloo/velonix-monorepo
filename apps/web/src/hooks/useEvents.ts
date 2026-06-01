"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import type { PromoEvent, PromoEventPlacement } from "@velonix/types";

export type PromoEventInput = Partial<Omit<PromoEvent, "id" | "createdAt" | "updatedAt">> & {
  title: string;
  message: string;
};

// ── Public ────────────────────────────────────────────────────────────────────

/** Currently-live promo events for a placement (banners). */
export function useActiveEvents(placement: PromoEventPlacement = "global") {
  return useQuery({
    queryKey: ["events", "active", placement],
    queryFn: () => apiClient.get<PromoEvent[]>("/events/active", { params: { placement } }),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export function useAdminEvents() {
  return useQuery({
    queryKey: ["admin", "events"],
    queryFn: () => apiClient.get<PromoEvent[]>("/admin/events"),
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ["admin", "events"] });
  void qc.invalidateQueries({ queryKey: ["events", "active"] });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PromoEventInput) => apiClient.post<PromoEvent>("/admin/events", input),
    onSuccess: () => { invalidate(qc); toast.success("Event created."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to create event."),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<PromoEventInput> }) =>
      apiClient.patch<PromoEvent>(`/admin/events/${id}`, patch),
    onSuccess: () => { invalidate(qc); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update event."),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/events/${id}`),
    onSuccess: () => { invalidate(qc); toast.success("Event deleted."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete event."),
  });
}

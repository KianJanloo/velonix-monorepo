"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";

export type TicketStatus = "open" | "pending" | "resolved";
export type TicketCategory = "general" | "billing" | "technical" | "report" | "feature";

export interface SupportMessage {
  id: string;
  senderRole: "user" | "admin";
  body: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  lastMessageAt: string;
  createdAt: string;
  messages?: SupportMessage[];
}

export interface CreateTicketInput {
  subject: string;
  body: string;
  category?: TicketCategory;
  name?: string;
  email?: string;
}

// ── User ───────────────────────────────────────────────────────────────────

export function useMyTickets(enabled = true) {
  return useQuery({
    queryKey: ["support", "mine"],
    queryFn: () => apiClient.get<SupportTicket[]>("/support/tickets/mine"),
    enabled,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) => apiClient.post<SupportTicket>("/support/tickets", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["support", "mine"] });
      toast.success("Your message was sent. We'll get back to you by email.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't send your message."),
  });
}

export function useReplyTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiClient.post<SupportTicket>(`/support/tickets/${id}/reply`, { body }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["support", "mine"] }); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Couldn't send your reply."),
  });
}

// ── Admin ──────────────────────────────────────────────────────────────────

export function useAdminTickets(status?: TicketStatus, page = 1) {
  return useQuery({
    queryKey: ["support", "admin", { status, page }],
    queryFn: () => apiClient.get<{ data: SupportTicket[]; total: number; totalPages: number }>(
      "/support/admin/tickets", { params: { page, ...(status ? { status } : {}) } },
    ),
  });
}

export function useAdminTicket(id: string | null) {
  return useQuery({
    queryKey: ["support", "admin", "detail", id],
    queryFn: () => apiClient.get<SupportTicket>(`/support/admin/tickets/${id}`),
    enabled: !!id,
  });
}

export function useAdminReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      apiClient.post<SupportTicket>(`/support/admin/tickets/${id}/reply`, { body }),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ["support", "admin", "detail", v.id] });
      void qc.invalidateQueries({ queryKey: ["support", "admin"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Reply failed."),
  });
}

export function useAdminSetTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TicketStatus }) =>
      apiClient.patch<SupportTicket>(`/support/admin/tickets/${id}/status`, { status }),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ["support", "admin", "detail", v.id] });
      void qc.invalidateQueries({ queryKey: ["support", "admin"] });
      toast.success("Status updated.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Update failed."),
  });
}

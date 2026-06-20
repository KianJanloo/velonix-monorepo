"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";

// ── Stats ──────────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiClient.get<{
      users: { total: number };
      games: { total: number; published: number; pendingReview: number };
      recentUsers: unknown[];
      recentGames: unknown[];
    }>("/admin/stats"),
  });
}

// ── Users ──────────────────────────────────────────────────────────────────

export function useAdminUsers(page = 1, perPage = 20, search?: string) {
  return useQuery({
    queryKey: ["admin", "users", { page, perPage, search }],
    queryFn: () => apiClient.get<{ data: AdminUser[]; total: number; totalPages: number }>(
      "/admin/users", { params: { page, perPage, search } }
    ),
  });
}

export interface AdminUser {
  id: string; username: string; displayName: string; email: string;
  role: string; subscriptionTier: string; isEmailVerified: boolean;
  totalSales: number; lastLoginAt: string | null; createdAt: string;
}

export function useAdminUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("Role updated."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update role."),
  });
}

export function useAdminDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "users"] }); toast.success("User deleted."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete user."),
  });
}

// ── Games ──────────────────────────────────────────────────────────────────

export function useAdminGames(page = 1, perPage = 20, status?: string, search?: string) {
  return useQuery({
    queryKey: ["admin", "games", { page, perPage, status, search }],
    queryFn: () => apiClient.get<{ data: AdminGame[]; total: number; totalPages: number }>(
      "/admin/games", { params: { page, perPage, ...(status ? { status } : {}), ...(search ? { search } : {}) } }
    ),
  });
}

export interface AdminGame {
  id: string; title: string; status: string; categories: string[];
  isFree: boolean; priceUsd: number | null; totalPurchases: number;
  averageRating: number | null; totalRatings: number;
  creator: { id: string; username: string };
  createdAt: string; updatedAt: string;
}

export function useAdminApproveGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/games/${id}/approve`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "games"] }); toast.success("Game approved and published!"); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to approve game."),
  });
}

export function useAdminRejectGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/admin/games/${id}/reject`, { reason }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "games"] }); toast.success("Game rejected."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to reject game."),
  });
}

export function useAdminDeleteGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/games/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "games"] }); toast.success("Game deleted."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete game."),
  });
}

// ── Payments ─────────────────────────────────────────────────────────────────

export interface AdminPaymentStats {
  grossRevenue: number;      // USD cents
  platformRevenue: number;   // USD cents (Velonix's cut)
  creatorEarnings: number;   // USD cents
  transactionCount: number;
  byType: {
    game: { gross: number; fees: number; count: number };
    asset: { gross: number; fees: number; count: number };
  };
}

export function useAdminPaymentStats() {
  return useQuery({
    queryKey: ["admin", "payments", "stats"],
    queryFn: () => apiClient.get<AdminPaymentStats>("/admin/payments/stats"),
  });
}

export interface AdminTransaction {
  id: string;
  type: "game" | "asset";
  buyer: { id: string; username: string } | null;
  item: { id: string; title: string } | null;
  amountPaidUsd: number;
  platformFeeUsd: number;
  creatorEarningsUsd: number;
  stripePaymentIntentId: string | null;
  createdAt: string;
}

export function useAdminTransactions(page = 1, perPage = 20, type?: "game" | "asset") {
  return useQuery({
    queryKey: ["admin", "payments", "transactions", { page, perPage, type }],
    queryFn: () => apiClient.get<{ data: AdminTransaction[]; total: number; totalPages: number }>(
      "/admin/payments/transactions",
      { params: { page, perPage, ...(type ? { type } : {}) } }
    ),
  });
}

// ── Subscriptions ────────────────────────────────────────────────────────────

export interface AdminSubscriptionStats {
  byTier: { free: number; creator: number; pro: number; studio: number };
  paidSubscribers: number;
  totalUsers: number;
}

export function useAdminSubscriptionStats() {
  return useQuery({
    queryKey: ["admin", "subscriptions", "stats"],
    queryFn: () => apiClient.get<AdminSubscriptionStats>("/admin/subscriptions/stats"),
  });
}

export interface AdminSubscriber {
  id: string; username: string; displayName: string; email: string;
  subscriptionTier: string; subscriptionExpiresAt: string | null;
  hasBilling: boolean; createdAt: string;
}

export function useAdminSubscribers(page = 1, perPage = 20, tier?: string) {
  return useQuery({
    queryKey: ["admin", "subscriptions", { page, perPage, tier }],
    queryFn: () => apiClient.get<{ data: AdminSubscriber[]; total: number; totalPages: number }>(
      "/admin/subscriptions",
      { params: { page, perPage, ...(tier ? { tier } : {}) } }
    ),
  });
}

// ── Marketplace assets ───────────────────────────────────────────────────────

export interface AdminAsset {
  id: string; title: string; kind: string;
  isFree: boolean; priceUsd: number | null; isPublished: boolean;
  componentCount: number; totalPurchases: number; averageRating: number | null;
  author: { id: string; username?: string };
  createdAt: string;
}

export function useAdminAssets(page = 1, perPage = 20, search?: string) {
  return useQuery({
    queryKey: ["admin", "assets", { page, perPage, search }],
    queryFn: () => apiClient.get<{ data: AdminAsset[]; total: number; totalPages: number }>(
      "/admin/assets",
      { params: { page, perPage, ...(search ? { search } : {}) } }
    ),
  });
}

export function useAdminSetAssetPublished() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      apiClient.patch(`/admin/assets/${id}/publish`, { isPublished }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "assets"] }); toast.success("Asset updated."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to update asset."),
  });
}

export function useAdminDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/assets/${id}`),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin", "assets"] }); toast.success("Asset deleted."); },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to delete asset."),
  });
}

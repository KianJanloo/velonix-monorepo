"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";

export interface Category {
  id: string;
  slug: string;
  label: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  gameCount: number;
  createdAt: string;
  updatedAt: string;
}

// ── Public ────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<Category[]>("/categories"),
  });
}

// ── Admin ────────────────────────────────────────────────────────────────────

export function useAdminCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => apiClient.get<Category[]>("/categories/admin/all"),
  });
}

export interface CreateCategoryPayload {
  slug: string;
  label: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function useAdminCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCategoryPayload) =>
      apiClient.post<Category>("/categories/admin", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      void qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to create category."),
  });
}

export interface UpdateCategoryPayload {
  id: string;
  label?: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function useAdminUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateCategoryPayload) =>
      apiClient.patch<Category>(`/categories/admin/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      void qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to update category."),
  });
}

export function useAdminDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/categories/admin/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      void qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted.");
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to delete category."),
  });
}

export function useAdminRefreshCategoryCounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/categories/admin/refresh-counts"),
    onSuccess: (res: unknown) => {
      void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      const r = res as { refreshed?: number };
      toast.success(`Refreshed ${r?.refreshed ?? "all"} category counts.`);
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to refresh counts."),
  });
}

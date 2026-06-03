import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";
import type { ComponentAsset, ComponentAssetSummary, AssetKind, PaginatedResponse } from "@velonix/types";

export interface AssetFilters {
  kind?: AssetKind;
  search?: string;
  isFree?: boolean;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
  page?: number;
  perPage?: number;
}

export interface CreateAssetInput {
  title: string;
  description?: string;
  kind?: AssetKind;
  thumbnailUrl?: string | null;
  payload: unknown[];
  isFree?: boolean;
  priceUsd?: number | null;
}

export const assetKeys = {
  all: ["assets"] as const,
  browse: (f: AssetFilters) => [...assetKeys.all, "browse", f] as const,
  mine: () => [...assetKeys.all, "mine"] as const,
  library: () => [...assetKeys.all, "library"] as const,
  detail: (id: string) => [...assetKeys.all, "detail", id] as const,
};

/** Browse the component marketplace. */
export function useAssetMarketplace(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: assetKeys.browse(filters),
    queryFn: () => apiClient.get<PaginatedResponse<ComponentAssetSummary>>("/assets", {
      params: filters as Record<string, string | number | boolean | undefined>,
    }),
    staleTime: 60 * 1000,
  });
}

/** A single asset (payload included only if free/owned/author). */
export function useAsset(assetId: string, enabled = true) {
  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: () => apiClient.get<ComponentAsset | ComponentAssetSummary>(`/assets/${assetId}`),
    enabled: !!assetId && enabled,
  });
}

/** Assets the current user authored. */
export function useMyAssets(enabled = true) {
  return useQuery({
    queryKey: assetKeys.mine(),
    queryFn: () => apiClient.get<ComponentAsset[]>("/assets/mine"),
    enabled,
  });
}

/** Assets the current user owns/acquired (with payload — used to insert into the studio). */
export function useAssetLibrary(enabled = true) {
  return useQuery({
    queryKey: assetKeys.library(),
    queryFn: () => apiClient.get<ComponentAsset[]>("/assets/library"),
    enabled,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssetInput) => apiClient.post<ComponentAsset>("/assets", input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: assetKeys.mine() });
      void qc.invalidateQueries({ queryKey: assetKeys.all });
      toast.success("Published to the component marketplace!");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not publish asset."),
  });
}

export function useAcquireAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => apiClient.post<ComponentAsset>(`/assets/${assetId}/acquire`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: assetKeys.library() });
      void qc.invalidateQueries({ queryKey: assetKeys.all });
      toast.success("Added to your library!");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not acquire asset."),
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) => apiClient.delete(`/assets/${assetId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: assetKeys.mine() });
      void qc.invalidateQueries({ queryKey: assetKeys.all });
      toast.success("Asset deleted.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not delete asset."),
  });
}

export interface AssetPurchaseIntent {
  clientSecret: string | null;
  amount: number;
  platformFee: number;
  creatorEarnings: number;
}

/** Create a Stripe PaymentIntent to buy a paid asset (drives the asset checkout page). */
export function usePurchaseAssetIntent() {
  return useMutation({
    mutationFn: (assetId: string) => apiClient.post<AssetPurchaseIntent>(`/payments/asset/${assetId}/intent`),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not start checkout."),
  });
}

export interface BundleIntent {
  clientSecret: string | null;
  bundleId: string;
  subtotal: number;
  discount: number;
  total: number;
  items: { assetId: string; allocatedUsd: number }[];
}

/** Create a Stripe PaymentIntent for a custom bundle of paid assets. */
export function useBundleIntent() {
  return useMutation({
    mutationFn: (assetIds: string[]) => apiClient.post<BundleIntent>("/payments/bundle/intent", { assetIds }),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not start bundle checkout."),
  });
}

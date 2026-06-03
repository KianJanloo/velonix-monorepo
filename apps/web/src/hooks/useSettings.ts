"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient, ApiError } from "@/lib/apiClient";

export interface SiteSettings {
  id: number;
  signupsEnabled: boolean;
  marketplaceEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  announcement: string;
  supportEmail: string;
  discordUrl: string;
  twitterUrl: string;
}

/** Public — site-wide settings (banner, social links, flags). */
export function usePublicSettings() {
  return useQuery<Omit<SiteSettings, "id">>({
    queryKey: ["settings", "public"],
    queryFn: () => apiClient.get<Omit<SiteSettings, "id">>("/settings"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Admin — full settings row. */
export function useAdminSettings() {
  return useQuery<SiteSettings>({
    queryKey: ["settings", "admin"],
    queryFn: () => apiClient.get<SiteSettings>("/settings/admin"),
  });
}

/** Admin — update site settings. */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id: _id, updatedAt: _u, ...patch }: Partial<SiteSettings> & { updatedAt?: string }) =>
      apiClient.patch<SiteSettings>("/settings", patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved.");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Failed to save settings."),
  });
}

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
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  contactEmail: string;
  phone: string;
  address: string;
  discordUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  metaDescription: string;
  metaKeywords: string;
  primaryColor: string;
  accentColor: string;
  footerText: string;
  aboutContent: string;
}

export type PublicSiteSettings = Omit<SiteSettings, "id">;

export function usePublicSettings() {
  return useQuery<PublicSiteSettings>({
    queryKey: ["settings", "public"],
    queryFn: () => apiClient.get<PublicSiteSettings>("/settings"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminSettings() {
  return useQuery<SiteSettings>({
    queryKey: ["settings", "admin"],
    queryFn: () => apiClient.get<SiteSettings>("/settings/admin"),
  });
}

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

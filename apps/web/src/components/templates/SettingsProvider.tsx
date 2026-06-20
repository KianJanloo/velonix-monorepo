"use client";

import { createContext, useContext, useEffect } from "react";
import { usePublicSettings, type PublicSiteSettings } from "@/hooks/useSettings";

interface SettingsContextValue {
  settings: PublicSiteSettings | undefined;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: undefined,
  isLoading: true,
});

export function useSiteSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: settings, isLoading } = usePublicSettings();

  useEffect(() => {
    if (!settings) return;
    document.title = settings.siteName
      ? `${settings.siteName} — ${settings.siteDescription || settings.siteName}`
      : "Velonix";
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

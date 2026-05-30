"use client";

/**
 * Velonix App Providers
 *
 * Wraps the entire application with all required context providers:
 * - TanStack Query (data fetching + caching)
 * - Next Themes (always dark — gaming aesthetic)
 * - Sonner toast notifications
 * - Custom Velonix auth session context
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Instantiate QueryClient inside the component to avoid sharing between
  // server requests while keeping React rendering boundaries correct.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5 minutes stale time for most game/marketplace data
            staleTime: 5 * 60 * 1000,
            // Keep cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests twice
            retry: 2,
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30_000),
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Don't refetch on window focus for stable data
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"     // Velonix is always dark — the table is always set
        disableTransitionOnChange
      >
        {children}

        {/* Toast notifications — styled to match Velonix dark theme */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1c140f",
              border: "1px solid #3a2a1f",
              color: "#e8d5b8",
              fontFamily: "var(--font-ui)",
              fontSize: "0.875rem",
            },
            classNames: {
              success: "!border-[rgba(0,212,165,0.4)] !shadow-emerald",
              error:   "!border-[rgba(255,59,92,0.4)] !shadow-crimson",
              warning: "!border-[rgba(245,196,81,0.4)] !shadow-gold",
              info:    "!border-[rgba(0,229,255,0.3)] !shadow-cyan",
            },
          }}
          richColors
        />

        {/* TanStack Query DevTools — development only */}
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-left"
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

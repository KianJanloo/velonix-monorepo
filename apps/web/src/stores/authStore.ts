import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  subscriptionTier: string;
  totalSales: number;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  resetEmail: string | null;
  registerEmail: string | null;
  token: string | null;
  /** True once the persisted store has rehydrated from localStorage (client only). */
  hasHydrated: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken?: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setResetEmail: (resetEmail: string | null) => void;
  setRegisterEmail: (registerEmail: string | null) => void;
  setToken: (token: string | null) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  clearAuth: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      resetEmail: null,
      registerEmail: null,
      token: null,
      hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) =>
        set((s) => ({
          user,
          accessToken,
          refreshToken: refreshToken ?? s.refreshToken,
        })),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      setResetEmail: (resetEmail) => set({ resetEmail }),
      setRegisterEmail: (registerEmail) => set({ registerEmail }),
      setToken: (token) => set({ token }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          resetEmail: null,
          registerEmail: null,
          token: null,
        }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "velonix-auth",
      // Don't persist the transient hydration flag.
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        resetEmail: s.resetEmail,
        registerEmail: s.registerEmail,
        token: s.token,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/** Module-level getters used by apiClient to avoid circular imports */
export const getAccessToken = () => useAuthStore.getState().accessToken;
export const getRefreshToken = () => useAuthStore.getState().refreshToken;
export const getResetEmail = () => useAuthStore.getState().resetEmail;
export const getToken = () => useAuthStore.getState().token;
export const getRegisterEmail = () => useAuthStore.getState().registerEmail;

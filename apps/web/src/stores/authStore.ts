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
  setAuth: (user: AuthUser, accessToken: string) => void;
  updateUser: (patch: Partial<AuthUser>) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
      clearAuth: () => set({ user: null, accessToken: null }),
    }),
    { name: "velonix-auth" }
  )
);

/** Module-level getter used by apiClient to avoid circular imports */
export const getAccessToken = () => useAuthStore.getState().accessToken;

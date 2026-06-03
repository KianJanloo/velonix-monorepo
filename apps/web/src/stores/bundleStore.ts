import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_BUNDLE = 20;

interface BundleState {
  /** Asset IDs currently in the buyer's bundle. */
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/** Persisted "bundle cart" of paid component assets the buyer is assembling. */
export const useBundleStore = create<BundleState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle: (id) =>
        set((s) =>
          s.ids.includes(id)
            ? { ids: s.ids.filter((x) => x !== id) }
            : s.ids.length >= MAX_BUNDLE
              ? s
              : { ids: [...s.ids, id] },
        ),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    { name: "velonix-bundle" },
  ),
);

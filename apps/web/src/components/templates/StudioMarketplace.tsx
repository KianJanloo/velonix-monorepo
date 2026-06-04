"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useAssetMarketplace,
  useAssetLibrary,
  useCreateAsset,
  useAcquireAsset,
  useDeleteAsset,
  useMyAssets,
} from "@/hooks/useAssets";
import type { ComponentAsset, AssetKind } from "@velonix/types";
import { ASSET_KINDS } from "@velonix/types";
import { ImageUploadField } from "@/components/molecules/ImageUploadField";
import { useBundleStore } from "@/stores/bundleStore";

const money = (cents: number | null) =>
  cents == null ? "Free" : `$${(cents / 100).toFixed(2)}`;

type Tab = "browse" | "library" | "publish";

interface Props {
  /** Components currently selected on the canvas (candidates to publish). */
  selection: { id: string }[];
  /** Insert an asset's component payload onto the active page. */
  onInsert: (payload: unknown[]) => void;
  /** Read the full component objects to publish from the current selection. */
  getSelectionPayload: () => unknown[];
  onClose: () => void;
}

export function StudioMarketplace({
  selection,
  onInsert,
  getSelectionPayload,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("browse");
  const router = useRouter();

  // Filters
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<AssetKind | "">("");
  const [paid, setPaid] = useState<"" | "free" | "paid">("");
  const [sort, setSort] = useState<
    "newest" | "popular" | "price_asc" | "price_desc"
  >("newest");

  const filters = useMemo(() => {
    const f: {
      search?: string;
      kind?: AssetKind;
      isFree?: boolean;
      sort: typeof sort;
    } = { sort };
    if (search.trim()) f.search = search.trim();
    if (kind) f.kind = kind;
    if (paid) f.isFree = paid === "free";
    return f;
  }, [search, kind, paid, sort]);
  const browse = useAssetMarketplace(filters);
  const library = useAssetLibrary();
  const mine = useMyAssets(tab === "publish");
  const acquire = useAcquireAsset();
  const create = useCreateAsset();
  const del = useDeleteAsset();

  const bundleIds = useBundleStore((s) => s.ids);
  const toggleBundle = useBundleStore((s) => s.toggle);
  const clearBundle = useBundleStore((s) => s.clear);

  const ownedPayload = useMemo(() => {
    const m = new Map<string, unknown[]>();
    library.data?.forEach((a) => m.set(a.id, a.payload));
    return m;
  }, [library.data]);

  function insertOwned(assetId: string) {
    const payload = ownedPayload.get(assetId);
    if (payload) {
      onInsert(payload);
      onClose();
    }
  }

  function getOrInsert(assetId: string, isFree: boolean) {
    if (ownedPayload.has(assetId)) {
      insertOwned(assetId);
      return;
    }
    if (isFree) {
      acquire.mutate(assetId, {
        onSuccess: (a) => {
          onInsert(a.payload);
          onClose();
        },
      });
    } else {
      router.push(`/checkout/asset/${assetId}`);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="v-card w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + tabs */}
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-display text-lg font-bold text-parchment-light">
            Component Marketplace
          </h2>
          <button
            onClick={onClose}
            className="text-soft-gray hover:text-parchment-light p-1 -mr-1"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <div className="flex gap-1 px-5 mt-3 border-b border-warm-wood">
          {(
            [
              ["browse", "Browse"],
              ["library", "My library"],
              ["publish", "Sell a component"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-2xs font-ui font-bold uppercase tracking-wider border-b-2 -mb-px ${tab === t ? "text-emerald-glow border-emerald-glow" : "text-soft-gray border-transparent hover:text-parchment-light"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Browse ── */}
          {tab === "browse" && (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search components…"
                  className="v-input text-sm flex-1 min-w-[140px]"
                />
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as AssetKind | "")}
                  className="v-input text-sm w-auto capitalize"
                >
                  <option value="">All kinds</option>
                  {ASSET_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <select
                  value={paid}
                  onChange={(e) =>
                    setPaid(e.target.value as "" | "free" | "paid")
                  }
                  className="v-input text-sm w-auto"
                >
                  <option value="">All</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="v-input text-sm w-auto"
                >
                  <option value="newest">Newest</option>
                  <option value="popular">Popular</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                </select>
              </div>

              {browse.isLoading ? (
                <Loading />
              ) : !browse.data || browse.data.data.length === 0 ? (
                <Empty text="No components match your filters yet." />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {browse.data.data.map((a) => {
                    const owned = ownedPayload.has(a.id) || a.owned;
                    return (
                      <AssetCard
                        key={a.id}
                        title={a.title}
                        kind={a.kind}
                        author={a.authorUsername}
                        thumbnailUrl={a.thumbnailUrl}
                        count={a.componentCount}
                        price={money(a.priceUsd)}
                        owned={!!owned}
                        actionLabel={
                          owned
                            ? "Insert"
                            : a.isFree
                              ? "Get"
                              : `Buy ${money(a.priceUsd)}`
                        }
                        busy={acquire.isPending}
                        onAction={() =>
                          owned
                            ? insertOwned(a.id)
                            : getOrInsert(a.id, a.isFree)
                        }
                        bundlable={!owned && !a.isFree}
                        inBundle={bundleIds.includes(a.id)}
                        onToggleBundle={() => toggleBundle(a.id)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── Library ── */}
          {tab === "library" &&
            (library.isLoading ? (
              <Loading />
            ) : !library.data || library.data.length === 0 ? (
              <Empty text="You haven't acquired any components yet. Browse the marketplace to get some." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {library.data.map((a) => (
                  <AssetCard
                    key={a.id}
                    title={a.title}
                    kind={a.kind}
                    author={a.authorUsername}
                    thumbnailUrl={a.thumbnailUrl}
                    count={a.componentCount}
                    price={money(a.priceUsd)}
                    owned
                    actionLabel="Insert"
                    onAction={() => insertOwned(a.id)}
                  />
                ))}
              </div>
            ))}

          {/* ── Publish ── */}
          {tab === "publish" && (
            <PublishTab
              selectionCount={selection.length}
              creating={create.isPending}
              onPublish={(form) =>
                create.mutate(
                  { ...form, payload: getSelectionPayload() },
                  { onSuccess: () => setTab("library") },
                )
              }
              myAssets={mine.data ?? []}
              onDelete={(id) => del.mutate(id)}
            />
          )}
        </div>

        {bundleIds.length > 0 && (
          <div className="border-t border-warm-wood px-5 py-3 flex items-center gap-3 shrink-0">
            <span className="text-2xs font-ui text-parchment-mid">
              <span className="font-bold text-emerald-glow">{bundleIds.length}</span> in bundle
              {bundleIds.length < 2 && (
                <span className="text-soft-gray-dark"> · add {2 - bundleIds.length} more to unlock a discount</span>
              )}
            </span>
            <button
              onClick={clearBundle}
              className="text-2xs font-ui text-soft-gray-dark hover:text-crimson-flame ml-auto"
            >
              Clear
            </button>
            <button
              disabled={bundleIds.length < 2}
              onClick={() => {
                router.push("/checkout/bundle");
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-royal-gold text-deep-void text-2xs font-ui font-bold hover:brightness-110 disabled:opacity-40"
            >
              Checkout bundle →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-7 h-7 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <p className="text-2xs text-soft-gray-dark font-ui text-center py-12 leading-relaxed max-w-xs mx-auto">
      {text}
    </p>
  );
}

const KIND_GLYPH: Record<string, string> = {
  token: "⬤",
  board: "▦",
  card: "▭",
  tile: "◧",
  piece: "♟",
  pack: "📦",
  other: "◆",
};

function AssetCard({
  title,
  kind,
  author,
  thumbnailUrl,
  count,
  price,
  owned,
  actionLabel,
  busy,
  onAction,
  bundlable,
  inBundle,
  onToggleBundle,
}: {
  title: string;
  kind: string;
  author: string;
  thumbnailUrl: string | null;
  count: number;
  price: string;
  owned: boolean;
  actionLabel: string;
  busy?: boolean;
  onAction: () => void;
  bundlable?: boolean;
  inBundle?: boolean;
  onToggleBundle?: () => void;
}) {
  return (
    <div className="v-card p-2.5 flex flex-col gap-2">
      <div className="relative aspect-[4/3] rounded-lg bg-felt-dark border border-warm-wood overflow-hidden flex items-center justify-center">
        {thumbnailUrl ? (
          <Image src={thumbnailUrl} alt={title} fill className="object-cover" />
        ) : (
          <span className="text-3xl text-soft-gray-dark">
            {KIND_GLYPH[kind] ?? "◆"}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-2xs font-ui font-semibold text-parchment-light truncate">
          {title}
        </p>
        <p className="text-[10px] text-soft-gray-dark font-ui truncate">
          {author ? `by ${author} · ` : ""}
          {count} part{count === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto">
        <span
          className={`text-2xs font-ui font-bold ${price === "Free" ? "text-emerald-glow" : "text-royal-gold"}`}
        >
          {owned ? "Owned" : price}
        </span>
        <button
          onClick={onAction}
          disabled={busy}
          className="px-2.5 py-1 rounded-md bg-emerald-glow text-deep-void text-[10px] font-ui font-bold hover:bg-emerald-bright transition-all disabled:opacity-50"
        >
          {actionLabel}
        </button>
      </div>
      {bundlable && (
        <button
          onClick={onToggleBundle}
          className={`w-full py-1 rounded-md text-[10px] font-ui font-semibold transition-colors ${
            inBundle
              ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/40"
              : "bg-warm-wood/40 text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
          }`}
        >
          {inBundle ? "✓ In bundle" : "+ Add to bundle"}
        </button>
      )}
    </div>
  );
}

function PublishTab({
  selectionCount,
  creating,
  onPublish,
  myAssets,
  onDelete,
}: {
  selectionCount: number;
  creating: boolean;
  onPublish: (form: {
    title: string;
    description: string;
    kind: AssetKind;
    isFree: boolean;
    priceUsd: number | null;
    thumbnailUrl: string | null;
  }) => void;
  myAssets: ComponentAsset[];
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<AssetKind>("token");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState(199);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const canPublish = selectionCount > 0 && title.trim().length > 0;

  return (
    <div className="space-y-5">
      <div
        className={`rounded-lg border p-3 text-2xs font-ui ${selectionCount > 0 ? "border-emerald-glow/30 bg-emerald-ghost text-emerald-glow" : "border-warm-wood text-soft-gray"}`}
      >
        {selectionCount > 0 ? (
          <>
            Publishing <span className="font-bold">{selectionCount}</span>{" "}
            selected component{selectionCount === 1 ? "" : "s"}. Buyers can drop
            them straight into their game.
          </>
        ) : (
          <>
            Select one or more components on the canvas first (shift-click to
            pick several), then come back here to sell them.
          </>
        )}
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Asset title (e.g. Fantasy meeple set)"
        className="v-input text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what's included…"
        className="v-input text-sm resize-none h-16"
      />
      <ImageUploadField
        label="Thumbnail (optional)"
        shape="cover"
        value={thumbnailUrl}
        onChange={setThumbnailUrl}
        hint="Shown on the marketplace card. Max 5MB."
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1">
            Kind
          </span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AssetKind)}
            className="v-input text-sm capitalize"
          >
            {ASSET_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1">
            Pricing
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setIsFree(true)}
              className={`flex-1 py-2 rounded-lg border text-2xs font-ui font-semibold ${isFree ? "border-emerald-glow bg-emerald-ghost text-emerald-glow" : "border-warm-wood text-soft-gray"}`}
            >
              Free
            </button>
            <button
              onClick={() => setIsFree(false)}
              className={`flex-1 py-2 rounded-lg border text-2xs font-ui font-semibold ${!isFree ? "border-emerald-glow bg-emerald-ghost text-emerald-glow" : "border-warm-wood text-soft-gray"}`}
            >
              Paid
            </button>
          </div>
        </div>
      </div>
      {!isFree && (
        <label className="block">
          <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider block mb-1">
            Price (USD)
          </span>
          <div className="flex items-center gap-2">
            <span className="text-parchment-mid font-ui">$</span>
            <input
              type="number"
              step="0.01"
              min="0.99"
              className="v-input text-sm font-mono"
              value={(price / 100).toFixed(2)}
              onChange={(e) =>
                setPrice(Math.round(Number(e.target.value) * 100) || 0)
              }
            />
          </div>
          <p className="text-[10px] text-soft-gray-dark font-ui mt-1">
            You earn a revenue share on every sale (platform fee depends on your
            plan).
          </p>
        </label>
      )}
      <button
        onClick={() =>
          onPublish({
            title: title.trim(),
            description: description.trim(),
            kind,
            isFree,
            priceUsd: isFree ? null : price,
            thumbnailUrl,
          })
        }
        disabled={!canPublish || creating}
        className="w-full py-2.5 rounded-lg bg-emerald-glow text-deep-void text-sm font-ui font-bold hover:bg-emerald-bright transition-all disabled:opacity-40"
      >
        {creating ? "Publishing…" : "Publish to marketplace"}
      </button>

      {myAssets.length > 0 && (
        <div className="border-t border-warm-wood pt-4">
          <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
            Your published components
          </p>
          <div className="space-y-1.5">
            {myAssets.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 text-2xs font-ui"
              >
                <span className="text-parchment-light font-semibold truncate flex-1">
                  {a.title}
                </span>
                <span className="text-soft-gray-dark">{money(a.priceUsd)}</span>
                <span className="text-soft-gray-dark">
                  · {a.totalPurchases} sold
                </span>
                <button
                  onClick={() => onDelete(a.id)}
                  className="text-soft-gray-dark hover:text-crimson-flame p-0.5"
                  title="Delete"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 3.5h7M5 3.5V2.5h2v1M3.5 3.5l.4 6h4.2l.4-6"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

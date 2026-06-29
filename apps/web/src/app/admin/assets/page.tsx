"use client";

import { useState } from "react";
import { useAdminAssets, useAdminSetAssetPublished, useAdminDeleteAsset } from "@/hooks/useAdmin";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/atoms/Pagination";

function usd(cents: number | null): string {
  if (cents === null) return "—";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function AdminAssetsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useAdminAssets(page, 20, search || undefined);
  const setPublished = useAdminSetAssetPublished();
  const deleteAsset = useAdminDeleteAsset();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Marketplace Assets</h1>
        <span className="text-soft-gray text-sm font-ui">{data?.total ?? 0} total</span>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          className="v-input flex-1 max-w-sm"
          placeholder="Search by title…"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }}
        />
        <button onClick={() => { setSearch(searchInput); setPage(1); }}
          className="px-4 py-2 rounded-lg bg-emerald-glow text-deep-void text-sm font-ui font-bold hover:bg-emerald-bright transition-colors">
          Search
        </button>
        {search && (
          <button onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-warm-wood text-soft-gray text-sm font-ui hover:text-parchment-light transition-colors">
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="v-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-warm-wood">
              <tr>
                {["Asset", "Author", "Kind", "Price", "Sales", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-2xs font-ui font-bold text-soft-gray uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-warm-wood/30">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-warm-wood/30 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length ? data.data.map(asset => (
                <tr key={asset.id} className="border-b border-warm-wood/20 hover:bg-warm-wood/10 transition-colors">
                  <td className="px-4 py-3 max-w-[260px]">
                    <p className="text-sm font-ui text-parchment-light truncate">{asset.title}</p>
                    <p className="text-2xs text-soft-gray-dark">{asset.componentCount} component{asset.componentCount === 1 ? "" : "s"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-soft-gray font-ui">{asset.author.username ? `@${asset.author.username}` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-2xs bg-warm-wood text-soft-gray px-2 py-0.5 rounded-full font-ui capitalize">{asset.kind}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-parchment-light">{asset.isFree ? "Free" : usd(asset.priceUsd)}</td>
                  <td className="px-4 py-3 text-sm font-mono text-soft-gray">{asset.totalPurchases}</td>
                  <td className="px-4 py-3">
                    <span className={`text-2xs px-2 py-0.5 rounded-full font-ui ${asset.isPublished ? "bg-emerald-ghost text-emerald-glow" : "bg-warm-wood text-soft-gray"}`}>
                      {asset.isPublished ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => setPublished.mutate({ id: asset.id, isPublished: !asset.isPublished })}
                        className="text-emerald-glow text-xs font-ui hover:text-emerald-glow/80 transition-colors">
                        {asset.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <ConfirmDialog
                        title="Delete asset?"
                        description={`"${asset.title}" will be permanently deleted. This cannot be undone.`}
                        confirmLabel="Delete"
                        variant="danger"
                        onConfirm={() => deleteAsset.mutateAsync(asset.id)}
                      >
                        {(open) => <button onClick={open} className="text-crimson-flame text-xs font-ui hover:text-crimson-bright transition-colors">Delete</button>}
                      </ConfirmDialog>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-soft-gray text-sm font-ui">No assets found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

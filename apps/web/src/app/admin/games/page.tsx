"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminGames, useAdminApproveGame, useAdminRejectGame, useAdminDeleteGame } from "@/hooks/useAdmin";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/atoms/Pagination";

const STATUS_OPTIONS = ["", "draft", "reviewing", "published", "rejected"];

export default function AdminGamesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useAdminGames(page, 20, status || undefined, search || undefined);
  const approve = useAdminApproveGame();
  const reject = useAdminRejectGame();
  const deleteGame = useAdminDeleteGame();

  const statusColor: Record<string, string> = {
    published: "bg-emerald-ghost text-emerald-glow",
    reviewing: "bg-[rgba(0,214,143,0.1)] text-emerald-glow",
    draft: "bg-warm-wood text-soft-gray",
    rejected: "bg-crimson-ghost text-crimson-flame",
    unpublished: "bg-warm-wood text-soft-gray",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Games</h1>
        <span className="text-soft-gray text-sm font-ui">{data?.total ?? 0} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-ui capitalize transition-colors ${status === s ? "bg-emerald-glow text-deep-void font-bold" : "border border-warm-wood text-soft-gray hover:text-parchment-light"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          <input className="v-input w-48 text-sm" placeholder="Search games…"
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { setSearch(searchInput); setPage(1); } }} />
          <button onClick={() => { setSearch(searchInput); setPage(1); }}
            className="px-3 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-sm font-ui font-bold hover:bg-emerald-bright transition-colors">Go</button>
        </div>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setRejectTarget(null)} />
          <div className="relative v-card p-6 max-w-md w-full">
            <h2 className="font-display text-lg font-bold text-parchment-light mb-3">Reject Game</h2>
            <textarea className="v-input w-full h-24 resize-none mb-4" placeholder="Reason for rejection (shown to creator)…"
              value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setRejectTarget(null)} className="flex-1 py-2 rounded-lg border border-warm-wood text-soft-gray font-ui hover:text-parchment-light">Cancel</button>
              <button onClick={async () => {
                if (!rejectReason.trim()) return;
                await reject.mutateAsync({ id: rejectTarget, reason: rejectReason });
                setRejectTarget(null); setRejectReason("");
              }} className="flex-1 py-2 rounded-lg bg-crimson-flame text-white font-ui font-bold hover:opacity-90 transition-opacity">
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="v-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="border-b border-warm-wood">
            <tr>
              {["Title", "Creator", "Status", "Category", "Sales", "Rating", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-2xs font-ui font-bold text-soft-gray uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-warm-wood/30">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-warm-wood/30 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : (data?.data ?? []).map(game => (
              <tr key={game.id} className="border-b border-warm-wood/20 hover:bg-warm-wood/10 transition-colors">
                <td className="px-4 py-3 max-w-[180px]">
                  <p className="text-sm font-ui text-parchment-light truncate">{game.title}</p>
                </td>
                <td className="px-4 py-3 text-sm text-soft-gray font-ui">@{game.creator?.username ?? "unknown"}</td>
                <td className="px-4 py-3">
                  <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize ${statusColor[game.status] ?? "bg-warm-wood text-soft-gray"}`}>
                    {game.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-soft-gray font-ui">
                  {(game.categories ?? []).map((c: string) => <span key={c} className="mr-1 last:mr-0 capitalize">{c.replace("_", " ")}</span>).reduce((acc: any, span: any, i: number) => i === 0 ? [span] : [...acc, <span key={`sep-${i}`} className="text-soft-gray-dark mx-0.5">,</span>, span], null)}</td>
                <td className="px-4 py-3 text-sm font-mono text-soft-gray">{game.totalPurchases}</td>
                <td className="px-4 py-3 text-sm font-mono text-soft-gray">
                  {game.averageRating ? game.averageRating : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    <Link href={`/admin/games/${game.id}`} className="text-emerald-glow text-xs font-ui hover:opacity-80 transition-opacity">
                      Review
                    </Link>
                    {game.status === "reviewing" && (
                      <>
                        <button onClick={() => approve.mutate(game.id)}
                          className="text-emerald-glow text-xs font-ui hover:text-emerald-bright transition-colors">
                          Approve
                        </button>
                        <button onClick={() => setRejectTarget(game.id)}
                          className="text-crimson-flame text-xs font-ui hover:text-crimson-bright transition-colors">
                          Reject
                        </button>
                      </>
                    )}
                    <ConfirmDialog
                      title="Delete game?"
                      description={`Permanently delete "${game.title}" from the platform.`}
                      confirmLabel="Delete"
                      variant="danger"
                      onConfirm={() => deleteGame.mutateAsync(game.id)}
                    >
                      {(open) => (
                        <button onClick={open} className="text-soft-gray-dark text-xs font-ui hover:text-crimson-flame transition-colors">
                          Del
                        </button>
                      )}
                    </ConfirmDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

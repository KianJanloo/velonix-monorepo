"use client";

import { useState } from "react";
import { useAdminUsers, useAdminUpdateRole, useAdminDeleteUser } from "@/hooks/useAdmin";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const ROLES = ["user", "creator", "admin"];

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useAdminUsers(page, 20, search || undefined);
  const updateRole = useAdminUpdateRole();
  const deleteUser = useAdminDeleteUser();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Users</h1>
        <span className="text-soft-gray text-sm font-ui">{data?.total ?? 0} total</span>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          className="v-input flex-1 max-w-sm"
          placeholder="Search by username, email, name…"
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
        <table className="w-full">
          <thead className="border-b border-warm-wood">
            <tr>
              {["User", "Email", "Role", "Plan", "Sales", "Joined", "Actions"].map(h => (
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
            ) : data?.data.map(user => (
              <tr key={user.id} className="border-b border-warm-wood/20 hover:bg-warm-wood/10 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm font-ui text-parchment-light">{user.displayName}</p>
                  <p className="text-2xs text-soft-gray">@{user.username}</p>
                </td>
                <td className="px-4 py-3 text-sm text-soft-gray font-ui">{user.email}</td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={e => updateRole.mutate({ id: user.id, role: e.target.value })}
                    className="bg-warm-wood border border-warm-wood-light text-parchment-light text-xs font-ui rounded-lg px-2 py-1"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="text-2xs bg-warm-wood text-soft-gray px-2 py-0.5 rounded-full font-ui capitalize">{user.subscriptionTier}</span>
                </td>
                <td className="px-4 py-3 text-sm text-soft-gray font-mono">{user.totalSales}</td>
                <td className="px-4 py-3 text-2xs text-soft-gray-dark font-mono">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <ConfirmDialog
                    title="Delete user?"
                    description={`This will permanently delete @${user.username} and all their data. This cannot be undone.`}
                    confirmLabel="Delete user"
                    variant="danger"
                    onConfirm={() => deleteUser.mutateAsync(user.id)}
                  >
                    {(open) => (
                      <button onClick={open} className="text-crimson-flame text-xs font-ui hover:text-crimson-bright transition-colors">
                        Delete
                      </button>
                    )}
                  </ConfirmDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-warm-wood text-sm font-ui text-soft-gray disabled:opacity-40 hover:border-warm-wood-light hover:text-parchment-light transition-colors">
            ← Prev
          </button>
          <span className="text-xs text-soft-gray font-ui">Page {page} of {data.totalPages}</span>
          <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-warm-wood text-sm font-ui text-soft-gray disabled:opacity-40 hover:border-warm-wood-light hover:text-parchment-light transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

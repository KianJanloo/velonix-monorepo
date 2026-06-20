"use client";

import { useState } from "react";
import { useAdminPaymentStats, useAdminTransactions } from "@/hooks/useAdmin";
import { Pagination } from "@/components/atoms/Pagination";

/** USD cents → "$12.34" */
function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const TYPE_FILTERS: { label: string; value: "all" | "game" | "asset" }[] = [
  { label: "All", value: "all" },
  { label: "Games", value: "game" },
  { label: "Assets", value: "asset" },
];

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"all" | "game" | "asset">("all");

  const { data: stats, isLoading: statsLoading } = useAdminPaymentStats();
  const { data, isLoading } = useAdminTransactions(page, 20, type === "all" ? undefined : type);

  const statCards = [
    { label: "Gross Revenue", value: stats ? usd(stats.grossRevenue) : "—", color: "text-royal-gold" },
    { label: "Platform Revenue", value: stats ? usd(stats.platformRevenue) : "—", color: "text-emerald-glow" },
    { label: "Creator Payouts", value: stats ? usd(stats.creatorEarnings) : "—", color: "text-cyan-spark" },
    { label: "Transactions", value: stats ? stats.transactionCount.toLocaleString() : "—", color: "text-parchment-light" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Payments</h1>
        <span className="text-soft-gray text-sm font-ui">{data?.total ?? 0} transactions</span>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="v-card h-24 animate-pulse" />)
        ) : (
          statCards.map(({ label, value, color }) => (
            <div key={label} className="v-card p-5">
              <p className={`font-display text-2xl font-bold ${color} mb-1`}>{value}</p>
              <p className="text-soft-gray text-sm font-ui">{label}</p>
            </div>
          ))
        )}
      </div>

      {/* Type filter */}
      <div className="flex gap-2 mb-6">
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => { setType(value); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-ui transition-colors ${
              type === value
                ? "bg-emerald-ghost text-emerald-glow border border-emerald-glow/30"
                : "border border-warm-wood text-soft-gray hover:text-parchment-light"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      <div className="v-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="border-b border-warm-wood">
              <tr>
                {["Type", "Item", "Buyer", "Amount", "Platform Fee", "Creator Net", "Date"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-2xs font-ui font-bold text-soft-gray uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-warm-wood/30">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-warm-wood/30 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length ? data.data.map(tx => (
                <tr key={`${tx.type}-${tx.id}`} className="border-b border-warm-wood/20 hover:bg-warm-wood/10 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize ${
                      tx.type === "game" ? "bg-royal-gold/10 text-royal-gold" : "bg-cyan-spark/10 text-cyan-spark"
                    }`}>{tx.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-parchment-light font-ui">{tx.item?.title ?? <span className="text-soft-gray-dark italic">deleted</span>}</td>
                  <td className="px-4 py-3 text-sm text-soft-gray font-ui">{tx.buyer ? `@${tx.buyer.username}` : <span className="text-soft-gray-dark italic">deleted</span>}</td>
                  <td className="px-4 py-3 text-sm text-parchment-light font-mono">{usd(tx.amountPaidUsd)}</td>
                  <td className="px-4 py-3 text-sm text-emerald-glow font-mono">{usd(tx.platformFeeUsd)}</td>
                  <td className="px-4 py-3 text-sm text-soft-gray font-mono">{usd(tx.creatorEarningsUsd)}</td>
                  <td className="px-4 py-3 text-2xs text-soft-gray-dark font-mono">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-soft-gray text-sm font-ui">No transactions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
    </div>
  );
}

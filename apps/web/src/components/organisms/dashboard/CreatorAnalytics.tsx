"use client";

import Link from "next/link";
import { useCreatorAnalytics } from "@/hooks/useAnalytics";
import { usePlan } from "@/hooks/usePlan";

const money = (cents: number) => `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** ISO alpha-2 → flag emoji (regional indicator pair). "??" = unknown. */
function flag(code: string): string {
  if (code === "??" || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}
const countryName = (code: string) => {
  if (code === "??") return "Unknown";
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="v-card p-5">
      <p className={`font-display text-2xl font-bold mb-1 ${accent ?? "text-parchment-light"}`}>{value}</p>
      <p className="text-soft-gray text-sm font-ui">{label}</p>
    </div>
  );
}

function RevenueChart({ series }: { series: { date: string; revenue: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.revenue));
  const W = series.length;
  return (
    <div className="v-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Revenue · last 90 days</h2>
        <span className="text-2xs text-soft-gray font-ui">peak {money(max)}/day</span>
      </div>
      <svg viewBox={`0 0 ${W} 40`} preserveAspectRatio="none" className="w-full h-28">
        {series.map((s, i) => {
          const h = (s.revenue / max) * 38;
          return <rect key={s.date} x={i + 0.15} y={40 - h} width={0.7} height={h} className="fill-emerald-glow" rx={0.2} />;
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-soft-gray-dark font-mono mt-1">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function RankList({
  title,
  rows,
  emptyHref,
  emptyText,
}: {
  title: string;
  rows: { id: string; title: string; sales: number; revenue: number }[];
  emptyHref?: string;
  emptyText: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.revenue));
  return (
    <div className="v-card p-5">
      <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light mb-3">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-2xs text-soft-gray-dark font-ui">
          {emptyText}{" "}
          {emptyHref && <Link href={emptyHref} className="text-emerald-glow hover:text-emerald-bright">Get started →</Link>}
        </p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.id}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-ui text-parchment-light truncate">{r.title}</span>
                <span className="text-2xs font-mono text-soft-gray shrink-0">{money(r.revenue)} · {r.sales} sold</span>
              </div>
              <div className="h-1.5 rounded-full bg-warm-wood/40 overflow-hidden">
                <div className="h-full bg-emerald-glow rounded-full" style={{ width: `${(r.revenue / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CreatorAnalytics() {
  const plan = usePlan();
  const { data, isLoading } = useCreatorAnalytics(plan.hasAnalytics);

  if (!plan.hasAnalytics) {
    return (
      <div className="v-card p-8 text-center max-w-md mx-auto">
        <p className="font-display text-xl font-bold text-parchment-light mb-2">Analytics is a Pro feature</p>
        <p className="text-soft-gray text-sm font-ui mb-5">
          Track revenue, top sellers, and where your buyers are — upgrade to unlock the creator analytics dashboard.
        </p>
        <Link href="/pricing" className="v-btn-primary inline-block">View plans</Link>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="v-card h-24 animate-pulse" />)}
      </div>
    );
  }

  const { totals, series, topGames, topComponents, byCountry } = data;
  const maxCountry = Math.max(1, ...byCountry.map((c) => c.revenue));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total earnings" value={money(totals.totalRevenue)} accent="text-emerald-glow" />
        <Kpi label="Last 30 days" value={money(totals.revenue30d)} accent="text-royal-gold" />
        <Kpi label="Total sales" value={totals.totalSales.toLocaleString()} />
        <Kpi label="Unique buyers" value={totals.uniqueBuyers.toLocaleString()} accent="text-emerald-glow" />
      </div>

      <RevenueChart series={series} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankList title="Top games" rows={topGames} emptyText="No game sales yet." emptyHref="/studio/new" />
        <RankList title="Popular components" rows={topComponents} emptyText="No component sales yet." />
      </div>

      {/* Regional sales */}
      <div className="v-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Regional sales</h2>
          <span className="text-2xs text-soft-gray-dark font-ui">by buyer country</span>
        </div>
        {byCountry.length === 0 ? (
          <p className="text-2xs text-soft-gray-dark font-ui">No sales recorded yet.</p>
        ) : (
          <div className="space-y-2.5">
            {byCountry.map((c) => (
              <div key={c.country} className="flex items-center gap-3">
                <span className="text-base w-6 text-center">{flag(c.country)}</span>
                <span className="text-xs font-ui text-parchment-light w-36 truncate">{countryName(c.country)}</span>
                <div className="flex-1 h-1.5 rounded-full bg-warm-wood/40 overflow-hidden">
                  <div className="h-full bg-royal-gold rounded-full" style={{ width: `${(c.revenue / maxCountry) * 100}%` }} />
                </div>
                <span className="text-2xs font-mono text-soft-gray w-28 text-right">{money(c.revenue)} · {c.sales}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-[10px] text-soft-gray-dark font-ui mt-3">
          Country is captured from the payment method at purchase time, so this reflects sales going forward.
        </p>
      </div>

      {/* Player-journey heatmap — requires telemetry we don't collect yet. */}
      <div className="v-card p-5">
        <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light mb-2">Player journey heatmap</h2>
        <div className="rounded-lg border border-dashed border-warm-wood p-8 text-center">
          <p className="text-soft-gray text-sm font-ui mb-1">Coming soon</p>
          <p className="text-2xs text-soft-gray-dark font-ui max-w-sm mx-auto">
            Heatmaps of where players get stuck need in-game play telemetry, which isn&apos;t collected yet.
            Once playtest sessions emit events, this will surface friction points on your board.
          </p>
        </div>
      </div>
    </div>
  );
}

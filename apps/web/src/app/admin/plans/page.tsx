"use client";

import { useState, useEffect } from "react";
import { usePlans, useUpdatePlan, type PlanConfig } from "@/hooks/usePlans";
import { Button } from "@/components/atoms/Button";

function PlanEditor({ plan }: { plan: PlanConfig }) {
  const update = useUpdatePlan();
  const [form, setForm] = useState(plan);
  useEffect(() => setForm(plan), [plan]);

  const dirty = JSON.stringify(form) !== JSON.stringify(plan);

  function set<K extends keyof PlanConfig>(k: K, v: PlanConfig[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  const toggle = (label: string, key: keyof PlanConfig) => (
    <label className="flex items-center justify-between py-1.5">
      <span className="text-2xs font-ui text-parchment-mid">{label}</span>
      <button type="button" onClick={() => set(key, !form[key] as never)}
        role="switch" aria-checked={!!form[key]}
        className={`relative w-9 h-5 rounded-full transition-colors ${form[key] ? "bg-emerald-glow" : "bg-warm-wood"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-deep-void transition-transform ${form[key] ? "translate-x-4" : ""}`} />
      </button>
    </label>
  );

  return (
    <div className="v-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-base font-bold text-parchment-light capitalize">{plan.tier}</h3>
        <span className="text-2xs text-soft-gray-dark font-mono">{plan.commissionRate}% cut</span>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Display name</span>
          <input className="v-input text-xs" value={form.name} onChange={e => set("name", e.target.value)} />
        </label>
        <label className="block">
          <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Description</span>
          <input className="v-input text-xs" value={form.description} onChange={e => set("description", e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Monthly (cents)</span>
            <input type="number" className="v-input text-xs font-mono" value={form.priceMonthly} onChange={e => set("priceMonthly", Number(e.target.value) || 0)} />
          </label>
          <label className="block">
            <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Yearly (cents)</span>
            <input type="number" className="v-input text-xs font-mono" value={form.priceYearly} onChange={e => set("priceYearly", Number(e.target.value) || 0)} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Commission %</span>
            <input type="number" className="v-input text-xs font-mono" value={form.commissionRate} onChange={e => set("commissionRate", Number(e.target.value) || 0)} />
          </label>
          <label className="block">
            <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Max projects</span>
            <input type="number" className="v-input text-xs font-mono" value={form.maxProjects ?? ""} onChange={e => set("maxProjects", e.target.value === "" ? null : Number(e.target.value))} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <label className="block">
            <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Max Pages</span>
            <input type="number" className="v-input text-xs font-mono" value={form.maxPagesPerProject ?? ""} onChange={e => set("maxPagesPerProject", e.target.value === "" ? null : Number(e.target.value))} />
          </label>
        </div>

        <div className="border-t border-warm-wood pt-2">
          <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-1">Feature access</p>
          {toggle("3D Preview", "has3DPreview")}
          {toggle("3D Demo Video", "hasDemoVideo")}
          {toggle("Analytics", "hasAnalytics")}
          {toggle("Rule Engine", "hasRuleEngine")}
          {toggle("Priority Support", "hasPrioritySupport")}
        </div>

        <label className="block">
          <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">Features (one per line)</span>
          <textarea className="v-input text-xs resize-none h-24" value={form.features.join("\n")} onChange={e => set("features", e.target.value.split("\n").map(s => s.trim()).filter(Boolean))} />
        </label>

        <Button variant="primary" className="w-full" disabled={!dirty} isLoading={update.isPending}
          onClick={() => update.mutate(form)}>
          {dirty ? "Save Changes" : "Saved"}
        </Button>
      </div>
    </div>
  );
}

export default function AdminPlansPage() {
  const { data: plans, isLoading } = usePlans();
  const sorted = [...(plans ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Subscription Plans</h1>
        <p className="text-soft-gray text-sm font-ui">Edit pricing, commission rates, and feature access. Changes apply across the site immediately.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-96 rounded-xl bg-warm-wood/10 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {sorted.map(plan => <PlanEditor key={plan.tier} plan={plan} />)}
        </div>
      )}
    </div>
  );
}

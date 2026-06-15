"use client";

import { useState, useEffect } from "react";
import { useAdminSettings, useUpdateSettings, type SiteSettings } from "@/hooks/useSettings";
import { Button } from "@/components/atoms/Button";

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<SiteSettings | null>(null);

  useEffect(() => { if (data) setForm(data); }, [data]);

  const dirty = !!form && !!data && JSON.stringify(form) !== JSON.stringify(data);

  function set<K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) {
    setForm(f => (f ? { ...f, [k]: v } : f));
  }

  const toggle = (label: string, key: keyof SiteSettings, hint?: string) => (
    <label className="flex items-center justify-between py-3 border-b border-warm-wood/40 last:border-0">
      <span>
        <span className="text-sm font-ui text-parchment-light block">{label}</span>
        {hint && <span className="text-2xs text-soft-gray font-ui">{hint}</span>}
      </span>
      <button type="button" onClick={() => set(key, !form?.[key] as never)}
        role="switch" aria-checked={!!form?.[key]}
        className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ml-4 ${form?.[key] ? "bg-emerald-glow" : "bg-warm-wood"}`}
        style={{ height: 22, width: 40 }}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-deep-void transition-transform ${form?.[key] ? "translate-x-[18px]" : ""}`} />
      </button>
    </label>
  );

  const textField = (label: string, key: keyof SiteSettings, placeholder?: string, multiline?: boolean) => (
    <label className="block">
      <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1.5">{label}</span>
      {multiline ? (
        <textarea className="v-input text-sm resize-none h-20" placeholder={placeholder}
          value={(form?.[key] as string) ?? ""} onChange={e => set(key, e.target.value as never)} />
      ) : (
        <input className="v-input text-sm" placeholder={placeholder}
          value={(form?.[key] as string) ?? ""} onChange={e => set(key, e.target.value as never)} />
      )}
    </label>
  );

  if (isLoading || !form) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment-light mb-6">Settings</h1>
        <div className="space-y-4 max-w-2xl">{[1, 2, 3].map(i => <div key={i} className="v-card h-40 animate-pulse" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Settings</h1>
        <Button variant="primary" disabled={!dirty} isLoading={update.isPending}
          onClick={() => form && update.mutate(form)}>
          {dirty ? "Save Changes" : "Saved"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Access toggles */}
        <div className="v-card p-5">
          <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light mb-2">Access</h2>
          {toggle("Allow new sign-ups", "signupsEnabled", "When off, registration is rejected site-wide.")}
          {toggle("Marketplace open", "marketplaceEnabled", "Controls public access to the component marketplace.")}
          {toggle("Maintenance mode", "maintenanceMode", "Show a maintenance notice to visitors.")}
          <div className="pt-3">
            {textField("Maintenance message", "maintenanceMessage", "We'll be back shortly…", true)}
          </div>
        </div>

        {/* Announcement */}
        <div className="v-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Announcement banner</h2>
          {textField("Banner text", "announcement", "Leave empty to hide the banner", true)}
        </div>

        {/* Contact + social */}
        <div className="v-card p-5 space-y-4">
          <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Contact &amp; social</h2>
          {textField("Support email", "supportEmail", "support@velonix.com")}
          {textField("Discord URL", "discordUrl", "https://discord.gg/…")}
          {textField("Twitter / X URL", "twitterUrl", "https://x.com/…")}
        </div>
      </div>
    </div>
  );
}

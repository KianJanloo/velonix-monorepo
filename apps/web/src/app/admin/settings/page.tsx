"use client";

import { useState, useEffect } from "react";
import { useAdminSettings, useUpdateSettings, type SiteSettings } from "@/hooks/useSettings";
import { Button } from "@/components/atoms/Button";

type SectionKey = "access" | "general" | "seo" | "social" | "contact" | "branding" | "footer";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "access", label: "Access" },
  { key: "general", label: "General" },
  { key: "seo", label: "SEO" },
  { key: "social", label: "Social Links" },
  { key: "contact", label: "Contact" },
  { key: "branding", label: "Branding" },
  { key: "footer", label: "Footer" },
];

export default function AdminSettingsPage() {
  const { data, isLoading } = useAdminSettings();
  const update = useUpdateSettings();
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("general");

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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Settings</h1>
        <Button variant="primary" disabled={!dirty} isLoading={update.isPending}
          onClick={() => form && update.mutate(form)}>
          {dirty ? "Save Changes" : "Saved"}
        </Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="hidden md:flex flex-col gap-1 w-44 shrink-0 sticky top-20 self-start">
          {SECTIONS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveSection(key)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-ui transition-colors ${
                activeSection === key
                  ? "text-emerald-glow bg-emerald-ghost"
                  : "text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
              }`}>
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeSection === "access" && (
            <div className="v-card p-5">
              <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light mb-2">Access</h2>
              {toggle("Allow new sign-ups", "signupsEnabled", "When off, registration is rejected site-wide.")}
              {toggle("Marketplace open", "marketplaceEnabled", "Controls public access to the component marketplace.")}
              {toggle("Maintenance mode", "maintenanceMode", "Show a maintenance notice to visitors.")}
              <div className="pt-3">
                {textField("Maintenance message", "maintenanceMessage", "We'll be back shortly…", true)}
              </div>
            </div>
          )}

          {activeSection === "general" && (
            <>
              <div className="v-card p-5 space-y-4">
                <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Site Info</h2>
                {textField("Site name", "siteName", "Velonix")}
                {textField("Site description", "siteDescription", "The premium platform for...", true)}
              </div>
              <div className="v-card p-5 space-y-4">
                <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Brand Assets</h2>
                {textField("Logo URL", "logoUrl", "https://example.com/logo.png")}
                {textField("Favicon URL", "faviconUrl", "/favicon.ico")}
              </div>
              <div className="v-card p-5 space-y-4">
                <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Announcement</h2>
                {textField("Banner text", "announcement", "Leave empty to hide the banner", true)}
              </div>
            </>
          )}

          {activeSection === "seo" && (
            <div className="v-card p-5 space-y-4">
              <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">SEO</h2>
              {textField("Meta description", "metaDescription", "Site meta description for search engines", true)}
              {textField("Meta keywords", "metaKeywords", "board games, tabletop, game design", true)}
            </div>
          )}

          {activeSection === "social" && (
            <div className="v-card p-5 space-y-4">
              <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Social Links</h2>
              {textField("Discord URL", "discordUrl", "https://discord.gg/…")}
              {textField("Twitter / X URL", "twitterUrl", "https://x.com/…")}
              {textField("Facebook URL", "facebookUrl", "https://facebook.com/…")}
              {textField("Instagram URL", "instagramUrl", "https://instagram.com/…")}
              {textField("YouTube URL", "youtubeUrl", "https://youtube.com/…")}
              {textField("GitHub URL", "githubUrl", "https://github.com/…")}
              {textField("LinkedIn URL", "linkedinUrl", "https://linkedin.com/…")}
            </div>
          )}

          {activeSection === "contact" && (
            <div className="v-card p-5 space-y-4">
              <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Contact Information</h2>
              {textField("Support email", "supportEmail", "support@velonix.com")}
              {textField("Contact email", "contactEmail", "hello@velonix.com")}
              {textField("Phone", "phone", "+1 (555) 000-0000")}
              {textField("Address", "address", "123 Game Street, City, Country", true)}
            </div>
          )}

          {activeSection === "branding" && (
            <div className="v-card p-5 space-y-4">
              <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Branding</h2>
              {textField("Primary color", "primaryColor", "#0a0a0a")}
              {textField("Accent color", "accentColor", "#d4a853")}
              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xs font-ui text-soft-gray uppercase">Primary</span>
                  <div className="w-8 h-8 rounded border border-warm-wood" style={{ backgroundColor: form.primaryColor || "#0a0a0a" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xs font-ui text-soft-gray uppercase">Accent</span>
                  <div className="w-8 h-8 rounded border border-warm-wood" style={{ backgroundColor: form.accentColor || "#d4a853" }} />
                </div>
              </div>
            </div>
          )}

          {activeSection === "footer" && (
            <div className="v-card p-5 space-y-4">
              <h2 className="font-display text-sm font-bold tracking-wide text-parchment-light">Footer</h2>
              {textField("Footer text", "footerText", "© 2024 Velonix. All rights reserved.", true)}
              {textField("About content", "aboutContent", "Write about your site...", true)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

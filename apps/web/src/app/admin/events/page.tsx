"use client";

import { useState } from "react";
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent, type PromoEventInput } from "@/hooks/useEvents";
import type { PromoEvent, PromoEventVariant, PromoEventPlacement } from "@velonix/types";

const VARIANTS: PromoEventVariant[] = ["promo", "sale", "info", "warning"];
const PLACEMENTS: PromoEventPlacement[] = ["global", "landing", "marketplace"];

const BLANK: PromoEventInput = {
  title: "", message: "", ctaLabel: "", ctaUrl: "",
  variant: "promo", placement: "global", isActive: false, dismissible: true, priority: 0,
  startsAt: null, endsAt: null,
};

const VARIANT_DOT: Record<PromoEventVariant, string> = {
  promo: "bg-[#7c5cff]", sale: "bg-crimson-flame", info: "bg-soft-gray", warning: "bg-royal-gold",
};

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export default function AdminEventsPage() {
  const { data: events, isLoading } = useAdminEvents();
  const create = useCreateEvent();
  const update = useUpdateEvent();
  const remove = useDeleteEvent();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoEventInput>(BLANK);
  const isEditing = editingId !== null;

  function set<K extends keyof PromoEventInput>(k: K, v: PromoEventInput[K]) { setForm(f => ({ ...f, [k]: v })); }

  function startNew() { setEditingId(null); setForm(BLANK); }
  function startEdit(e: PromoEvent) {
    setEditingId(e.id);
    setForm({
      title: e.title, message: e.message, ctaLabel: e.ctaLabel ?? "", ctaUrl: e.ctaUrl ?? "",
      variant: e.variant, placement: e.placement, isActive: e.isActive, dismissible: e.dismissible,
      priority: e.priority, startsAt: e.startsAt, endsAt: e.endsAt,
    });
  }

  function submit() {
    if (!form.title.trim() || !form.message.trim()) return;
    const payload: PromoEventInput = {
      ...form,
      ctaLabel: form.ctaLabel?.trim() || null,
      ctaUrl: form.ctaUrl?.trim() || null,
    };
    if (isEditing && editingId) {
      update.mutate({ id: editingId, patch: payload }, { onSuccess: startNew });
    } else {
      create.mutate(payload, { onSuccess: startNew });
    }
  }

  const previewEvent: PromoEvent = {
    id: "preview", createdAt: "", updatedAt: "",
    title: form.title || "Event title", message: form.message || "Your announcement message",
    ctaLabel: form.ctaLabel || null, ctaUrl: form.ctaUrl || null,
    variant: form.variant ?? "promo", placement: form.placement ?? "global",
    isActive: true, dismissible: form.dismissible ?? true, priority: form.priority ?? 0,
    startsAt: null, endsAt: null,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Promotional Events</h1>
        <p className="text-soft-gray text-sm font-ui mt-1">Announcement banners and offers shown across the site. Toggle active to publish instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="v-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-parchment-light">{isEditing ? "Edit event" : "New event"}</h2>
              {isEditing && <button onClick={startNew} className="text-2xs font-ui text-soft-gray hover:text-parchment-light">+ New instead</button>}
            </div>

            <label className="block">
              <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">Title</span>
              <input className="v-input text-sm" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Launch Sale" />
            </label>
            <label className="block">
              <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">Message</span>
              <textarea className="v-input text-sm resize-none h-16" value={form.message} onChange={e => set("message", e.target.value)} placeholder="70% off all paid games this week!" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">CTA label</span>
                <input className="v-input text-sm" value={form.ctaLabel ?? ""} onChange={e => set("ctaLabel", e.target.value)} placeholder="Shop now" />
              </label>
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">CTA link</span>
                <input className="v-input text-sm" value={form.ctaUrl ?? ""} onChange={e => set("ctaUrl", e.target.value)} placeholder="/marketplace" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">Style</span>
                <select className="v-input text-sm capitalize" value={form.variant} onChange={e => set("variant", e.target.value as PromoEventVariant)}>
                  {VARIANTS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">Placement</span>
                <select className="v-input text-sm capitalize" value={form.placement} onChange={e => set("placement", e.target.value as PromoEventPlacement)}>
                  {PLACEMENTS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">Starts (optional)</span>
                <input type="datetime-local" className="v-input text-sm" value={toLocalInput(form.startsAt)} onChange={e => set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </label>
              <label className="block">
                <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1">Ends (optional)</span>
                <input type="datetime-local" className="v-input text-sm" value={toLocalInput(form.endsAt)} onChange={e => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.isActive} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 rounded border-warm-wood bg-rich-wood-mid accent-emerald-glow" />
                <span className="text-sm font-ui text-parchment-light">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.dismissible} onChange={e => set("dismissible", e.target.checked)} className="w-4 h-4 rounded border-warm-wood bg-rich-wood-mid accent-emerald-glow" />
                <span className="text-sm font-ui text-parchment-light">Dismissible</span>
              </label>
              <label className="flex items-center gap-2 ml-auto">
                <span className="text-2xs font-ui text-soft-gray">Priority</span>
                <input type="number" className="v-input text-sm w-16 !py-1.5" value={form.priority ?? 0} onChange={e => set("priority", Number(e.target.value) || 0)} />
              </label>
            </div>

            <button onClick={submit} disabled={!form.title.trim() || !form.message.trim() || create.isPending || update.isPending}
              className="w-full py-2.5 rounded-lg bg-emerald-glow text-deep-void text-sm font-ui font-bold hover:bg-emerald-bright transition-all disabled:opacity-40">
              {isEditing ? "Save changes" : "Create event"}
            </button>
          </div>

          {/* Live preview */}
          <div>
            <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">Preview</p>
            <div className="rounded-lg overflow-hidden border border-warm-wood">
              <PreviewBanner event={previewEvent} />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" /></div>
          ) : !events || events.length === 0 ? (
            <div className="v-card p-8 text-center text-soft-gray text-sm font-ui">No events yet. Create your first banner on the left.</div>
          ) : (
            <div className="space-y-2">
              {events.map(e => (
                <div key={e.id} className="v-card p-4 flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${VARIANT_DOT[e.variant]}`} title={e.variant} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-ui font-semibold text-parchment-light text-sm">{e.title}</span>
                      <span className="text-2xs px-1.5 py-0.5 rounded-full font-ui capitalize bg-warm-wood/50 text-soft-gray">{e.placement}</span>
                      {e.priority !== 0 && <span className="text-2xs text-soft-gray-dark font-ui">priority {e.priority}</span>}
                    </div>
                    <p className="text-2xs text-soft-gray font-ui mt-0.5 line-clamp-2">{e.message}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => update.mutate({ id: e.id, patch: { isActive: !e.isActive } })}
                      title={e.isActive ? "Active — click to disable" : "Inactive — click to enable"}
                      className={`relative w-9 h-5 rounded-full transition-colors ${e.isActive ? "bg-emerald-glow" : "bg-warm-wood"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-deep-void transition-all ${e.isActive ? "left-4" : "left-0.5"}`} />
                    </button>
                    <button onClick={() => startEdit(e)} className="p-1.5 rounded text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood" title="Edit">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2.5l2 2L5 11l-2.5.5L3 9l6.5-6.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${e.title}"?`)) remove.mutate(e.id); }} className="p-1.5 rounded text-soft-gray-dark hover:text-crimson-flame hover:bg-crimson-flame/10" title="Delete">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 4h8M5.5 4V2.5h3V4M4 4l.5 7.5h5L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Static preview that mirrors PromoBanner styling without fetching. */
function PreviewBanner({ event }: { event: PromoEvent }) {
  const style: Record<PromoEventVariant, string> = {
    promo: "bg-gradient-to-r from-[#7c5cff] to-[#00b8d4] text-white",
    sale: "bg-gradient-to-r from-[#ff3b5c] to-[#f5c451] text-deep-void",
    info: "bg-rich-wood-mid text-parchment-light",
    warning: "bg-royal-gold text-deep-void",
  };
  return (
    <div className={`px-4 py-2 flex items-center justify-center gap-3 text-center ${style[event.variant]}`}>
      <p className="text-sm font-ui"><span className="font-bold">{event.title}</span><span className="opacity-90"> — {event.message}</span></p>
      {event.ctaLabel && <span className="text-2xs font-ui font-bold underline underline-offset-2">{event.ctaLabel} →</span>}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useAuth";
import { usePublicSettings } from "@/hooks/useSettings";
import {
  useMyTickets, useCreateTicket, useReplyTicket,
  type SupportTicket, type TicketCategory,
} from "@/hooks/useSupport";
import { Button } from "@/components/atoms/Button";

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "billing", label: "Billing & payments" },
  { value: "technical", label: "Technical issue" },
  { value: "report", label: "Report content" },
  { value: "feature", label: "Feature request" },
];

const statusBadge: Record<string, string> = {
  open: "bg-cyan-spark/10 text-cyan-spark",
  pending: "bg-royal-gold/10 text-royal-gold",
  resolved: "bg-emerald-ghost text-emerald-glow",
};

function Thread({ ticket }: { ticket: SupportTicket }) {
  const reply = useReplyTicket();
  const [body, setBody] = useState("");
  return (
    <div className="mt-3 border-t border-warm-wood/40 pt-3">
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {ticket.messages?.map((m) => (
          <div key={m.id} className={`flex ${m.senderRole === "admin" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-ui ${
              m.senderRole === "admin" ? "bg-warm-wood text-parchment-light" : "bg-emerald-ghost text-parchment-light"
            }`}>
              {m.senderRole === "admin" && <p className="text-2xs text-emerald-glow font-semibold mb-0.5">Support</p>}
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="text-2xs text-soft-gray-dark mt-1">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      {ticket.status !== "resolved" && (
        <div className="flex gap-2 mt-3">
          <input className="v-input text-sm flex-1" placeholder="Write a reply…" value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && body.trim()) { reply.mutate({ id: ticket.id, body: body.trim() }); setBody(""); } }} />
          <Button variant="primary" isLoading={reply.isPending} disabled={!body.trim()}
            onClick={() => { reply.mutate({ id: ticket.id, body: body.trim() }); setBody(""); }}>
            Send
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  const user = useCurrentUser();
  const { data: settings } = usePublicSettings();
  const { data: tickets } = useMyTickets(!!user);
  const create = useCreateTicket();

  const [form, setForm] = useState({ subject: "", category: "general" as TicketCategory, body: "", name: "", email: "" });
  const [openId, setOpenId] = useState<string | null>(null);

  const canSubmit = form.subject.trim().length >= 3 && form.body.trim().length >= 5 && (user || (form.name.trim() && form.email.trim()));

  function submit() {
    create.mutate(
      {
        subject: form.subject.trim(),
        body: form.body.trim(),
        category: form.category,
        ...(user ? {} : { name: form.name.trim(), email: form.email.trim() }),
      },
      { onSuccess: () => setForm({ subject: "", category: "general", body: "", name: "", email: "" }) },
    );
  }

  return (
    <div className="min-h-screen bg-deep-void text-parchment-light">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-2xl font-bold tracking-display mb-1">Support</h1>
        <p className="text-soft-gray text-sm font-ui mb-6">
          Need a hand? Send us a message and the team will get back to you
          {settings?.supportEmail ? <> — or email <a className="text-emerald-glow" href={`mailto:${settings.supportEmail}`}>{settings.supportEmail}</a></> : null}.
        </p>

        {/* New ticket */}
        <div className="v-card p-5 space-y-3 mb-8">
          <h2 className="font-display text-base font-bold text-parchment-light">Contact us</h2>
          {!user && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="v-input text-sm" placeholder="Your name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <input className="v-input text-sm" type="email" placeholder="Your email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="v-input text-sm" placeholder="Subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            <select className="v-input text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as TicketCategory }))}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <textarea className="v-input text-sm resize-none h-28" placeholder="How can we help?" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          <div className="flex justify-end">
            <Button variant="primary" isLoading={create.isPending} disabled={!canSubmit} onClick={submit}>Send message</Button>
          </div>
          {!user && (
            <p className="text-2xs text-soft-gray-dark font-ui">
              <Link href="/auth/login?next=/support" className="text-emerald-glow">Sign in</Link> to track replies in your account.
            </p>
          )}
        </div>

        {/* My tickets */}
        {user && tickets && tickets.length > 0 && (
          <div>
            <h2 className="font-display text-base font-bold text-parchment-light mb-3">Your tickets</h2>
            <div className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="v-card p-4">
                  <button className="w-full flex items-center justify-between gap-3 text-left" onClick={() => setOpenId(openId === t.id ? null : t.id)}>
                    <div className="min-w-0">
                      <p className="text-sm font-ui text-parchment-light truncate">{t.subject}</p>
                      <p className="text-2xs text-soft-gray-dark font-mono">{new Date(t.lastMessageAt).toLocaleString()}</p>
                    </div>
                    <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize shrink-0 ${statusBadge[t.status]}`}>{t.status}</span>
                  </button>
                  {openId === t.id && <Thread ticket={t} />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

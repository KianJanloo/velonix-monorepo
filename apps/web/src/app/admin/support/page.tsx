"use client";

import { useState } from "react";
import {
  useAdminTickets, useAdminTicket, useAdminReply, useAdminSetTicketStatus,
  type TicketStatus,
} from "@/hooks/useSupport";
import { Button } from "@/components/atoms/Button";
import { Pagination } from "@/components/atoms/Pagination";

const FILTERS: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Awaiting user" },
  { value: "resolved", label: "Resolved" },
];

const statusBadge: Record<string, string> = {
  open: "bg-emerald-glow/10 text-emerald-glow",
  pending: "bg-royal-gold/10 text-royal-gold",
  resolved: "bg-emerald-ghost text-emerald-glow",
};

function TicketDetail({ id }: { id: string }) {
  const { data: ticket, isLoading } = useAdminTicket(id);
  const reply = useAdminReply();
  const setStatus = useAdminSetTicketStatus();
  const [body, setBody] = useState("");

  if (isLoading || !ticket) return <div className="v-card p-6 text-soft-gray text-sm font-ui">Loading…</div>;

  return (
    <div className="v-card p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-display text-base font-bold text-parchment-light">{ticket.subject}</h2>
        <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize shrink-0 ${statusBadge[ticket.status]}`}>{ticket.status}</span>
      </div>
      <p className="text-2xs text-soft-gray font-ui mb-1">
        {ticket.name} · <a className="text-emerald-glow" href={`mailto:${ticket.email}`}>{ticket.email}</a> · <span className="capitalize">{ticket.category}</span>
      </p>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 my-3">
        {ticket.messages?.map((m) => (
          <div key={m.id} className={`flex ${m.senderRole === "admin" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm font-ui ${m.senderRole === "admin" ? "bg-emerald-ghost text-parchment-light" : "bg-warm-wood text-parchment-light"}`}>
              <p className="text-2xs font-semibold mb-0.5 text-soft-gray">{m.senderRole === "admin" ? "You (Support)" : ticket.name}</p>
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="text-2xs text-soft-gray-dark mt-1">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <textarea className="v-input text-sm resize-none h-24" placeholder="Reply as support…" value={body} onChange={(e) => setBody(e.target.value)} />
      <div className="flex items-center gap-2 mt-2">
        <Button variant="primary" isLoading={reply.isPending} disabled={!body.trim()}
          onClick={() => reply.mutate({ id, body: body.trim() }, { onSuccess: () => setBody("") })}>
          Send reply
        </Button>
        {ticket.status !== "resolved" ? (
          <Button variant="outline" isLoading={setStatus.isPending} onClick={() => setStatus.mutate({ id, status: "resolved" })}>Mark resolved</Button>
        ) : (
          <Button variant="outline" isLoading={setStatus.isPending} onClick={() => setStatus.mutate({ id, status: "open" })}>Reopen</Button>
        )}
      </div>
    </div>
  );
}

export default function AdminSupportPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const { data, isLoading } = useAdminTickets(filter === "all" ? undefined : filter, page);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-parchment-light">Support</h1>
        <span className="text-soft-gray text-sm font-ui">{data?.total ?? 0} tickets</span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => { setFilter(f.value); setSelected(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-ui transition-colors ${
              filter === f.value ? "bg-emerald-ghost text-emerald-glow border border-emerald-glow/30" : "border border-warm-wood text-soft-gray hover:text-parchment-light"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <div className="space-y-2">
          {isLoading ? (
            [1, 2, 3].map((i) => <div key={i} className="v-card h-16 animate-pulse" />)
          ) : data?.data.length ? data.data.map((t) => (
            <button key={t.id} onClick={() => setSelected(t.id)}
              className={`v-card w-full text-left p-4 transition-colors ${selected === t.id ? "border-emerald-glow/50" : "hover:border-warm-wood-light"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-ui text-parchment-light truncate">{t.subject}</p>
                <span className={`text-2xs px-2 py-0.5 rounded-full font-ui capitalize shrink-0 ${statusBadge[t.status]}`}>{t.status}</span>
              </div>
              <p className="text-2xs text-soft-gray font-ui mt-1">{t.name} · {new Date(t.lastMessageAt).toLocaleString()}</p>
            </button>
          )) : (
            <div className="v-card p-8 text-center text-soft-gray text-sm font-ui">No tickets in this view.</div>
          )}
          <Pagination page={page} totalPages={data?.totalPages ?? 1} onPageChange={setPage} />
        </div>

        <div className="lg:sticky lg:top-20">
          {selected ? <TicketDetail id={selected} /> : (
            <div className="v-card p-8 text-center text-soft-gray text-sm font-ui">Select a ticket to view the conversation.</div>
          )}
        </div>
      </div>
    </div>
  );
}

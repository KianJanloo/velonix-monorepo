"use client";

import { useState } from "react";
import {
  useAdminCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
  useAdminRefreshCategoryCounts,
  type Category,
  type CreateCategoryPayload,
} from "@/hooks/useCategories";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateCategoryPayload = {
  slug: "",
  label: "",
  description: "",
  icon: "",
  sortOrder: 0,
  isActive: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

// ── Inline form ───────────────────────────────────────────────────────────────

function CategoryForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: CreateCategoryPayload;
  onSave: (v: CreateCategoryPayload) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<CreateCategoryPayload>(initial);
  const isNew = !("id" in initial);

  const set = <K extends keyof CreateCategoryPayload>(
    k: K,
    v: CreateCategoryPayload[K],
  ) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <div className="v-card p-5 space-y-4 border-emerald-glow/30">
      <h3 className="font-display text-sm font-bold text-parchment-light">
        {isNew ? "New category" : `Edit — ${initial.label}`}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Label */}
        <label className="block">
          <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">
            Label *
          </span>
          <input
            className="v-input text-sm"
            placeholder="Deck Building"
            value={form.label}
            onChange={(e) => {
              set("label", e.target.value);
              if (isNew) set("slug", slugify(e.target.value));
            }}
          />
        </label>

        {/* Slug */}
        <label className="block">
          <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">
            Slug *{" "}
            <span className="normal-case text-soft-gray-dark">(immutable)</span>
          </span>
          <input
            className="v-input text-sm font-mono"
            placeholder="deck_building"
            value={form.slug}
            disabled={!isNew}
            onChange={(e) => set("slug", slugify(e.target.value))}
          />
        </label>

        {/* Icon */}
        <label className="block">
          <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">
            Icon (emoji or SVG string)
          </span>
          <input
            className="v-input text-sm"
            placeholder="🃏"
            value={form.icon ?? ""}
            onChange={(e) => set("icon", e.target.value || null)}
          />
        </label>

        {/* Sort order */}
        <label className="block">
          <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">
            Sort order
          </span>
          <input
            type="number"
            className="v-input text-sm"
            min={0}
            value={form.sortOrder ?? 0}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </label>
      </div>

      {/* Description */}
      <label className="block">
        <span className="text-2xs font-ui text-soft-gray uppercase tracking-wider block mb-1">
          Description
        </span>
        <textarea
          className="v-input text-sm resize-none h-16"
          placeholder="Short description shown in filter dropdowns…"
          value={form.description ?? ""}
          onChange={(e) => set("description", e.target.value || null)}
        />
      </label>

      {/* Active toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={!!form.isActive}
          onClick={() => set("isActive", !form.isActive)}
          className={`relative w-10 rounded-full transition-colors shrink-0 ${form.isActive ? "bg-emerald-glow" : "bg-warm-wood"}`}
          style={{ height: 22 }}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-deep-void transition-transform ${form.isActive ? "translate-x-[18px]" : ""}`}
          />
        </button>
        <span className="text-sm font-ui text-parchment-light">
          {form.isActive
            ? "Active — visible in public filters"
            : "Hidden — not shown publicly"}
        </span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(form)}
          disabled={isPending || !form.label.trim() || !form.slug.trim()}
          className="px-4 py-2 rounded-lg bg-emerald-glow text-deep-void text-sm font-ui font-bold hover:bg-emerald-bright disabled:opacity-40 transition-colors"
        >
          {isPending ? "Saving…" : isNew ? "Create" : "Save changes"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-warm-wood text-soft-gray text-sm font-ui hover:text-parchment-light transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function CategoryRow({
  cat,
  onEdit,
}: {
  cat: Category;
  onEdit: (c: Category) => void;
}) {
  const del = useAdminDeleteCategory();

  return (
    <div className="flex items-center gap-3 py-3 border-b border-warm-wood/40 last:border-0 group">
      {/* Icon */}
      <span
        className="w-8 h-8 rounded-lg bg-warm-wood/40 flex items-center justify-center text-base shrink-0"
        aria-hidden
      >
        {cat.icon ?? "🎲"}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-ui font-semibold text-parchment-light">
            {cat.label}
          </span>
          <code className="text-[10px] font-mono text-soft-gray-dark bg-rich-wood-mid px-1.5 py-0.5 rounded">
            {cat.slug}
          </code>
          {!cat.isActive && (
            <span className="text-[10px] font-ui text-royal-gold bg-[rgba(245,196,81,0.1)] px-1.5 py-0.5 rounded-full">
              Hidden
            </span>
          )}
        </div>
        {cat.description && (
          <p className="text-xs text-soft-gray font-ui truncate mt-0.5">
            {cat.description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-sm font-display font-bold text-parchment-mid">
          {cat.gameCount}
        </p>
        <p className="text-[10px] text-soft-gray-dark font-ui">games</p>
      </div>
      <div className="text-right shrink-0 hidden md:block">
        <p className="text-xs font-mono text-soft-gray-dark">
          #{cat.sortOrder}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => onEdit(cat)}
          className="p-1.5 rounded hover:bg-warm-wood text-soft-gray hover:text-parchment-light"
          title="Edit"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path
              d="M9 2l2 2-7 7H2V9l7-7z"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <ConfirmDialog
          title="Delete category?"
          description={`"${cat.label}" will be removed. Games already tagged with this slug keep their tag but it won't appear in public filters.`}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => del.mutate(cat.id)}
        >
          {(open) => (
            <button
              onClick={open}
              className="p-1.5 rounded hover:bg-crimson-ghost text-soft-gray-dark hover:text-crimson-flame"
              title="Delete"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M2 3h9M5 3V2h3v1M4 3l.5 8h4L9 3"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </ConfirmDialog>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const [page, setPage] = useState(1);
  const perPage = 50;
  const { data: result, isLoading } = useAdminCategories(page, perPage);
  const categories = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;
  const create = useAdminCreateCategory();
  const update = useAdminUpdateCategory();
  const refresh = useAdminRefreshCategoryCounts();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "hidden">("all");

  const filtered = categories.filter((c: any) => {
    if (filter === "active") return c.isActive;
    if (filter === "hidden") return !c.isActive;
    return true;
  });

  function handleCreate(form: CreateCategoryPayload) {
    create.mutate(form, { onSuccess: () => { setShowForm(false); setPage(1); } });
  }

  function handleUpdate(form: CreateCategoryPayload) {
    if (!editing) return;
    const { slug: _slug, ...payload } = form;
    update.mutate(
      { id: editing.id, ...payload },
      { onSuccess: () => setEditing(null) },
    );
  }

  if (isLoading) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-parchment-light mb-6">
          Categories
        </h1>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="v-card h-16 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-parchment-light">
            Categories
          </h1>
          <p className="text-soft-gray text-sm font-ui mt-0.5">
            {total} categor{total === 1 ? "y" : "ies"} ·{" "}
            {categories.reduce((a, c) => a + c.gameCount, 0)} games total
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => void refresh.mutate()}
            disabled={refresh.isPending}
            className="px-3 py-1.5 rounded-lg border border-warm-wood text-soft-gray text-sm font-ui hover:text-parchment-light disabled:opacity-40 transition-colors"
            title="Recount games per category from DB"
          >
            {refresh.isPending ? "Refreshing…" : "↻ Refresh counts"}
          </button>

          <button
            onClick={() => {
              setEditing(null);
              setShowForm((v) => !v);
            }}
            className="px-4 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-sm font-ui font-bold hover:bg-emerald-bright transition-colors"
          >
            + New category
          </button>
        </div>
      </div>

      {/* Inline create form */}
      {showForm && !editing && (
        <div className="mb-6">
          <CategoryForm
            initial={EMPTY_FORM}
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            isPending={create.isPending}
          />
        </div>
      )}

      {/* Inline edit form */}
      {editing && (
        <div className="mb-6">
          <CategoryForm
            initial={{
              slug: editing.slug,
              label: editing.label,
              description: editing.description,
              icon: editing.icon,
              sortOrder: editing.sortOrder,
              isActive: editing.isActive,
            }}
            onSave={handleUpdate}
            onCancel={() => setEditing(null)}
            isPending={update.isPending}
          />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "active", "hidden"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-ui capitalize transition-colors ${
              filter === f
                ? "bg-emerald-glow text-deep-void font-bold"
                : "border border-warm-wood text-soft-gray hover:text-parchment-light"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Category list */}
      <div className="v-card p-4">
        {filtered.length === 0 ? (
          <p className="text-soft-gray-dark text-sm font-ui text-center py-8">
            {filter === "hidden"
              ? "No hidden categories."
              : "No categories yet. Create one above."}
          </p>
        ) : (
          filtered.map((cat: any) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              onEdit={(c) => {
                setEditing(c);
                setShowForm(false);
              }}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-warm-wood text-sm font-ui text-soft-gray disabled:opacity-40 hover:text-parchment-light transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-soft-gray font-ui">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-warm-wood text-sm font-ui text-soft-gray disabled:opacity-40 hover:text-parchment-light transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-soft-gray-dark font-ui">
        Slugs are immutable once created — they match the <code>category</code>{" "}
        field on GameEntity. Deleting a category does not retag existing games;
        it only hides it from public filters.
      </p>
    </div>
  );
}

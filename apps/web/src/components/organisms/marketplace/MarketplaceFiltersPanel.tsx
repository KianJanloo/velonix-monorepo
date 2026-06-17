"use client";

import { useCategories } from "@/hooks/useCategories";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const PRICES = [
  { value: "", label: "All" },
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const COMPLEXITIES = [
  { value: "", label: "Any" },
  { value: "light", label: "Light" },
  { value: "medium", label: "Medium" },
  { value: "medium_heavy", label: "Heavy" },
  { value: "heavy", label: "Expert" },
];

interface MarketplaceFiltersPanelProps {
  initialCategory?: string;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-5 border-b border-warm-wood/50 last:border-0 last:pb-0">
      <p className="text-2xs font-ui font-bold tracking-[0.14em] uppercase text-parchment-mid mb-3">
        {title}
      </p>
      {children}
    </div>
  );
}

export function MarketplaceFiltersPanel({
  initialCategory = "",
}: MarketplaceFiltersPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categories } = useCategories();

  const category = searchParams.get("category") ?? initialCategory;
  const price = searchParams.get("price") ?? "";
  const complexity = searchParams.get("complexity") ?? "";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const activeCount = [category, price, complexity].filter(Boolean).length;

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["category", "price", "complexity", "page"].forEach((k) =>
      params.delete(k),
    );
    router.push(`?${params.toString()}`);
  };

  // Pill button for compact toggle groups
  const Pill = ({
    active,
    onClick,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-2xs font-ui font-semibold border transition-all ${
        active
          ? "bg-emerald-glow text-deep-void border-emerald-glow"
          : "border-warm-wood text-soft-gray hover:border-warm-wood-light hover:text-parchment-light"
      }`}
    >
      {children}
    </button>
  );

  return (
    <aside className="v-card p-5 flex flex-col gap-5 sticky top-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            className="text-emerald-glow"
          >
            <path
              d="M2 3h12M4 8h8M6 13h4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-sm font-bold tracking-wide text-parchment-light">
            Filters
          </span>
          {activeCount > 0 && (
            <span className="text-2xs bg-emerald-ghost text-emerald-glow font-ui font-bold px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-2xs text-soft-gray-dark font-ui hover:text-crimson-flame transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category — pill grid */}
      <Section title="Category">
        <div className="flex flex-wrap gap-1.5">
          <Pill active={!category} onClick={() => updateParam("category", "")}>
            All
          </Pill>
          {categories && categories.map((c) => (
            <Pill
              key={c.label}
              active={category === c.label}
              onClick={() => updateParam("category", c.label)}
            >
              {c.label}
            </Pill>
          ))}
        </div>
      </Section>

      {/* Price — segmented control */}
      <Section title="Price">
        <div className="flex gap-1 bg-warm-wood/40 rounded-lg p-1">
          {PRICES.map((p) => (
            <button
              key={p.value}
              onClick={() => updateParam("price", p.value)}
              className={`flex-1 py-1.5 rounded-md text-2xs font-ui font-semibold transition-all ${
                (price || "") === p.value
                  ? "bg-emerald-glow text-deep-void"
                  : "text-soft-gray hover:text-parchment-light"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Complexity — segmented control */}
      <Section title="Complexity">
        <div className="grid grid-cols-3 gap-1.5">
          {COMPLEXITIES.map((c) => (
            <button
              key={c.value}
              onClick={() => updateParam("complexity", c.value)}
              className={`py-1.5 rounded-lg text-2xs font-ui font-semibold border transition-all ${
                (complexity || "") === c.value
                  ? "bg-emerald-ghost border-emerald-glow/40 text-emerald-glow"
                  : "border-warm-wood text-soft-gray hover:border-warm-wood-light hover:text-parchment-light"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Section>
    </aside>
  );
}

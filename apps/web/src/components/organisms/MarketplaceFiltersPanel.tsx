"use client";

import { useState } from "react";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "strategy", label: "Strategy" },
  { value: "party", label: "Party" },
  { value: "cooperative", label: "Cooperative" },
  { value: "deck_building", label: "Deck Building" },
  { value: "worker_placement", label: "Worker Placement" },
  { value: "euro", label: "Euro" },
  { value: "abstract", label: "Abstract" },
  { value: "rpg", label: "RPG" },
  { value: "family", label: "Family" },
];

interface MarketplaceFiltersPanelProps {
  initialCategory?: string;
}

export function MarketplaceFiltersPanel({ initialCategory = "" }: MarketplaceFiltersPanelProps) {
  const [category, setCategory] = useState(initialCategory);
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [complexity, setComplexity] = useState("");

  return (
    <aside className="flex flex-col gap-6">
      {/* Category */}
      <div>
        <p className="text-2xs font-ui font-bold tracking-[0.14em] uppercase text-soft-gray-dark mb-3">
          Category
        </p>
        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setCategory(value)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-ui transition-all duration-100 ${
                category === value
                  ? "text-emerald-glow bg-emerald-ghost"
                  : "text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="text-2xs font-ui font-bold tracking-[0.14em] uppercase text-soft-gray-dark mb-3">
          Price
        </p>
        <div className="flex flex-col gap-0.5">
          {(["all", "free", "paid"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPriceFilter(v)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-ui capitalize transition-all duration-100 ${
                priceFilter === v
                  ? "text-emerald-glow bg-emerald-ghost"
                  : "text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
              }`}
            >
              {v === "all" ? "All Prices" : v === "free" ? "Free Only" : "Paid Only"}
            </button>
          ))}
        </div>
      </div>

      {/* Complexity */}
      <div>
        <p className="text-2xs font-ui font-bold tracking-[0.14em] uppercase text-soft-gray-dark mb-3">
          Complexity
        </p>
        <div className="flex flex-col gap-0.5">
          {["", "light", "medium", "medium_heavy", "heavy"].map((v) => (
            <button
              key={v}
              onClick={() => setComplexity(v)}
              className={`text-left px-3 py-2 rounded-lg text-sm font-ui capitalize transition-all duration-100 ${
                complexity === v
                  ? "text-emerald-glow bg-emerald-ghost"
                  : "text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
              }`}
            >
              {v === "" ? "Any Complexity" : v.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={() => { setCategory(""); setPriceFilter("all"); setComplexity(""); }}
        className="text-soft-gray-dark text-xs font-ui hover:text-soft-gray transition-colors text-left px-3"
      >
        Clear all filters
      </button>
    </aside>
  );
}

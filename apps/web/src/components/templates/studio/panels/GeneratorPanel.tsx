"use client";

import { useState, useCallback, useMemo } from "react";
import type { CanvasComp } from "../core";

// ── Seeded RNG (Mulberry32) ───────────────────────────────────────────────────

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Built-in word lists ───────────────────────────────────────────────────────

const LISTS: Record<string, string[]> = {
  hero: [
    "Aldric", "Seraphine", "Kael", "Mira", "Doran", "Lyra",
    "Theron", "Isadora", "Caspian", "Velara", "Oryn", "Sable",
  ],
  monster: [
    "Goblin Scout", "Cave Troll", "Shadow Wraith", "Stone Golem",
    "Plague Rat", "Bone Archer", "Frost Imp", "Vine Horror",
    "Mud Creeper", "Sky Serpent", "Plague Bat", "Ember Drake",
  ],
  location: [
    "Ashwood Forest", "Iron Peak", "Saltmarsh", "The Void Rift",
    "Ember Keep", "Frostholm", "Verdant Vale", "The Sunken City",
    "Thornwall", "Crimson Desert", "The Shifting Isles", "Dusk Citadel",
  ],
  item: [
    "Iron Shield", "Swift Boots", "Hex Amulet", "Dragon Scale",
    "Venom Blade", "Mana Crystal", "Stone Hammer", "Shadow Cloak",
    "Wind Scroll", "Ember Orb", "Blood Ring", "Frost Arrow",
  ],
  event: [
    "Ambush at Dawn", "Market Day", "The Storm Breaks", "Betrayal",
    "A Stranger Arrives", "The Bridge Collapses", "Fire!", "Siege Begins",
    "The Oracle Speaks", "Eclipse", "Famine Strikes", "Uprising",
  ],
  zone: [
    "Zone A", "Zone B", "Zone C", "The Wastes", "Central Hub",
    "Outer Ring", "Safe Zone", "Danger Zone", "The Depths", "High Ground",
  ],
  resource: [
    "Wood", "Stone", "Iron", "Gold", "Food", "Cloth",
    "Spice", "Herbs", "Oil", "Coal", "Crystal", "Silk",
  ],
  number: Array.from({ length: 12 }, (_, i) => String(i + 1)),
  colour: [
    "Red", "Blue", "Green", "Yellow", "Purple",
    "Orange", "Black", "White", "Gold", "Silver",
  ],
  adjective: [
    "Ancient", "Cursed", "Hidden", "Mighty", "Swift",
    "Dark", "Blessed", "Savage", "Silent", "Radiant",
    "Broken", "Forgotten",
  ],
};

// ── Template renderer ─────────────────────────────────────────────────────────

/**
 * Resolves a template string like `"{hero} finds a {item} in {location}"`
 * using the provided RNG. Unknown tags are left as-is.
 */
// function renderTemplate(template: string, rng: () => number): string {
//   return template.replace(/\{(\w+)(?::(\d+))?\}/g, (_, key: string, idx?: string) => {
//     const list = LISTS[key.toLowerCase()];
//     if (!list || list.length === 0) return `{${key}}`;
//     if (idx !== undefined) {
//       const i = Math.min(Number(idx), list.length - 1);
//       return list[i] ?? "";
//     }
//     return list[Math.floor(rng() * list.length)] ?? "";
//   });
// }
// renderTemplate("{hero} finds a {item} in {location}", mulberry32(42)); // Example usage

// ── Built-in template presets ─────────────────────────────────────────────────

interface TemplatePreset {
  label: string;
  category: string;
  template: string;
}

const PRESETS: TemplatePreset[] = [
  // Card text
  { category: "Cards",     label: "Hero card",       template: "{hero} — {adjective} warrior" },
  { category: "Cards",     label: "Monster card",    template: "{monster} (Level {number})" },
  { category: "Cards",     label: "Item card",       template: "{adjective} {item}" },
  { category: "Cards",     label: "Event card",      template: "{event}" },
  { category: "Cards",     label: "Location card",   template: "{adjective} {location}" },
  // Board spaces
  { category: "Spaces",    label: "Zone name",       template: "{location}" },
  { category: "Spaces",    label: "Numbered space",  template: "Space {number}" },
  { category: "Spaces",    label: "Resource space",  template: "{resource} Deposit" },
  // Tokens
  { category: "Tokens",    label: "Colour token",    template: "{colour} Token" },
  { category: "Tokens",    label: "Player token",    template: "Player {number}" },
  { category: "Tokens",    label: "Resource token",  template: "{resource}" },
  // Flavour text
  { category: "Flavour",   label: "Short flavour",   template: "The {adjective} {hero} entered {location}." },
  { category: "Flavour",   label: "Event flavour",   template: "{event} — {adjective} times lie ahead." },
  // Custom
  { category: "Custom",    label: "Empty template",  template: "" },
];

const PRESET_CATEGORIES = Array.from(new Set(PRESETS.map((p) => p.category)));

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

// ── Tag reference tooltip ─────────────────────────────────────────────────────

function TagReference() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-[10px] font-ui text-soft-gray-dark hover:text-parchment-light underline underline-offset-2 transition-colors"
      >
        {open ? "Hide" : "Tag reference"}
      </button>
      {open && (
        <div className="mt-1.5 rounded-lg border border-warm-wood/60 bg-rich-wood-mid p-2.5 space-y-1">
          {Object.keys(LISTS).map((key) => (
            <div key={key} className="flex items-center gap-2">
              <code className="text-[10px] font-mono text-emerald-glow bg-emerald-ghost px-1 rounded">
                {`{${key}}`}
              </code>
              <span className="text-[10px] text-soft-gray-dark font-ui">
                {LISTS[key]!.slice(0, 3).join(", ")}…
              </span>
            </div>
          ))}
          <p className="text-[10px] text-soft-gray-dark font-ui pt-1 border-t border-warm-wood/40">
            Use <code className="text-emerald-glow">{`{tag:N}`}</code> for a fixed index.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Preview list ──────────────────────────────────────────────────────────────

function PreviewList({ results }: { results: string[] }) {
  if (results.length === 0) return null;
  return (
    <div className="rounded-lg border border-warm-wood/40 bg-rich-wood-mid divide-y divide-warm-wood/30 max-h-44 overflow-y-auto">
      {results.map((r, i) => (
        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5">
          <span className="text-[10px] font-mono text-soft-gray-dark w-4 shrink-0 text-right">
            {i + 1}
          </span>
          <span className="text-2xs font-ui text-parchment-light flex-1 min-w-0 truncate">
            {r}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  components: CanvasComp[];
  selectionIds: string[];
  onApply: (updates: { id: string; text: string; name: string }[]) => void;
}

export function GeneratorPanel({ components, selectionIds, onApply }: Props) {
  const [template, setTemplate] = useState("{hero} — {adjective} warrior");
  const [seed, setSeed] = useState(42);
  const [count, setCount] = useState(8);
  const [activeCategory, setActiveCategory] = useState("Cards");
  const [applyTarget, setApplyTarget] = useState<"selection" | "type" | "all">("selection");
  const [applyType, setApplyType] = useState<CanvasComp["type"]>("card");
  const [customList, setCustomList] = useState("");
  const [customKey, setCustomKey] = useState("custom");
  const [generated, setGenerated] = useState<string[]>([]);
  const [appliedCount, setAppliedCount] = useState<number | null>(null);

  // Merge any custom list into LISTS for this session
  const effectiveLists = useMemo(() => {
    if (!customKey.trim() || !customList.trim()) return LISTS;
    const items = customList.split("\n").map((s) => s.trim()).filter(Boolean);
    return { ...LISTS, [customKey.toLowerCase()]: items };
  }, [customKey, customList]);

  const generate = useCallback(() => {
    const rng = mulberry32(seed);
    const results = Array.from({ length: Math.max(1, Math.min(200, count)) }, () =>
      template.replace(/\{(\w+)(?::(\d+))?\}/g, (_, key: string, idx?: string) => {
        const list = effectiveLists[key.toLowerCase()];
        if (!list || list.length === 0) return `{${key}}`;
        if (idx !== undefined) return list[Math.min(Number(idx), list.length - 1)] ?? "";
        return list[Math.floor(rng() * list.length)] ?? "";
      })
    );
    setGenerated(results);
    setAppliedCount(null);
  }, [template, seed, count, effectiveLists]);

  const apply = useCallback(() => {
    let targets: CanvasComp[] = [];

    if (applyTarget === "selection") {
      targets = components.filter((c) => selectionIds.includes(c.id));
    } else if (applyTarget === "type") {
      targets = components.filter((c) => c.type === applyType);
    } else {
      targets = [...components];
    }

    if (targets.length === 0 || generated.length === 0) return;

    const updates = targets.map((c, i) => ({
      id: c.id,
      text: generated[i % generated.length] ?? "",
      name: generated[i % generated.length] ?? c.name,
    }));

    onApply(updates);
    setAppliedCount(updates.length);
  }, [components, selectionIds, applyTarget, applyType, generated, onApply]);

  // const shuffleSeed = useCallback(() => {
  //   setSeed(Math.floor(Math.random() * 99999));
  // }, []);

  const categoryPresets = PRESETS.filter((p) => p.category === activeCategory);

  const targetCount =
    applyTarget === "selection"
      ? selectionIds.length
      : applyTarget === "type"
        ? components.filter((c) => c.type === applyType).length
        : components.length;

  return (
    <div className="p-3 space-y-4 overflow-y-auto">

      {/* Presets */}
      <div>
        <div className="flex gap-1 mb-2 overflow-x-auto pb-0.5 ">
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-ui whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-emerald-glow text-deep-void font-bold"
                  : "text-soft-gray hover:text-parchment-light"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          {categoryPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => setTemplate(p.template)}
              className={`w-full flex flex-col gap-2 px-2 py-1.5 rounded-lg border text-left transition-colors group ${
                template === p.template
                  ? "border-emerald-glow/40 bg-emerald-ghost"
                  : "border-warm-wood/40 hover:border-warm-wood hover:bg-warm-wood/20"
              }`}
            >
              <span className="text-2xs font-ui text-soft-gray group-hover:text-parchment-light flex-1">
                {p.label}
              </span>
              {p.template && (
                <code className="text-[10px] font-mono text-soft-gray-dark truncate ">
                  {p.template}
                </code>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-warm-wood/40" />

      {/* Template editor */}
      <div>
        <SectionLabel>Template</SectionLabel>
        <textarea
          rows={3}
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="{hero} finds a {adjective} {item} in {location}."
          className="w-full bg-rich-wood-mid border border-warm-wood rounded-lg px-2.5 py-2 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow resize-none placeholder-soft-gray-dark leading-relaxed"
        />
        <TagReference />
      </div>

      {/* Custom word list */}
      <div>
        <SectionLabel>Custom word list (optional)</SectionLabel>
        <div className="flex gap-1.5 mb-1.5">
          <input
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value.replace(/\s/g, ""))}
            placeholder="tag name"
            className="w-20 bg-rich-wood-mid border border-warm-wood rounded-lg px-2 py-1.5 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
          />
          <code className="text-2xs font-mono text-emerald-glow self-center">
            {customKey ? `{${customKey}}` : "{tag}"}
          </code>
        </div>
        <textarea
          rows={3}
          value={customList}
          onChange={(e) => setCustomList(e.target.value)}
          placeholder={"One item per line:\nMystic Sword\nIron Shield\nDragon Scale"}
          className="w-full bg-rich-wood-mid border border-warm-wood rounded-lg px-2.5 py-2 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow resize-none placeholder-soft-gray-dark "
        />
      </div>

      {/* Seed + Count */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <SectionLabel>Seed</SectionLabel>
          <div className="flex gap-1">
            <input
              type="number"
              value={seed}
              min={0}
              max={99999}
              onChange={(e) => setSeed(Number(e.target.value))}
              className="flex-1 min-w-0 bg-rich-wood-mid border border-warm-wood rounded-lg px-2 py-1.5 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
            />
          </div>
        </div>
        <div>
          <SectionLabel>Count</SectionLabel>
          <input
            type="number"
            value={count}
            min={1}
            max={200}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full bg-rich-wood-mid border border-warm-wood rounded-lg px-2 py-1.5 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
          />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={generate}
        className="w-full py-2.5 rounded-xl bg-emerald-glow text-deep-void text-sm font-display font-bold hover:bg-emerald-bright transition-colors"
      >
        Generate {count} result{count !== 1 ? "s" : ""}
      </button>

      {/* Preview */}
      {generated.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <SectionLabel>Preview</SectionLabel>
            <button
              onClick={() => { setSeed((s) => s + 1); generate(); }}
              className="text-[10px] font-ui text-soft-gray-dark hover:text-parchment-light transition-colors"
            >
              ↺ Reshuffle
            </button>
          </div>
          <PreviewList results={generated} />
        </div>
      )}

      {generated.length > 0 && (
        <>
          <div className="h-px bg-warm-wood/40" />

          {/* Apply target */}
          <div>
            <SectionLabel>Apply to</SectionLabel>
            <div className="space-y-1.5">
              {(["selection", "type", "all"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="applyTarget"
                    value={t}
                    checked={applyTarget === t}
                    onChange={() => setApplyTarget(t)}
                    className="accent-emerald-glow"
                  />
                  <span className="text-2xs font-ui text-parchment-light capitalize">
                    {t === "selection"
                      ? `Selection (${selectionIds.length} component${selectionIds.length !== 1 ? "s" : ""})`
                      : t === "type"
                        ? "By component type"
                        : `All components (${components.length})`}
                  </span>
                </label>
              ))}
            </div>

            {applyTarget === "type" && (
              <select
                value={applyType}
                onChange={(e) => setApplyType(e.target.value as CanvasComp["type"])}
                className="mt-2 w-full bg-rich-wood-mid border border-warm-wood rounded-lg px-2 py-1.5 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
              >
                {(["card", "token", "tile", "die", "pawn", "meeple", "cube", "coin",
                  "marker", "deck", "note", "bag", "standee", "spinner", "track",
                  "sand_timer", "line", "spiral", "hex", "board", "rulebook",
                  "text", "custom"] as CanvasComp["type"][]).map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                    {" "}({components.filter((c) => c.type === t).length})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Apply button */}
          <button
            onClick={apply}
            disabled={targetCount === 0}
            className="w-full py-2 rounded-xl border border-emerald-glow/40 bg-emerald-ghost text-emerald-glow text-2xs font-ui font-bold hover:bg-emerald-glow hover:text-deep-void disabled:opacity-30 disabled:hover:bg-emerald-ghost disabled:hover:text-emerald-glow transition-colors"
          >
            Apply to {targetCount} component{targetCount !== 1 ? "s" : ""}
          </button>

          {appliedCount !== null && (
            <p className="text-center text-[10px] text-emerald-glow font-ui">
              ✓ Applied to {appliedCount} component{appliedCount !== 1 ? "s" : ""}
            </p>
          )}
        </>
      )}
    </div>
  );
}

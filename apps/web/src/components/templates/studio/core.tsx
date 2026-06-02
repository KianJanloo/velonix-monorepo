"use client";

/**
 * Studio core — shared model, constants, helpers and render primitives used by
 * the StudioLayout orchestrator and its panels/dialogs. Kept separate so the
 * editor file stays focused on behaviour rather than a 2000-line monolith.
 */

import type {
  ReactNode,
  PointerEvent as ReactPointerEvent,
  MouseEvent as ReactMouseEvent,
} from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

export const MM_TO_PX = 2;
export const CANVAS_W_MM = 800;
export const CANVAS_H_MM = 600;
export const GRID_MM = 5;

/** Guard against invalid CSS color values (prevents React setValueForStyle crashes). */
export function safeColor(v: string | undefined, fallback: string): string {
  if (!v) return fallback;
  const s = v.trim();
  if (
    s.startsWith("#") ||
    s.startsWith("rgb") ||
    s.startsWith("hsl") ||
    s === "transparent"
  )
    return s;
  return fallback;
}
/** Coerce a possibly-empty/NaN numeric input to a finite number. */
export function safeNum(v: number, fallback = 0): number {
  return Number.isFinite(v) ? v : fallback;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type CompType =
  | "board"
  | "card"
  | "token"
  | "tile"
  | "die"
  | "pawn"
  | "rulebook"
  | "text"
  | "meeple"
  | "cube"
  | "coin"
  | "hex"
  | "marker"
  | "deck"
  | "note";

export interface CanvasComp {
  id: string;
  name: string;
  type: CompType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  quantity: number;
  cornerRadius: number;
  text?: string;
  fontSize?: number;
  textColor?: string;
  image?: string;
  /** When set, this component belongs to a group and moves with its siblings. */
  groupId?: string;
}

// Rendering predicates shared by the editor canvas and previews.
const CIRCLE_TYPES: CompType[] = ["token", "coin", "marker"];
const SILHOUETTE_TYPES: CompType[] = ["pawn", "meeple", "hex"];
export const isCircleType = (t: CompType) => CIRCLE_TYPES.includes(t);
export const isSilhouetteType = (t: CompType) => SILHOUETTE_TYPES.includes(t);
/** Types whose body has no fill/border box (drawn as SVG silhouette or plain text). */
export const isChromeless = (t: CompType) =>
  isSilhouetteType(t) || t === "text";

/** A page is one editable canvas (board, player board, card sheet, …). */
export interface StudioPage {
  id: string;
  name: string;
  width: number; // mm
  height: number; // mm
  components: CanvasComp[];
}

export const PAGE_MIN = 100;
export const PAGE_MAX = 3000;
export const PAGE_SIZE_PRESETS: { label: string; w: number; h: number }[] = [
  { label: "Board", w: 800, h: 600 },
  { label: "Large board", w: 1200, h: 900 },
  { label: "Player board", w: 420, h: 260 },
  { label: "Card sheet", w: 630, h: 880 },
  { label: "Square", w: 700, h: 700 },
];

export type RuleTrigger =
  | "turn_start"
  | "turn_end"
  | "card_played"
  | "token_moved"
  | "dice_rolled"
  | "game_end";

export type RuleActionType =
  | "draw_cards"
  | "gain_points"
  | "lose_points"
  | "move_spaces"
  | "roll_dice"
  | "extra_turn"
  | "skip_turn"
  | "end_game"
  | "custom";

export type RuleTarget = "current" | "each" | "all" | "next";

export interface RuleParams {
  amount?: number;
  target?: RuleTarget;
  value?: string;
}

export interface GameRule {
  id: string;
  trigger: RuleTrigger;
  /** Human-readable summary — also shown on the marketplace "How to play" section. */
  description: string;
  /** Structured action (newer rules). Older rules may only carry `description`. */
  action?: RuleActionType;
  params?: RuleParams;
  enabled?: boolean;
}

export const RULE_TRIGGERS: {
  value: RuleTrigger;
  label: string;
  short: string;
}[] = [
  { value: "turn_start", label: "On turn start", short: "Turn start" },
  { value: "turn_end", label: "On turn end", short: "Turn end" },
  {
    value: "card_played",
    label: "When a card is played",
    short: "Card played",
  },
  { value: "token_moved", label: "When a token moves", short: "Token moved" },
  { value: "dice_rolled", label: "When dice are rolled", short: "Dice rolled" },
  { value: "game_end", label: "Win / end condition", short: "Game end" },
];

export const RULE_TARGETS: {
  value: RuleTarget;
  label: string;
  sentence: string;
}[] = [
  { value: "current", label: "Current player", sentence: "the current player" },
  { value: "each", label: "Each player", sentence: "each player" },
  { value: "all", label: "All players", sentence: "all players" },
  { value: "next", label: "Next player", sentence: "the next player" },
];

interface RuleActionDef {
  type: RuleActionType;
  label: string;
  hasAmount?: boolean;
  amountLabel?: string;
  amountUnit?: string;
  defaultAmount?: number;
  hasTarget?: boolean;
  hasValue?: boolean;
  valuePlaceholder?: string;
  describe: (p: RuleParams) => string;
}

function targetSentence(t: RuleTarget | undefined): string {
  return (
    RULE_TARGETS.find((x) => x.value === t)?.sentence ?? "the current player"
  );
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export const RULE_ACTIONS: RuleActionDef[] = [
  {
    type: "draw_cards",
    label: "Draw cards",
    hasAmount: true,
    amountLabel: "Cards",
    defaultAmount: 1,
    hasTarget: true,
    describe: (p) =>
      `${cap(targetSentence(p.target))} draws ${plural(p.amount ?? 1, "card")}.`,
  },
  {
    type: "gain_points",
    label: "Gain points",
    hasAmount: true,
    amountLabel: "Points",
    defaultAmount: 1,
    hasTarget: true,
    describe: (p) =>
      `${cap(targetSentence(p.target))} gains ${plural(p.amount ?? 1, "point")}.`,
  },
  {
    type: "lose_points",
    label: "Lose points",
    hasAmount: true,
    amountLabel: "Points",
    defaultAmount: 1,
    hasTarget: true,
    describe: (p) =>
      `${cap(targetSentence(p.target))} loses ${plural(p.amount ?? 1, "point")}.`,
  },
  {
    type: "move_spaces",
    label: "Move spaces",
    hasAmount: true,
    amountLabel: "Spaces",
    defaultAmount: 1,
    hasTarget: true,
    describe: (p) =>
      `${cap(targetSentence(p.target))} moves ${plural(p.amount ?? 1, "space")}.`,
  },
  {
    type: "roll_dice",
    label: "Roll dice",
    hasAmount: true,
    amountLabel: "Dice",
    defaultAmount: 1,
    hasTarget: true,
    describe: (p) =>
      `${cap(targetSentence(p.target))} rolls ${(p.amount ?? 1) === 1 ? "1 die" : `${p.amount} dice`}.`,
  },
  {
    type: "extra_turn",
    label: "Take extra turn",
    hasTarget: true,
    describe: (p) => `${cap(targetSentence(p.target))} takes an extra turn.`,
  },
  {
    type: "skip_turn",
    label: "Skip turn",
    hasTarget: true,
    describe: (p) => `${cap(targetSentence(p.target))} skips their turn.`,
  },
  {
    type: "end_game",
    label: "End the game",
    hasValue: true,
    valuePlaceholder: "a player reaches 30 points",
    describe: (p) =>
      `The game ends when ${p.value?.trim() || "a win condition is met"}.`,
  },
  {
    type: "custom",
    label: "Custom effect…",
    hasValue: true,
    valuePlaceholder: "Describe what happens",
    describe: (p) => p.value?.trim() || "Custom effect.",
  },
];

export function ruleActionDef(
  t: RuleActionType | undefined,
): RuleActionDef | undefined {
  return RULE_ACTIONS.find((a) => a.type === t);
}
export function buildRuleDescription(
  action: RuleActionType,
  params: RuleParams,
): string {
  return ruleActionDef(action)?.describe(params) ?? "";
}

export const RULE_TEMPLATES: {
  label: string;
  trigger: RuleTrigger;
  action: RuleActionType;
  params: RuleParams;
}[] = [
  {
    label: "Draw 1 at turn start",
    trigger: "turn_start",
    action: "draw_cards",
    params: { amount: 1, target: "current" },
  },
  {
    label: "Roll to move",
    trigger: "turn_start",
    action: "roll_dice",
    params: { amount: 1, target: "current" },
  },
  {
    label: "Win at 30 points",
    trigger: "game_end",
    action: "end_game",
    params: { value: "a player reaches 30 points" },
  },
];

// ── Rule guide / scenarios ────────────────────────────────────────────────────

export type ScenarioDifficulty = "intro" | "standard" | "advanced";

export interface GameScenario {
  id: string;
  name: string;
  description: string;
  players: string; // e.g. "2" or "2–4"
  difficulty: ScenarioDifficulty;
  winCondition: string;
}

export interface GameGuide {
  objective: string;
  setupSteps: string[];
  turnStructure: string[];
  scenarios: GameScenario[];
}

export const EMPTY_GUIDE: GameGuide = {
  objective: "",
  setupSteps: [],
  turnStructure: [],
  scenarios: [],
};

export const SCENARIO_DIFFICULTY: {
  value: ScenarioDifficulty;
  label: string;
}[] = [
  { value: "intro", label: "Intro" },
  { value: "standard", label: "Standard" },
  { value: "advanced", label: "Advanced" },
];

export const TYPE_DEFAULTS: Record<CompType, Partial<CanvasComp>> = {
  board: {
    width: 320,
    height: 240,
    fill: "#1a2535",
    stroke: "#f5c451",
    strokeWidth: 2,
    cornerRadius: 8,
  },
  card: {
    width: 63,
    height: 88,
    fill: "#1c1a2e",
    stroke: "#7c5cff",
    strokeWidth: 1,
    cornerRadius: 6,
  },
  token: {
    width: 28,
    height: 28,
    fill: "#7c5cff",
    stroke: "#f5c451",
    strokeWidth: 2,
    cornerRadius: 0,
  },
  tile: {
    width: 48,
    height: 48,
    fill: "#1e2a1c",
    stroke: "#7c5cff",
    strokeWidth: 1,
    cornerRadius: 4,
  },
  die: {
    width: 22,
    height: 22,
    fill: "#f5c451",
    stroke: "#0a0a0a",
    strokeWidth: 1,
    cornerRadius: 5,
  },
  pawn: {
    width: 26,
    height: 40,
    fill: "#ff3b5c",
    stroke: "#0a0a0a",
    strokeWidth: 1,
    cornerRadius: 0,
  },
  rulebook: {
    width: 148,
    height: 105,
    fill: "#2a251a",
    stroke: "#f5c451",
    strokeWidth: 1,
    cornerRadius: 3,
  },
  text: {
    width: 120,
    height: 28,
    fill: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    cornerRadius: 0,
    fontSize: 18,
    textColor: "#e8d5b8",
  },
  meeple: {
    width: 30,
    height: 30,
    fill: "#7c5cff",
    stroke: "#0a0a0a",
    strokeWidth: 1,
    cornerRadius: 0,
  },
  cube: {
    width: 16,
    height: 16,
    fill: "#3ddc97",
    stroke: "#0a0a0a",
    strokeWidth: 1,
    cornerRadius: 2,
  },
  coin: {
    width: 24,
    height: 24,
    fill: "#f5c451",
    stroke: "#a8801f",
    strokeWidth: 2,
    cornerRadius: 0,
  },
  hex: {
    width: 52,
    height: 60,
    fill: "#1e2a1c",
    stroke: "#7c5cff",
    strokeWidth: 2,
    cornerRadius: 0,
  },
  marker: {
    width: 18,
    height: 18,
    fill: "#ff3b5c",
    stroke: "#0a0a0a",
    strokeWidth: 1,
    cornerRadius: 0,
  },
  deck: {
    width: 63,
    height: 88,
    fill: "#1c1a2e",
    stroke: "#7c5cff",
    strokeWidth: 1,
    cornerRadius: 6,
  },
  note: {
    width: 64,
    height: 64,
    fill: "#f5e3a1",
    stroke: "#cbb56a",
    strokeWidth: 1,
    cornerRadius: 2,
    textColor: "#3a2f12",
  },
};

export function makeComp(type: CompType, x: number, y: number): CanvasComp {
  const d = TYPE_DEFAULTS[type];
  const labels: Record<CompType, string> = {
    board: "Board",
    card: "Card",
    token: "Token",
    tile: "Tile",
    die: "Die",
    pawn: "Pawn",
    rulebook: "Rulebook",
    text: "Title",
    meeple: "Meeple",
    cube: "Cube",
    coin: "Coin",
    hex: "Hex Tile",
    marker: "Marker",
    deck: "Deck",
    note: "Note",
  };
  return {
    id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: labels[type],
    type,
    x: Math.round(x),
    y: Math.round(y),
    rotation: 0,
    opacity: 100,
    visible: true,
    locked: false,
    quantity: 1,
    fill: "#1a2535",
    stroke: "#f5c451",
    strokeWidth: 1,
    cornerRadius: 4,
    width: 60,
    height: 60,
    ...(type === "text" ? { text: "New Title" } : {}),
    ...(type === "note" ? { text: "Note" } : {}),
    ...d,
  } as CanvasComp;
}

export const INITIAL: CanvasComp[] = [
  makeComp("board", 240, 180),
  { ...makeComp("card", 110, 150), rotation: -6 },
  { ...makeComp("token", 430, 250) },
  { ...makeComp("pawn", 360, 230) },
];

/**
 * Coerce arbitrary (loaded / inserted / synced) component data into safe
 * CanvasComps — guarantees a unique id and finite numeric geometry so the
 * canvas never renders NaN positions and React always has stable keys.
 */
export function normalizeComponents(arr: unknown): CanvasComp[] {
  const list = Array.isArray(arr) ? arr : [];
  return list.map((raw, i) => {
    const c = (raw ?? {}) as Partial<CanvasComp>;
    const type: CompType = c.type && TYPE_DEFAULTS[c.type] ? c.type : "card";
    const base = makeComp(
      type,
      safeNum(c.x as number, 60),
      safeNum(c.y as number, 60),
    );
    return {
      ...base,
      ...c,
      id: c.id || `${type}-${Date.now()}-${i}`,
      type,
      x: safeNum(c.x as number, 60),
      y: safeNum(c.y as number, 60),
      width: Math.max(4, safeNum(c.width as number, base.width)),
      height: Math.max(4, safeNum(c.height as number, base.height)),
      rotation: safeNum(c.rotation as number, 0),
      opacity: safeNum(c.opacity as number, 100),
      strokeWidth: safeNum(c.strokeWidth as number, base.strokeWidth),
      cornerRadius: safeNum(c.cornerRadius as number, base.cornerRadius),
      quantity: Math.max(1, safeNum(c.quantity as number, 1)),
    } as CanvasComp;
  });
}

// ── Icons ───────────────────────────────────────────────────────────────────

export const COMP_ICONS: Record<CompType, ReactNode> = {
  board: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M1 4.5h10M4.5 1v10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  ),
  card: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="2"
        y="0.5"
        width="8"
        height="11"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  token: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  tile: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  die: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="4" cy="4" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  pawn: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3.5 11c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  rulebook: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="0.5"
        width="10"
        height="11"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M3.5 4h5M3.5 6.5h5M3.5 9h3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  ),
  text: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2 3h8M6 3v7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  meeple: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1.5a1.5 1.5 0 011.3 2.2L9.5 5 9 6.5 6.5 6 6 7l1 3.5H5L6 7l-.5-1L3 6.5 2.5 5l2.2-1.3A1.5 1.5 0 016 1.5z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  cube: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="2.5"
        y="2.5"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  coin: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 3.8v4.4M4.8 5h2a1 1 0 010 2H5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  ),
  hex: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1l4.3 2.5v5L6 11 1.7 8.5v-5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  marker: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
    </svg>
  ),
  deck: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="3"
        y="2"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M1.5 3.5v6A1 1 0 002.5 10.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  ),
  note: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M1.5 1.5h9v6L7.5 10.5h-6z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 7.5h-3v3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ── Tools ─────────────────────────────────────────────────────────────────────

export const TOOLS = [
  {
    id: "select" as const,
    label: "Select (V)",
    cursor: "default",
    creates: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 2l4.5 10 1.8-4L13 6 2 2z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "hand" as const,
    label: "Pan (H)",
    cursor: "grab",
    creates: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M5 5.5V3a1 1 0 012 0v2.5m0 0V2.5a1 1 0 012 0V5.5m0 0V3a1 1 0 012 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4V6a1 1 0 012 0v2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "board" as const,
    label: "Board",
    cursor: "crosshair",
    creates: "board" as CompType,
    icon: COMP_ICONS.board,
  },
  {
    id: "card" as const,
    label: "Card",
    cursor: "crosshair",
    creates: "card" as CompType,
    icon: COMP_ICONS.card,
  },
  {
    id: "token" as const,
    label: "Token",
    cursor: "crosshair",
    creates: "token" as CompType,
    icon: COMP_ICONS.token,
  },
  {
    id: "die" as const,
    label: "Die",
    cursor: "crosshair",
    creates: "die" as CompType,
    icon: COMP_ICONS.die,
  },
  {
    id: "pawn" as const,
    label: "Pawn",
    cursor: "crosshair",
    creates: "pawn" as CompType,
    icon: COMP_ICONS.pawn,
  },
  {
    id: "text" as const,
    label: "Title / Text (T)",
    cursor: "text",
    creates: "text" as CompType,
    icon: COMP_ICONS.text,
  },
] as const;

export type ToolId = (typeof TOOLS)[number]["id"];

// ── Shape renderer (used in editor + previews) ────────────────────────────────

export function ShapeInner({ comp }: { comp: CanvasComp }) {
  if (comp.type === "board") {
    return (
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,229,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,0.05) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
          borderRadius: "inherit",
        }}
      />
    );
  }
  if (comp.type === "die") {
    return (
      <div className="absolute inset-[15%] grid grid-cols-2 gap-[10%]">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-full"
            style={{ background: "rgba(10,10,10,0.75)" }}
          />
        ))}
      </div>
    );
  }
  if (comp.type === "rulebook") {
    return (
      <div className="absolute inset-x-[10%] inset-y-[12%] flex flex-col gap-[6%]">
        {[90, 75, 82, 60, 70, 50].map((w, i) => (
          <div
            key={i}
            style={{
              height: 2,
              width: `${w}%`,
              background: "rgba(245,196,81,0.25)",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    );
  }
  if (comp.type === "card" || comp.type === "tile") {
    return (
      <div
        className="absolute inset-[8%] rounded"
        style={{ border: "1px dashed rgba(255,255,255,0.12)" }}
      />
    );
  }
  if (comp.type === "coin") {
    return (
      <div
        className="absolute inset-[14%] rounded-full flex items-center justify-center"
        style={{ border: "1px solid rgba(0,0,0,0.25)" }}
      >
        <span
          style={{
            color: "rgba(0,0,0,0.55)",
            fontWeight: 800,
            fontSize: "60%",
            lineHeight: 1,
          }}
        >
          $
        </span>
      </div>
    );
  }
  if (comp.type === "deck") {
    // Stacked-card edges along the bottom-right to read as a deck.
    return (
      <>
        <div
          className="absolute"
          style={{
            inset: 0,
            transform: "translate(3px,3px)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "inherit",
          }}
        />
        <div
          className="absolute"
          style={{
            inset: 0,
            transform: "translate(1.5px,1.5px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "inherit",
          }}
        />
        <div
          className="absolute inset-[18%] rounded"
          style={{ border: "1px dashed rgba(255,255,255,0.18)" }}
        />
      </>
    );
  }
  if (comp.type === "note") {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-center px-[8%]"
        style={{
          color: comp.textColor ?? "#3a2f12",
          fontSize: 10,
          fontFamily: "var(--font-ui)",
          lineHeight: 1.2,
          overflow: "hidden",
        }}
      >
        {comp.text}
      </div>
    );
  }
  return null;
}

const SILHOUETTE_PATHS: Partial<
  Record<CompType, { viewBox: string; d: string }>
> = {
  pawn: {
    viewBox: "0 0 26 40",
    d: "M13 2c3 0 5.2 2.3 5.2 5.2 0 1.9-1 3.5-2.4 4.5 2.6 1.2 3.6 3.6 3.9 6.3.2 1.6-.9 2.6-2.4 2.6h-1l1.4 12c.2 1.6-1 3-2.6 3h-3.8c-1.6 0-2.8-1.4-2.6-3l1.4-12h-1c-1.5 0-2.6-1-2.4-2.6.3-2.7 1.3-5.1 3.9-6.3-1.4-1-2.4-2.6-2.4-4.5C7.8 4.3 10 2 13 2z",
  },
  meeple: {
    viewBox: "0 0 40 40",
    d: "M20 3a6 6 0 015.4 8.6c3 .8 5 2.3 8.1 4.2 2 1.2 2 4.2-.3 4.9l-7.8 2.4 3 11.1c.5 1.9-.9 3.8-2.9 3.8h-11c-2 0-3.4-1.9-2.9-3.8l3-11.1-7.8-2.4c-2.3-.7-2.3-3.7-.3-4.9 3.1-1.9 5.1-3.4 8.1-4.2A6 6 0 0120 3z",
  },
  hex: { viewBox: "0 0 52 60", d: "M26 1L51 15.5v29L26 59 1 44.5v-29z" },
};

/** Pieces (pawn, meeple, hex) rendered as SVG silhouettes so they read as real shapes. */
export function SilhouetteShape({ comp }: { comp: CanvasComp }) {
  const s = SILHOUETTE_PATHS[comp.type] ?? SILHOUETTE_PATHS.pawn!;
  return (
    <svg
      viewBox={s.viewBox}
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <path
        d={s.d}
        fill={comp.fill}
        stroke={comp.stroke}
        strokeWidth={comp.strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── CompView (editor) ─────────────────────────────────────────────────────────

export interface CompViewProps {
  comp: CanvasComp;
  selected: boolean;
  primary: boolean;
  editable: boolean;
  onPointerDown: (e: ReactPointerEvent, comp: CanvasComp) => void;
  onResizeStart: (
    e: ReactPointerEvent,
    comp: CanvasComp,
    handle: ResizeHandle,
  ) => void;
  onRotateStart: (e: ReactPointerEvent, comp: CanvasComp) => void;
  onTextChange: (id: string, text: string) => void;
  onContextMenu?: (e: ReactMouseEvent, comp: CanvasComp) => void;
}

export type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
const HANDLES: { id: ResizeHandle; cx: number; cy: number; cursor: string }[] =
  [
    { id: "nw", cx: 0, cy: 0, cursor: "nwse-resize" },
    { id: "n", cx: 0.5, cy: 0, cursor: "ns-resize" },
    { id: "ne", cx: 1, cy: 0, cursor: "nesw-resize" },
    { id: "e", cx: 1, cy: 0.5, cursor: "ew-resize" },
    { id: "se", cx: 1, cy: 1, cursor: "nwse-resize" },
    { id: "s", cx: 0.5, cy: 1, cursor: "ns-resize" },
    { id: "sw", cx: 0, cy: 1, cursor: "nesw-resize" },
    { id: "w", cx: 0, cy: 0.5, cursor: "ew-resize" },
  ];

export function CompView({
  comp,
  selected,
  primary,
  editable,
  onPointerDown,
  onResizeStart,
  onRotateStart,
  onTextChange,
  onContextMenu,
}: CompViewProps) {
  const px = (mm: number) => safeNum(mm, 0) * MM_TO_PX;
  const isCircle = isCircleType(comp.type);
  const w = px(comp.width),
    h = px(comp.height);

  return (
    <div
      onPointerDown={(e) => editable && onPointerDown(e, comp)}
      onContextMenu={(e) => onContextMenu?.(e, comp)}
      style={{
        position: "absolute",
        left: px(comp.x),
        top: px(comp.y),
        width: w,
        height: h,
        transform: `rotate(${comp.rotation}deg)`,
        transformOrigin: "center",
        opacity: comp.opacity / 100,
        cursor: comp.locked ? "not-allowed" : editable ? "move" : "default",
        display: comp.visible ? "block" : "none",
      }}
    >
      {/* Body */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: isChromeless(comp.type)
            ? "transparent"
            : safeColor(comp.fill, "#1a2535"),
          backgroundImage: comp.image ? `url("${comp.image}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: isChromeless(comp.type)
            ? "none"
            : `${comp.strokeWidth}px solid ${safeColor(comp.stroke, "transparent")}`,
          borderRadius: isCircle ? "50%" : comp.cornerRadius,
          boxShadow:
            comp.type === "text" || isSilhouetteType(comp.type)
              ? "none"
              : "0 2px 8px rgba(0,0,0,0.45)",
          overflow: comp.type === "deck" ? "visible" : "hidden",
          boxSizing: "border-box",
        }}
      >
        {isSilhouetteType(comp.type) ? (
          <SilhouetteShape comp={comp} />
        ) : !comp.image ? (
          <ShapeInner comp={comp} />
        ) : null}
      </div>

      {/* Text content */}
      {comp.type === "text" &&
        (selected && editable && primary ? (
          <input
            value={comp.text ?? ""}
            onChange={(e) => onTextChange(comp.id, e.target.value)}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-transparent text-center outline-none"
            style={{
              color: comp.textColor ?? "#e8d5b8",
              fontSize: px(comp.fontSize ?? 18) / 1.6,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-center"
            style={{
              color: comp.textColor ?? "#e8d5b8",
              fontSize: px(comp.fontSize ?? 18) / 1.6,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
            }}
          >
            {comp.text}
          </div>
        ))}

      {/* Selection outline (all selected, incl. group members) */}
      {selected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            outline: `1.5px ${primary ? "solid" : "dashed"} #7c5cff`,
            outlineOffset: 1,
          }}
        />
      )}

      {/* Resize / rotate handles — only on the primary selection */}
      {selected && editable && primary && (
        <>
          {/* Resize handles */}
          {HANDLES.map((hd) => (
            <div
              key={hd.id}
              onPointerDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, comp, hd.id);
              }}
              style={{
                position: "absolute",
                left: `calc(${hd.cx * 100}% - 4px)`,
                top: `calc(${hd.cy * 100}% - 4px)`,
                width: 8,
                height: 8,
                background: "#7c5cff",
                border: "1.5px solid #0a0a0a",
                borderRadius: 1,
                cursor: hd.cursor,
                zIndex: 20,
              }}
            />
          ))}
          {/* Rotate handle */}
          <div
            onPointerDown={(e) => {
              e.stopPropagation();
              onRotateStart(e, comp);
            }}
            style={{
              position: "absolute",
              left: "calc(50% - 5px)",
              top: -22,
              width: 10,
              height: 10,
              background: "#f5c451",
              border: "1.5px solid #0a0a0a",
              borderRadius: "50%",
              cursor: "grab",
              zIndex: 20,
            }}
            title="Rotate"
          />
          <div
            className="absolute pointer-events-none"
            style={{
              left: "50%",
              top: -12,
              width: 1,
              height: 12,
              background: "#f5c451",
            }}
          />
        </>
      )}
    </div>
  );
}

// ── Previews ──────────────────────────────────────────────────────────────────

export function Preview2D({
  components,
  scale,
  width = CANVAS_W_MM,
  height = CANVAS_H_MM,
}: {
  components: CanvasComp[];
  scale: number;
  width?: number;
  height?: number;
}) {
  const px = (mm: number) => mm * MM_TO_PX * scale;
  return (
    <div
      style={{
        position: "relative",
        width: px(width),
        height: px(height),
        backgroundColor: "#0f1012",
        border: "1px solid rgba(58,42,31,0.6)",
        borderRadius: 4,
      }}
    >
      {components
        .filter((c) => c.visible)
        .map((c) => {
          const isCircle = isCircleType(c.type);
          return (
            <div
              key={c.id}
              style={{
                position: "absolute",
                left: px(c.x),
                top: px(c.y),
                width: px(c.width),
                height: px(c.height),
                transform: `rotate(${c.rotation}deg)`,
                opacity: c.opacity / 100,
                backgroundColor: isChromeless(c.type)
                  ? "transparent"
                  : safeColor(c.fill, "#1a2535"),
                backgroundImage: c.image ? `url("${c.image}")` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                border: isChromeless(c.type)
                  ? "none"
                  : `${c.strokeWidth}px solid ${safeColor(c.stroke, "transparent")}`,
                borderRadius: isCircle ? "50%" : c.cornerRadius * scale,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.textColor,
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: px(c.fontSize ?? 18) / 1.6,
                overflow: "hidden",
              }}
            >
              {isSilhouetteType(c.type) ? (
                <SilhouetteShape comp={c} />
              ) : c.type === "text" ? (
                c.text
              ) : !c.image ? (
                <ShapeInner comp={c} />
              ) : null}
            </div>
          );
        })}
    </div>
  );
}

/** CSS 3D preview — each component gets real depth/extrusion. */
export function Preview3D({
  components,
  width = CANVAS_W_MM,
  height = CANVAS_H_MM,
}: {
  components: CanvasComp[];
  width?: number;
  height?: number;
}) {
  const s = 0.7;
  const px = (mm: number) => mm * MM_TO_PX * s;
  const depthFor = (t: CompType) =>
    t === "token" || t === "coin" || t === "marker"
      ? 10
      : t === "die" || t === "cube"
        ? 16
        : t === "pawn" || t === "meeple"
          ? 22
          : t === "card"
            ? 4
            : t === "deck"
              ? 14
              : t === "board"
                ? 3
                : t === "hex"
                  ? 8
                  : 6;
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ perspective: "1400px" }}
    >
      <div
        style={{
          position: "relative",
          width: px(width),
          height: px(height),
          transform: "rotateX(55deg) rotateZ(0deg)",
          transformStyle: "preserve-3d",
        }}
      >
        {/* table */}
        <div
          style={{
            position: "absolute",
            inset: -60,
            background: "radial-gradient(ellipse at center,#241a12,#140e09)",
            transform: "translateZ(-6px)",
            borderRadius: 8,
            boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
          }}
        />
        {components
          .filter((c) => c.visible)
          .map((c) => {
            const depth = depthFor(c.type) * s;
            const isCircle = isCircleType(c.type);
            const w = px(c.width),
              h = px(c.height);
            return (
              <div
                key={c.id}
                style={{
                  position: "absolute",
                  left: px(c.x),
                  top: px(c.y),
                  width: w,
                  height: h,
                  transformStyle: "preserve-3d",
                  transform: `rotate(${c.rotation}deg)`,
                  opacity: c.opacity / 100,
                }}
              >
                {/* top face */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateZ(${depth}px)`,
                    backgroundColor: isChromeless(c.type)
                      ? "transparent"
                      : c.fill,
                    border: isChromeless(c.type)
                      ? "none"
                      : `${c.strokeWidth}px solid ${c.stroke}`,
                    borderRadius: isCircle ? "50%" : c.cornerRadius,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: c.textColor,
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: (c.fontSize ?? 18) * s,
                    overflow: "hidden",
                  }}
                >
                  {isSilhouetteType(c.type) ? (
                    <SilhouetteShape comp={c} />
                  ) : c.type === "text" ? (
                    c.text
                  ) : !c.image ? (
                    <ShapeInner comp={c} />
                  ) : null}
                </div>
                {/* side walls (extrusion) — simple shadow box */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    transform: `translateZ(${depth / 2}px)`,
                    backgroundColor: isChromeless(c.type)
                      ? "transparent"
                      : c.fill,
                    filter: "brightness(0.6)",
                    borderRadius: isCircle ? "50%" : c.cornerRadius,
                    boxShadow: `0 ${depth}px ${depth}px rgba(0,0,0,0.5)`,
                  }}
                />
              </div>
            );
          })}
      </div>
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

export type MenuItem =
  | { type: "sep" }
  | {
      type: "item";
      label: string;
      shortcut?: string;
      danger?: boolean;
      disabled?: boolean;
      onClick: () => void;
    };

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}) {
  const W = 184;
  const approxH = items.reduce((h, it) => h + (it.type === "sep" ? 9 : 28), 8);
  const vw = typeof window !== "undefined" ? window.innerWidth : 9999;
  const vh = typeof window !== "undefined" ? window.innerHeight : 9999;
  const left = Math.min(x, vw - W - 8);
  const top = Math.min(y, Math.max(8, vh - approxH - 8));
  return (
    <div
      className="fixed inset-0 z-[55]"
      onPointerDown={onClose}
      onWheel={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="fixed z-[56] bg-rich-wood-dark border border-warm-wood rounded-lg shadow-2xl py-1"
        style={{ left, top, width: W }}
        onPointerDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {items.map((it, i) =>
          it.type === "sep" ? (
            <div key={i} className="h-px bg-warm-wood my-1" />
          ) : (
            <button
              key={i}
              disabled={it.disabled}
              onClick={() => {
                it.onClick();
                onClose();
              }}
              className={`w-full flex items-center justify-between gap-6 px-3 py-1.5 text-2xs font-ui text-left transition-colors disabled:opacity-30 disabled:cursor-default ${it.danger ? "text-crimson-flame hover:bg-crimson-flame/10" : "text-parchment-light hover:bg-warm-wood"}`}
            >
              <span>{it.label}</span>
              {it.shortcut && (
                <span className="text-soft-gray-dark font-mono">
                  {it.shortcut}
                </span>
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

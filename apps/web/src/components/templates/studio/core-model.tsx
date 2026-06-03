"use client";


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


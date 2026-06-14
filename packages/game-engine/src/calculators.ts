/**
 * @velonix/game-engine — Calculators
 * Pure functions for pricing, commission, and grid math.
 */

import type { SubscriptionTier, CurrencyAmount, Percentage, GameComplexity } from "@velonix/types";
import { SUBSCRIPTION_LIMITS } from "@velonix/types";

// ---------------------------------------------------------------------------
// PRICING & COMMISSION
// ---------------------------------------------------------------------------

/**
 * Calculates how much the creator earns and how much Velonix keeps
 * for a given sale price, based on the creator's subscription tier.
 *
 * @example
 * calculateCommission(999, "pro")
 * // => { salePrice: 999, platformFee: 170, creatorEarnings: 829, commissionRate: 17 }
 */
export function calculateCommission(
  salePriceUsd: CurrencyAmount,
  creatorTier: SubscriptionTier
): {
  salePrice: CurrencyAmount;
  platformFee: CurrencyAmount;
  creatorEarnings: CurrencyAmount;
  commissionRate: Percentage;
} {
  const commissionRate = SUBSCRIPTION_LIMITS[creatorTier].commissionRate;
  const platformFee = Math.ceil((salePriceUsd * commissionRate) / 100);
  const creatorEarnings = salePriceUsd - platformFee;

  return {
    salePrice: salePriceUsd,
    platformFee,
    creatorEarnings,
    commissionRate,
  };
}

/**
 * Bundle discount tiers — the more paid components a buyer bundles, the bigger
 * the discount. Shared by the API (authoritative pricing) and the bundle builder
 * UI (live estimate). Returns a percentage (0–100).
 */
export function bundleDiscountRate(itemCount: number): Percentage {
  if (itemCount >= 5) return 20;
  if (itemCount >= 3) return 12;
  if (itemCount >= 2) return 7;
  return 0;
}

/** Applies the bundle discount to a subtotal, returning cents. */
export function calculateBundlePricing(
  itemPricesUsd: CurrencyAmount[],
): { subtotal: CurrencyAmount; discount: CurrencyAmount; total: CurrencyAmount; rate: Percentage } {
  const subtotal = itemPricesUsd.reduce((s, p) => s + p, 0);
  const rate = bundleDiscountRate(itemPricesUsd.length);
  const discount = Math.round((subtotal * rate) / 100);
  return { subtotal, discount, total: subtotal - discount, rate };
}

/**
 * Calculates the monthly potential earnings for display on the pricing page.
 */
export function projectMonthlyEarnings(
  pricePerGameUsd: CurrencyAmount,
  estimatedSalesPerMonth: number,
  tier: SubscriptionTier
): {
  grossRevenue: CurrencyAmount;
  netRevenue: CurrencyAmount;
  platformFees: CurrencyAmount;
} {
  const gross = pricePerGameUsd * estimatedSalesPerMonth;
  const { platformFee } = calculateCommission(pricePerGameUsd, tier);
  const totalFees = platformFee * estimatedSalesPerMonth;

  return {
    grossRevenue: gross,
    netRevenue: gross - totalFees,
    platformFees: totalFees,
  };
}

// ---------------------------------------------------------------------------
// SMART PRICING SUGGESTION
// ---------------------------------------------------------------------------

/**
 * Baseline anchor price (USD cents) for each complexity tier. Used when there
 * aren't enough comparable published games to derive a market price from, and
 * blended with market data when there are.
 */
export const COMPLEXITY_PRICE_ANCHORS: Record<GameComplexity, CurrencyAmount> = {
  light: 299,
  medium: 599,
  medium_heavy: 899,
  heavy: 1299,
};

/** A comparable already-published, paid game used to inform a suggestion. */
export interface PriceComparable {
  priceUsd: CurrencyAmount; // cents, > 0
  complexity: GameComplexity;
  sameCategory: boolean;
}

export interface PriceSuggestion {
  /** Recommended price in USD cents. */
  suggestedUsd: CurrencyAmount;
  /** Sensible low/high bounds in USD cents to frame the decision. */
  rangeUsd: { min: CurrencyAmount; max: CurrencyAmount };
  /** Median price of the comparables used (cents), or null if none. */
  marketMedianUsd: CurrencyAmount | null;
  /** How many published games informed this suggestion. */
  sampleSize: number;
  /** "market" = driven by comparables, "baseline" = complexity anchor only. */
  basis: "market" | "baseline";
  /** Short human-readable explanation lines for the UI. */
  rationale: string[];
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
    : (sorted[mid] ?? 0);
}

/** Round a price to the nearest "psychological" .99 ending, min $0.99. */
function roundToCharm(cents: number): CurrencyAmount {
  const dollars = Math.max(1, Math.round(cents / 100));
  return dollars * 100 - 1;
}

/**
 * Suggests a price for a game based on its complexity and the prices of
 * similar already-published games.
 *
 * Strategy:
 *  - Prefer comparables of the same complexity; otherwise use the category set.
 *  - Blend the market median with the complexity anchor (more market weight as
 *    the sample grows) so early/empty markets fall back to a sane baseline.
 *  - Returns a charm-priced suggestion plus a low/high range and rationale.
 */
export function suggestGamePrice(
  complexity: GameComplexity,
  comparables: PriceComparable[]
): PriceSuggestion {
  const anchor = COMPLEXITY_PRICE_ANCHORS[complexity];
  const priced = comparables.filter((c) => c.priceUsd > 0);

  // Prefer same-complexity comps; fall back to same-category comps.
  const sameComplexity = priced.filter((c) => c.complexity === complexity);
  const pool = sameComplexity.length >= 3 ? sameComplexity : priced;

  if (pool.length === 0) {
    return {
      suggestedUsd: anchor,
      rangeUsd: { min: roundToCharm(anchor * 0.7), max: roundToCharm(anchor * 1.4) },
      marketMedianUsd: null,
      sampleSize: 0,
      basis: "baseline",
      rationale: [
        `No comparable paid ${complexity.replace("_", " ")} games yet — using a baseline for this complexity.`,
      ],
    };
  }

  const prices = pool.map((c) => c.priceUsd);
  const marketMedian = median(prices);

  // Market weight grows with sample size, capped at 0.8 (always keep some anchor pull).
  const marketWeight = Math.min(0.8, pool.length / 10);
  const blended = marketMedian * marketWeight + anchor * (1 - marketWeight);
  const suggested = roundToCharm(blended);

  const lo = Math.min(...prices);
  const hi = Math.max(...prices);

  return {
    suggestedUsd: suggested,
    rangeUsd: {
      min: roundToCharm(Math.min(lo, suggested * 0.75)),
      max: roundToCharm(Math.max(hi, suggested * 1.25)),
    },
    marketMedianUsd: marketMedian,
    sampleSize: pool.length,
    basis: "market",
    rationale: [
      `Based on ${pool.length} similar published ${
        pool === sameComplexity ? complexity.replace("_", " ") + " " : ""
      }game${pool.length === 1 ? "" : "s"}.`,
      `Market median is $${(marketMedian / 100).toFixed(2)}; blended with the ${complexity.replace(
        "_",
        " "
      )} complexity baseline of $${(anchor / 100).toFixed(2)}.`,
    ],
  };
}

// ---------------------------------------------------------------------------
// GRID LAYOUTS
// ---------------------------------------------------------------------------

export type GridCell = {
  x: number;
  y: number;
  row: number;
  col: number;
};

/**
 * Generates pixel coordinates for a rectangular grid.
 * Used to position components on the board canvas.
 */
export function generateSquareGrid(
  cols: number,
  rows: number,
  cellSizePx: number,
  offsetX = 0,
  offsetY = 0
): GridCell[] {
  const cells: GridCell[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      cells.push({
        x: offsetX + col * cellSizePx,
        y: offsetY + row * cellSizePx,
        row,
        col,
      });
    }
  }

  return cells;
}

export type HexCell = {
  x: number;
  y: number;
  q: number; // axial coordinate
  r: number; // axial coordinate
};

/**
 * Generates pixel coordinates for a flat-top hexagonal grid.
 * Uses axial coordinates (q, r).
 */
export function generateHexGrid(
  radius: number,        // grid radius in hex cells
  hexSizePx: number,     // center-to-vertex distance in pixels
  offsetX = 0,
  offsetY = 0
): HexCell[] {
  const cells: HexCell[] = [];
  const w = Math.sqrt(3) * hexSizePx;
  const h = 2 * hexSizePx;

  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      const x = offsetX + w * (q + r / 2);
      const y = offsetY + h * (3 / 4) * r;
      cells.push({ x, y, q, r });
    }
  }

  return cells;
}

// ---------------------------------------------------------------------------
// CARD LAYOUT
// ---------------------------------------------------------------------------

export const STANDARD_CARD_SIZES = {
  /** Standard playing card: 63mm × 88mm */
  poker: { width: 63, height: 88 },
  /** Mini card: 44mm × 68mm */
  mini: { width: 44, height: 68 },
  /** Tarot / large: 70mm × 120mm */
  tarot: { width: 70, height: 120 },
  /** Square: 63mm × 63mm */
  square: { width: 63, height: 63 },
  /** Dominion / Dominoes: 44mm × 44mm */
  tile: { width: 44, height: 44 },
} as const;

export type CardSize = keyof typeof STANDARD_CARD_SIZES;

/**
 * Converts mm measurements to px at the given DPI.
 */
export function mmToPx(mm: number, dpi = 96): number {
  return (mm / 25.4) * dpi;
}

export function pxToMm(px: number, dpi = 96): number {
  return (px / dpi) * 25.4;
}

// ---------------------------------------------------------------------------
// SEMANTIC VERSION UTILS
// ---------------------------------------------------------------------------

export function bumpPatch(version: string): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3) return version;
  return `${parts[0]}.${parts[1]}.${(parts[2] ?? 0) + 1}`;
}

export function bumpMinor(version: string): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3) return version;
  return `${parts[0]}.${(parts[1] ?? 0) + 1}.0`;
}

export function bumpMajor(version: string): string {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3) return version;
  return `${(parts[0] ?? 0) + 1}.0.0`;
}

// ---------------------------------------------------------------------------
// RULE ENGINE — Condition evaluator & Action executor
// ---------------------------------------------------------------------------

import type {
  RuleCondition,
  // RuleConditionSubject,
  RuleConditionOperator,
  RuleAction,
  RuleActionType,
  RuleTarget,
  GameRule,
} from "@velonix/types";

// ── Game context (read by conditions) ────────────────────────────────────────

export interface RuleGameContext {
  /** Current player's score. */
  score: number;
  /** Current round number (1-based). */
  round: number;
  /** Total turns taken since game start. */
  turnCount: number;
  /** Most recent dice roll result. */
  diceResult: number;
  /** Number of active (non-eliminated) players. */
  playerCount: number;
  /** Current player's card count. */
  cardCount: number;
  /** Named counters (arbitrary key-value). */
  counters: Record<string, number>;
}

// ── Condition evaluation ──────────────────────────────────────────────────────

function readSubject(ctx: RuleGameContext, c: RuleCondition): number {
  switch (c.subject) {
    case "score":        return ctx.score;
    case "round":        return ctx.round;
    case "turn_count":   return ctx.turnCount;
    case "dice_result":  return ctx.diceResult;
    case "player_count": return ctx.playerCount;
    case "card_count":   return ctx.cardCount;
    case "counter":      return ctx.counters[c.counterKey ?? ""] ?? 0;
    default:             return 0;
  }
}

function applyOperator(
  lhs: number,
  op: RuleConditionOperator,
  rhs: number,
  rhs2?: number,
): boolean {
  switch (op) {
    case "eq":            return lhs === rhs;
    case "neq":           return lhs !== rhs;
    case "gt":            return lhs > rhs;
    case "gte":           return lhs >= rhs;
    case "lt":            return lhs < rhs;
    case "lte":           return lhs <= rhs;
    case "between":       return lhs >= rhs && lhs <= (rhs2 ?? rhs);
    case "is_multiple_of": return rhs !== 0 && lhs % rhs === 0;
    default:              return false;
  }
}

/**
 * Evaluates a single RuleCondition against the provided game context.
 * Returns `true` if the condition passes (after applying optional negation).
 */
export function evaluateCondition(
  condition: RuleCondition,
  ctx: RuleGameContext,
): boolean {
  const lhs = readSubject(ctx, condition);
  const result = applyOperator(lhs, condition.operator, condition.value, condition.value2);
  return condition.negate ? !result : result;
}

/**
 * Evaluates ALL conditions for a rule (AND logic).
 * Returns `true` if the rule should fire (all conditions pass, or no conditions set).
 */
export function evaluateRuleConditions(
  rule: GameRule,
  ctx: RuleGameContext,
): boolean {
  if (!rule.conditions || rule.conditions.length === 0) return true;
  return rule.conditions.every((c: any) => evaluateCondition(c, ctx));
}

// ── Action result ─────────────────────────────────────────────────────────────

export interface RuleActionResult {
  type: RuleActionType;
  target: RuleTarget;
  /** For point/space/counter actions. */
  amount?: number;
  /** For navigate_page. */
  pageId?: string;
  /** For set_counter / flip_component. */
  key?: string;
  /** For custom / end_game. */
  message?: string;
  /** Roll result when type=roll_dice. */
  roll?: number;
}

/**
 * Executes a single RuleAction and returns a structured result describing
 * what happened. Pure function — callers apply the result to their own state.
 */
export function executeRuleAction(action: RuleAction): RuleActionResult {
  const target = action.target ?? "current";
  const amount = action.amount ?? 1;

  switch (action.type) {
    case "draw_cards":
      return { type: "draw_cards", target, amount };

    case "gain_points":
      return { type: "gain_points", target, amount };

    case "lose_points":
      return { type: "lose_points", target, amount: -Math.abs(amount) };

    case "move_spaces":
      return { type: "move_spaces", target, amount };

    case "roll_dice": {
      const sides = Math.max(2, amount);
      const roll = 1 + Math.floor(Math.random() * sides);
      return { type: "roll_dice", target, amount: sides, roll };
    }

    case "extra_turn":
      return { type: "extra_turn", target };

    case "skip_turn":
      return { type: "skip_turn", target };

    case "end_game":
      return { type: "end_game", target: "all", message: action.value ?? "Game over." };

    case "set_counter":
      return { type: "set_counter", target, amount, key: action.counterKey ?? action.value ?? "counter" };

    case "flip_component":
      return { type: "flip_component", target: "all", key: action.value ?? "" };

    case "navigate_page":
      return { type: "navigate_page", target: "all", pageId: action.pageId ?? action.value ?? "" };

    case "eliminate_player":
      return { type: "eliminate_player", target };

    case "shuffle_deck":
      return { type: "shuffle_deck", target: "all", key: action.value ?? "deck" };

    case "custom":
      return { type: "custom", target, message: action.value ?? "Custom effect." };

    default:
      return { type: "custom", target, message: "Unknown action." };
  }
}

/**
 * Evaluates all actions for a rule and returns the full list of results.
 * Also handles the legacy single-action format for backward compatibility.
 */
export function executeRuleActions(rule: GameRule): RuleActionResult[] {
  // New structured actions array
  if (rule.actions && rule.actions.length > 0) {
    return rule.actions.map(executeRuleAction);
  }

  // Legacy single action fallback
  if (rule.action) {
    const legacyAction: RuleAction = {
      id: `legacy-${rule.id}`,
      type: rule.action,
      target: rule.params?.target ?? "current",
      amount: rule.params?.amount ?? 1,
      value: rule.params?.value,
    };
    return [executeRuleAction(legacyAction)];
  }

  return [];
}

/**
 * Full rule evaluation pipeline: checks enabled → evaluates conditions → executes actions.
 * Returns null if the rule does not fire, or the action results if it does.
 */
export function processRule(
  rule: GameRule,
  ctx: RuleGameContext,
): RuleActionResult[] | null {
  if (rule.enabled === false) return null;
  if (!evaluateRuleConditions(rule, ctx)) return null;
  return executeRuleActions(rule);
}

/**
 * Process all rules for a given trigger, sorted by priority (lower = first).
 * Returns a flat list of all action results from rules that fired.
 */
export function processTrigger(
  rules: GameRule[],
  trigger: GameRule["trigger"],
  ctx: RuleGameContext,
): RuleActionResult[] {
  return rules
    .filter((r) => r.trigger === trigger && r.enabled !== false)
    .sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50))
    .flatMap((r) => processRule(r, ctx) ?? []);
}

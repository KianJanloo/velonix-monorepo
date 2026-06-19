"use strict";
/**
 * @velonix/game-engine — Calculators
 * Pure functions for pricing, commission, and grid math.
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_CARD_SIZES = exports.COMPLEXITY_PRICE_ANCHORS = void 0;
exports.calculateCommission = calculateCommission;
exports.bundleDiscountRate = bundleDiscountRate;
exports.calculateBundlePricing = calculateBundlePricing;
exports.projectMonthlyEarnings = projectMonthlyEarnings;
exports.suggestGamePrice = suggestGamePrice;
exports.generateSquareGrid = generateSquareGrid;
exports.generateHexGrid = generateHexGrid;
exports.mmToPx = mmToPx;
exports.pxToMm = pxToMm;
exports.bumpPatch = bumpPatch;
exports.bumpMinor = bumpMinor;
exports.bumpMajor = bumpMajor;
exports.evaluateCondition = evaluateCondition;
exports.evaluateRuleConditions = evaluateRuleConditions;
exports.executeRuleAction = executeRuleAction;
exports.executeRuleActions = executeRuleActions;
exports.processRule = processRule;
exports.processTrigger = processTrigger;
var types_1 = require("@velonix/types");
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
function calculateCommission(salePriceUsd, creatorTier) {
    var commissionRate = types_1.SUBSCRIPTION_LIMITS[creatorTier].commissionRate;
    var platformFee = Math.ceil((salePriceUsd * commissionRate) / 100);
    var creatorEarnings = salePriceUsd - platformFee;
    return {
        salePrice: salePriceUsd,
        platformFee: platformFee,
        creatorEarnings: creatorEarnings,
        commissionRate: commissionRate,
    };
}
/**
 * Bundle discount tiers — the more paid components a buyer bundles, the bigger
 * the discount. Shared by the API (authoritative pricing) and the bundle builder
 * UI (live estimate). Returns a percentage (0–100).
 */
function bundleDiscountRate(itemCount) {
    if (itemCount >= 5)
        return 20;
    if (itemCount >= 3)
        return 12;
    if (itemCount >= 2)
        return 7;
    return 0;
}
/** Applies the bundle discount to a subtotal, returning cents. */
function calculateBundlePricing(itemPricesUsd) {
    var subtotal = itemPricesUsd.reduce(function (s, p) { return s + p; }, 0);
    var rate = bundleDiscountRate(itemPricesUsd.length);
    var discount = Math.round((subtotal * rate) / 100);
    return { subtotal: subtotal, discount: discount, total: subtotal - discount, rate: rate };
}
/**
 * Calculates the monthly potential earnings for display on the pricing page.
 */
function projectMonthlyEarnings(pricePerGameUsd, estimatedSalesPerMonth, tier) {
    var gross = pricePerGameUsd * estimatedSalesPerMonth;
    var platformFee = calculateCommission(pricePerGameUsd, tier).platformFee;
    var totalFees = platformFee * estimatedSalesPerMonth;
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
exports.COMPLEXITY_PRICE_ANCHORS = {
    light: 299,
    medium: 599,
    medium_heavy: 899,
    heavy: 1299,
};
function median(values) {
    var _a, _b, _c;
    var sorted = __spreadArray([], values, true).sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? Math.round((((_a = sorted[mid - 1]) !== null && _a !== void 0 ? _a : 0) + ((_b = sorted[mid]) !== null && _b !== void 0 ? _b : 0)) / 2)
        : ((_c = sorted[mid]) !== null && _c !== void 0 ? _c : 0);
}
/** Round a price to the nearest "psychological" .99 ending, min $0.99. */
function roundToCharm(cents) {
    var dollars = Math.max(1, Math.round(cents / 100));
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
function suggestGamePrice(complexity, comparables) {
    var anchor = exports.COMPLEXITY_PRICE_ANCHORS[complexity];
    var priced = comparables.filter(function (c) { return c.priceUsd > 0; });
    // Prefer same-complexity comps; fall back to same-category comps.
    var sameComplexity = priced.filter(function (c) { return c.complexity === complexity; });
    var pool = sameComplexity.length >= 3 ? sameComplexity : priced;
    if (pool.length === 0) {
        return {
            suggestedUsd: anchor,
            rangeUsd: { min: roundToCharm(anchor * 0.7), max: roundToCharm(anchor * 1.4) },
            marketMedianUsd: null,
            sampleSize: 0,
            basis: "baseline",
            rationale: [
                "No comparable paid ".concat(complexity.replace("_", " "), " games yet \u2014 using a baseline for this complexity."),
            ],
        };
    }
    var prices = pool.map(function (c) { return c.priceUsd; });
    var marketMedian = median(prices);
    // Market weight grows with sample size, capped at 0.8 (always keep some anchor pull).
    var marketWeight = Math.min(0.8, pool.length / 10);
    var blended = marketMedian * marketWeight + anchor * (1 - marketWeight);
    var suggested = roundToCharm(blended);
    var lo = Math.min.apply(Math, prices);
    var hi = Math.max.apply(Math, prices);
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
            "Based on ".concat(pool.length, " similar published ").concat(pool === sameComplexity ? complexity.replace("_", " ") + " " : "", "game").concat(pool.length === 1 ? "" : "s", "."),
            "Market median is $".concat((marketMedian / 100).toFixed(2), "; blended with the ").concat(complexity.replace("_", " "), " complexity baseline of $").concat((anchor / 100).toFixed(2), "."),
        ],
    };
}
/**
 * Generates pixel coordinates for a rectangular grid.
 * Used to position components on the board canvas.
 */
function generateSquareGrid(cols, rows, cellSizePx, offsetX, offsetY) {
    if (offsetX === void 0) { offsetX = 0; }
    if (offsetY === void 0) { offsetY = 0; }
    var cells = [];
    for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
            cells.push({
                x: offsetX + col * cellSizePx,
                y: offsetY + row * cellSizePx,
                row: row,
                col: col,
            });
        }
    }
    return cells;
}
/**
 * Generates pixel coordinates for a flat-top hexagonal grid.
 * Uses axial coordinates (q, r).
 */
function generateHexGrid(radius, // grid radius in hex cells
hexSizePx, // center-to-vertex distance in pixels
offsetX, offsetY) {
    if (offsetX === void 0) { offsetX = 0; }
    if (offsetY === void 0) { offsetY = 0; }
    var cells = [];
    var w = Math.sqrt(3) * hexSizePx;
    var h = 2 * hexSizePx;
    for (var q = -radius; q <= radius; q++) {
        var r1 = Math.max(-radius, -q - radius);
        var r2 = Math.min(radius, -q + radius);
        for (var r = r1; r <= r2; r++) {
            var x = offsetX + w * (q + r / 2);
            var y = offsetY + h * (3 / 4) * r;
            cells.push({ x: x, y: y, q: q, r: r });
        }
    }
    return cells;
}
// ---------------------------------------------------------------------------
// CARD LAYOUT
// ---------------------------------------------------------------------------
exports.STANDARD_CARD_SIZES = {
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
};
/**
 * Converts mm measurements to px at the given DPI.
 */
function mmToPx(mm, dpi) {
    if (dpi === void 0) { dpi = 96; }
    return (mm / 25.4) * dpi;
}
function pxToMm(px, dpi) {
    if (dpi === void 0) { dpi = 96; }
    return (px / dpi) * 25.4;
}
// ---------------------------------------------------------------------------
// SEMANTIC VERSION UTILS
// ---------------------------------------------------------------------------
function bumpPatch(version) {
    var _a;
    var parts = version.split(".").map(Number);
    if (parts.length !== 3)
        return version;
    return "".concat(parts[0], ".").concat(parts[1], ".").concat(((_a = parts[2]) !== null && _a !== void 0 ? _a : 0) + 1);
}
function bumpMinor(version) {
    var _a;
    var parts = version.split(".").map(Number);
    if (parts.length !== 3)
        return version;
    return "".concat(parts[0], ".").concat(((_a = parts[1]) !== null && _a !== void 0 ? _a : 0) + 1, ".0");
}
function bumpMajor(version) {
    var _a;
    var parts = version.split(".").map(Number);
    if (parts.length !== 3)
        return version;
    return "".concat(((_a = parts[0]) !== null && _a !== void 0 ? _a : 0) + 1, ".0.0");
}
// ── Condition evaluation ──────────────────────────────────────────────────────
function readSubject(ctx, c) {
    var _a, _b;
    switch (c.subject) {
        case "score": return ctx.score;
        case "round": return ctx.round;
        case "turn_count": return ctx.turnCount;
        case "dice_result": return ctx.diceResult;
        case "player_count": return ctx.playerCount;
        case "card_count": return ctx.cardCount;
        case "counter": return (_b = ctx.counters[(_a = c.counterKey) !== null && _a !== void 0 ? _a : ""]) !== null && _b !== void 0 ? _b : 0;
        default: return 0;
    }
}
function applyOperator(lhs, op, rhs, rhs2) {
    switch (op) {
        case "eq": return lhs === rhs;
        case "neq": return lhs !== rhs;
        case "gt": return lhs > rhs;
        case "gte": return lhs >= rhs;
        case "lt": return lhs < rhs;
        case "lte": return lhs <= rhs;
        case "between": return lhs >= rhs && lhs <= (rhs2 !== null && rhs2 !== void 0 ? rhs2 : rhs);
        case "is_multiple_of": return rhs !== 0 && lhs % rhs === 0;
        default: return false;
    }
}
/**
 * Evaluates a single RuleCondition against the provided game context.
 * Returns `true` if the condition passes (after applying optional negation).
 */
function evaluateCondition(condition, ctx) {
    var lhs = readSubject(ctx, condition);
    var result = applyOperator(lhs, condition.operator, condition.value, condition.value2);
    return condition.negate ? !result : result;
}
/**
 * Evaluates ALL conditions for a rule (AND logic).
 * Returns `true` if the rule should fire (all conditions pass, or no conditions set).
 */
function evaluateRuleConditions(rule, ctx) {
    if (!rule.conditions || rule.conditions.length === 0)
        return true;
    return rule.conditions.every(function (c) { return evaluateCondition(c, ctx); });
}
/**
 * Executes a single RuleAction and returns a structured result describing
 * what happened. Pure function — callers apply the result to their own state.
 */
function executeRuleAction(action) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var target = (_a = action.target) !== null && _a !== void 0 ? _a : "current";
    var amount = (_b = action.amount) !== null && _b !== void 0 ? _b : 1;
    switch (action.type) {
        case "draw_cards":
            return { type: "draw_cards", target: target, amount: amount };
        case "gain_points":
            return { type: "gain_points", target: target, amount: amount };
        case "lose_points":
            return { type: "lose_points", target: target, amount: -Math.abs(amount) };
        case "move_spaces":
            return { type: "move_spaces", target: target, amount: amount };
        case "roll_dice": {
            var sides = Math.max(2, amount);
            var roll = 1 + Math.floor(Math.random() * sides);
            return { type: "roll_dice", target: target, amount: sides, roll: roll };
        }
        case "extra_turn":
            return { type: "extra_turn", target: target };
        case "skip_turn":
            return { type: "skip_turn", target: target };
        case "end_game":
            return { type: "end_game", target: "all", message: (_c = action.value) !== null && _c !== void 0 ? _c : "Game over." };
        case "set_counter":
            return { type: "set_counter", target: target, amount: amount, key: (_e = (_d = action.counterKey) !== null && _d !== void 0 ? _d : action.value) !== null && _e !== void 0 ? _e : "counter" };
        case "flip_component":
            return { type: "flip_component", target: "all", key: (_f = action.value) !== null && _f !== void 0 ? _f : "" };
        case "navigate_page":
            return { type: "navigate_page", target: "all", pageId: (_h = (_g = action.pageId) !== null && _g !== void 0 ? _g : action.value) !== null && _h !== void 0 ? _h : "" };
        case "eliminate_player":
            return { type: "eliminate_player", target: target };
        case "shuffle_deck":
            return { type: "shuffle_deck", target: "all", key: (_j = action.value) !== null && _j !== void 0 ? _j : "deck" };
        case "custom":
            return { type: "custom", target: target, message: (_k = action.value) !== null && _k !== void 0 ? _k : "Custom effect." };
        default:
            return { type: "custom", target: target, message: "Unknown action." };
    }
}
/**
 * Evaluates all actions for a rule and returns the full list of results.
 * Also handles the legacy single-action format for backward compatibility.
 */
function executeRuleActions(rule) {
    var _a, _b, _c, _d, _e;
    // New structured actions array
    if (rule.actions && rule.actions.length > 0) {
        return rule.actions.map(executeRuleAction);
    }
    // Legacy single action fallback
    if (rule.action) {
        var legacyAction = {
            id: "legacy-".concat(rule.id),
            type: rule.action,
            target: (_b = (_a = rule.params) === null || _a === void 0 ? void 0 : _a.target) !== null && _b !== void 0 ? _b : "current",
            amount: (_d = (_c = rule.params) === null || _c === void 0 ? void 0 : _c.amount) !== null && _d !== void 0 ? _d : 1,
            value: (_e = rule.params) === null || _e === void 0 ? void 0 : _e.value,
        };
        return [executeRuleAction(legacyAction)];
    }
    return [];
}
/**
 * Full rule evaluation pipeline: checks enabled → evaluates conditions → executes actions.
 * Returns null if the rule does not fire, or the action results if it does.
 */
function processRule(rule, ctx) {
    if (rule.enabled === false)
        return null;
    if (!evaluateRuleConditions(rule, ctx))
        return null;
    return executeRuleActions(rule);
}
/**
 * Process all rules for a given trigger, sorted by priority (lower = first).
 * Returns a flat list of all action results from rules that fired.
 */
function processTrigger(rules, trigger, ctx) {
    return rules
        .filter(function (r) { return r.trigger === trigger && r.enabled !== false; })
        .sort(function (a, b) { var _a, _b; return ((_a = a.priority) !== null && _a !== void 0 ? _a : 50) - ((_b = b.priority) !== null && _b !== void 0 ? _b : 50); })
        .flatMap(function (r) { var _a; return (_a = processRule(r, ctx)) !== null && _a !== void 0 ? _a : []; });
}

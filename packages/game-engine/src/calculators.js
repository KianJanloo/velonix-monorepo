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

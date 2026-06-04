"use strict";
/**
 * @velonix/game-engine — Calculators
 * Pure functions for pricing, commission, and grid math.
 */
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
const types_1 = require("@velonix/types");
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
    const commissionRate = types_1.SUBSCRIPTION_LIMITS[creatorTier].commissionRate;
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
    const subtotal = itemPricesUsd.reduce((s, p) => s + p, 0);
    const rate = bundleDiscountRate(itemPricesUsd.length);
    const discount = Math.round((subtotal * rate) / 100);
    return { subtotal, discount, total: subtotal - discount, rate };
}
/**
 * Calculates the monthly potential earnings for display on the pricing page.
 */
function projectMonthlyEarnings(pricePerGameUsd, estimatedSalesPerMonth, tier) {
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
exports.COMPLEXITY_PRICE_ANCHORS = {
    light: 299,
    medium: 599,
    medium_heavy: 899,
    heavy: 1299,
};
function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2)
        : (sorted[mid] ?? 0);
}
/** Round a price to the nearest "psychological" .99 ending, min $0.99. */
function roundToCharm(cents) {
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
function suggestGamePrice(complexity, comparables) {
    const anchor = exports.COMPLEXITY_PRICE_ANCHORS[complexity];
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
            `Based on ${pool.length} similar published ${pool === sameComplexity ? complexity.replace("_", " ") + " " : ""}game${pool.length === 1 ? "" : "s"}.`,
            `Market median is $${(marketMedian / 100).toFixed(2)}; blended with the ${complexity.replace("_", " ")} complexity baseline of $${(anchor / 100).toFixed(2)}.`,
        ],
    };
}
/**
 * Generates pixel coordinates for a rectangular grid.
 * Used to position components on the board canvas.
 */
function generateSquareGrid(cols, rows, cellSizePx, offsetX = 0, offsetY = 0) {
    const cells = [];
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
/**
 * Generates pixel coordinates for a flat-top hexagonal grid.
 * Uses axial coordinates (q, r).
 */
function generateHexGrid(radius, // grid radius in hex cells
hexSizePx, // center-to-vertex distance in pixels
offsetX = 0, offsetY = 0) {
    const cells = [];
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
function mmToPx(mm, dpi = 96) {
    return (mm / 25.4) * dpi;
}
function pxToMm(px, dpi = 96) {
    return (px / dpi) * 25.4;
}
// ---------------------------------------------------------------------------
// SEMANTIC VERSION UTILS
// ---------------------------------------------------------------------------
function bumpPatch(version) {
    const parts = version.split(".").map(Number);
    if (parts.length !== 3)
        return version;
    return `${parts[0]}.${parts[1]}.${(parts[2] ?? 0) + 1}`;
}
function bumpMinor(version) {
    const parts = version.split(".").map(Number);
    if (parts.length !== 3)
        return version;
    return `${parts[0]}.${(parts[1] ?? 0) + 1}.0`;
}
function bumpMajor(version) {
    const parts = version.split(".").map(Number);
    if (parts.length !== 3)
        return version;
    return `${(parts[0] ?? 0) + 1}.0.0`;
}
//# sourceMappingURL=calculators.js.map
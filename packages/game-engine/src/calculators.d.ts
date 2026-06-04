/**
 * @velonix/game-engine — Calculators
 * Pure functions for pricing, commission, and grid math.
 */
import type { SubscriptionTier, CurrencyAmount, Percentage, GameComplexity } from "@velonix/types";
/**
 * Calculates how much the creator earns and how much Velonix keeps
 * for a given sale price, based on the creator's subscription tier.
 *
 * @example
 * calculateCommission(999, "pro")
 * // => { salePrice: 999, platformFee: 170, creatorEarnings: 829, commissionRate: 17 }
 */
export declare function calculateCommission(salePriceUsd: CurrencyAmount, creatorTier: SubscriptionTier): {
    salePrice: CurrencyAmount;
    platformFee: CurrencyAmount;
    creatorEarnings: CurrencyAmount;
    commissionRate: Percentage;
};
/**
 * Bundle discount tiers — the more paid components a buyer bundles, the bigger
 * the discount. Shared by the API (authoritative pricing) and the bundle builder
 * UI (live estimate). Returns a percentage (0–100).
 */
export declare function bundleDiscountRate(itemCount: number): Percentage;
/** Applies the bundle discount to a subtotal, returning cents. */
export declare function calculateBundlePricing(itemPricesUsd: CurrencyAmount[]): {
    subtotal: CurrencyAmount;
    discount: CurrencyAmount;
    total: CurrencyAmount;
    rate: Percentage;
};
/**
 * Calculates the monthly potential earnings for display on the pricing page.
 */
export declare function projectMonthlyEarnings(pricePerGameUsd: CurrencyAmount, estimatedSalesPerMonth: number, tier: SubscriptionTier): {
    grossRevenue: CurrencyAmount;
    netRevenue: CurrencyAmount;
    platformFees: CurrencyAmount;
};
/**
 * Baseline anchor price (USD cents) for each complexity tier. Used when there
 * aren't enough comparable published games to derive a market price from, and
 * blended with market data when there are.
 */
export declare const COMPLEXITY_PRICE_ANCHORS: Record<GameComplexity, CurrencyAmount>;
/** A comparable already-published, paid game used to inform a suggestion. */
export interface PriceComparable {
    priceUsd: CurrencyAmount;
    complexity: GameComplexity;
    sameCategory: boolean;
}
export interface PriceSuggestion {
    /** Recommended price in USD cents. */
    suggestedUsd: CurrencyAmount;
    /** Sensible low/high bounds in USD cents to frame the decision. */
    rangeUsd: {
        min: CurrencyAmount;
        max: CurrencyAmount;
    };
    /** Median price of the comparables used (cents), or null if none. */
    marketMedianUsd: CurrencyAmount | null;
    /** How many published games informed this suggestion. */
    sampleSize: number;
    /** "market" = driven by comparables, "baseline" = complexity anchor only. */
    basis: "market" | "baseline";
    /** Short human-readable explanation lines for the UI. */
    rationale: string[];
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
export declare function suggestGamePrice(complexity: GameComplexity, comparables: PriceComparable[]): PriceSuggestion;
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
export declare function generateSquareGrid(cols: number, rows: number, cellSizePx: number, offsetX?: number, offsetY?: number): GridCell[];
export type HexCell = {
    x: number;
    y: number;
    q: number;
    r: number;
};
/**
 * Generates pixel coordinates for a flat-top hexagonal grid.
 * Uses axial coordinates (q, r).
 */
export declare function generateHexGrid(radius: number, // grid radius in hex cells
hexSizePx: number, // center-to-vertex distance in pixels
offsetX?: number, offsetY?: number): HexCell[];
export declare const STANDARD_CARD_SIZES: {
    /** Standard playing card: 63mm × 88mm */
    readonly poker: {
        readonly width: 63;
        readonly height: 88;
    };
    /** Mini card: 44mm × 68mm */
    readonly mini: {
        readonly width: 44;
        readonly height: 68;
    };
    /** Tarot / large: 70mm × 120mm */
    readonly tarot: {
        readonly width: 70;
        readonly height: 120;
    };
    /** Square: 63mm × 63mm */
    readonly square: {
        readonly width: 63;
        readonly height: 63;
    };
    /** Dominion / Dominoes: 44mm × 44mm */
    readonly tile: {
        readonly width: 44;
        readonly height: 44;
    };
};
export type CardSize = keyof typeof STANDARD_CARD_SIZES;
/**
 * Converts mm measurements to px at the given DPI.
 */
export declare function mmToPx(mm: number, dpi?: number): number;
export declare function pxToMm(px: number, dpi?: number): number;
export declare function bumpPatch(version: string): string;
export declare function bumpMinor(version: string): string;
export declare function bumpMajor(version: string): string;
//# sourceMappingURL=calculators.d.ts.map
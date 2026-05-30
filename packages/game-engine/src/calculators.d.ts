/**
 * @velonix/game-engine — Calculators
 * Pure functions for pricing, commission, and grid math.
 */
import type { SubscriptionTier, CurrencyAmount, Percentage } from "@velonix/types";
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
 * Calculates the monthly potential earnings for display on the pricing page.
 */
export declare function projectMonthlyEarnings(pricePerGameUsd: CurrencyAmount, estimatedSalesPerMonth: number, tier: SubscriptionTier): {
    grossRevenue: CurrencyAmount;
    netRevenue: CurrencyAmount;
    platformFees: CurrencyAmount;
};
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
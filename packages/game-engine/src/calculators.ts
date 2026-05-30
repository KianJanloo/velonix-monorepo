/**
 * @velonix/game-engine — Calculators
 * Pure functions for pricing, commission, and grid math.
 */

import type { SubscriptionTier, CurrencyAmount, Percentage } from "@velonix/types";
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

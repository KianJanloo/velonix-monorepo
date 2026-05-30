"use strict";
/**
 * @velonix/game-engine — Calculators
 * Pure functions for pricing, commission, and grid math.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_CARD_SIZES = void 0;
exports.calculateCommission = calculateCommission;
exports.projectMonthlyEarnings = projectMonthlyEarnings;
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
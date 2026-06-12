"use strict";
/**
 * @velonix/game-engine — Validators
 * Zod schemas that validate all game-related data structures.
 * Used both client-side (form validation) and server-side (API DTO validation).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReviewSchema = exports.MarketplaceFiltersSchema = exports.UpdateProfileSchema = exports.ResetPassSchema = exports.ForgetPassSchema = exports.LoginSchema = exports.RegisterCompleteSchema = exports.RegisterSchema = exports.CreateComponentSchema = exports.ComponentTypeSchema = exports.SetGamePricingSchema = exports.UpdateGameSchema = exports.CreateGameSchema = exports.GameComplexitySchema = exports.GameCategorySchema = exports.SemVerSchema = exports.HexColorSchema = exports.UUIDSchema = void 0;
var zod_1 = require("zod");
// ---------------------------------------------------------------------------
// SHARED PRIMITIVES
// ---------------------------------------------------------------------------
exports.UUIDSchema = zod_1.z.string().uuid();
exports.HexColorSchema = zod_1.z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #00d4a5)");
exports.SemVerSchema = zod_1.z
    .string()
    .regex(/^\d+\.\d+\.\d+$/, "Must be valid semver (e.g. 1.0.0)");
// ---------------------------------------------------------------------------
// GAME METADATA
// ---------------------------------------------------------------------------
exports.GameCategorySchema = zod_1.z.enum([
    "strategy",
    "party",
    "cooperative",
    "deck_building",
    "worker_placement",
    "euro",
    "ameritrash",
    "abstract",
    "rpg",
    "trivia",
    "family",
    "other",
]);
exports.GameComplexitySchema = zod_1.z.enum([
    "light",
    "medium",
    "medium_heavy",
    "heavy",
]);
var BaseCreateGameSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(2, "Title must be at least 2 characters")
        .max(120, "Title cannot exceed 120 characters")
        .trim(),
    description: zod_1.z
        .string()
        .min(50, "Description must be at least 50 characters")
        .max(10000, "Description cannot exceed 10,000 characters"),
    shortDescription: zod_1.z
        .string()
        .min(10, "Short description must be at least 10 characters")
        .max(160, "Short description cannot exceed 160 characters")
        .trim(),
    category: exports.GameCategorySchema,
    tags: zod_1.z
        .array(zod_1.z.string().min(1).max(32).trim())
        .max(10, "Maximum 10 tags allowed")
        .default([]),
    playerCountMin: zod_1.z.number().int().min(1).max(20),
    playerCountMax: zod_1.z.number().int().min(1).max(20),
    playtimeMin: zod_1.z.number().int().min(1).max(600),
    playtimeMax: zod_1.z.number().int().min(1).max(600),
    complexity: exports.GameComplexitySchema,
    minAge: zod_1.z.number().int().min(2).max(18).default(8),
    language: zod_1.z.string().length(2).default("en"),
});
exports.CreateGameSchema = BaseCreateGameSchema.refine(function (data) { return data.playerCountMin <= data.playerCountMax; }, {
    message: "Minimum player count cannot exceed maximum",
    path: ["playerCountMin"],
}).refine(function (data) { return data.playtimeMin <= data.playtimeMax; }, {
    message: "Minimum playtime cannot exceed maximum",
    path: ["playtimeMin"],
});
exports.UpdateGameSchema = BaseCreateGameSchema.partial().extend({
    // Studio editor state — arbitrary JSON snapshot of components/board design
    studioData: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    thumbnailUrl: zod_1.z.string().url().nullable().optional(),
    demoVideoUrl: zod_1.z.string().url().nullable().optional(),
    // Pricing (also editable from the studio / game settings)
    isFree: zod_1.z.boolean().optional(),
    priceUsd: zod_1.z.number().int().min(0).max(99999).nullable().optional(),
    hasTrial: zod_1.z.boolean().optional(),
});
exports.SetGamePricingSchema = zod_1.z
    .object({
    isFree: zod_1.z.boolean(),
    priceUsd: zod_1.z.number().int().min(99).max(9999).optional().nullable(),
    hasTrial: zod_1.z.boolean().default(false),
})
    .refine(function (data) {
    return data.isFree || (data.priceUsd !== undefined && data.priceUsd !== null);
}, {
    message: "Paid games must have a price",
    path: ["priceUsd"],
})
    .refine(function (data) { return !data.hasTrial || !data.isFree; }, {
    message: "Free games cannot have a trial",
    path: ["hasTrial"],
});
// ---------------------------------------------------------------------------
// GAME COMPONENTS
// ---------------------------------------------------------------------------
exports.ComponentTypeSchema = zod_1.z.enum([
    "board",
    "card",
    "token",
    "tile",
    "die",
    "pawn",
    "rulebook",
    "custom",
]);
exports.CreateComponentSchema = zod_1.z.object({
    gameId: exports.UUIDSchema,
    name: zod_1.z.string().min(1).max(64).trim(),
    type: exports.ComponentTypeSchema,
    width: zod_1.z.number().positive().max(600), // mm — max A2 paper width
    height: zod_1.z.number().positive().max(600),
    quantity: zod_1.z.number().int().min(1).max(1000).default(1),
});
// ---------------------------------------------------------------------------
// USER / AUTH
// ---------------------------------------------------------------------------
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").toLowerCase().trim(),
    username: zod_1.z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(32, "Username cannot exceed 32 characters")
        .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
        .toLowerCase()
        .trim(),
    displayName: zod_1.z
        .string()
        .min(2, "Display name must be at least 2 characters")
        .max(64, "Display name cannot exceed 64 characters")
        .trim(),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password cannot exceed 128 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
});
exports.RegisterCompleteSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").toLowerCase().trim(),
    token: zod_1.z.string().min(1, "Invalid token"),
    code: zod_1.z.string().length(6, "Code must be 6 characters"),
});
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().trim(),
    password: zod_1.z.string().min(1),
    rememberMe: zod_1.z.boolean().default(false),
});
exports.ForgetPassSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().trim(),
});
exports.ResetPassSchema = zod_1.z.object({
    email: zod_1.z.string().email().toLowerCase().trim(),
    code: zod_1.z.string().length(6),
    token: zod_1.z.string().min(1, "Invalid token"),
    newPassword: zod_1.z.string().min(1),
});
exports.UpdateProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(2).max(64).trim().optional(),
    bio: zod_1.z.string().max(500).trim().nullable().optional(),
    avatarUrl: zod_1.z
        .string()
        .url("Must be a valid URL")
        .max(512)
        .nullable()
        .optional()
        .or(zod_1.z.literal("")),
});
// ---------------------------------------------------------------------------
// MARKETPLACE FILTERS
// ---------------------------------------------------------------------------
exports.MarketplaceFiltersSchema = zod_1.z.object({
    category: exports.GameCategorySchema.optional(),
    isFree: zod_1.z.boolean().optional(),
    priceMin: zod_1.z.number().int().min(0).optional(),
    priceMax: zod_1.z.number().int().optional(),
    playerCount: zod_1.z.number().int().min(1).max(20).optional(),
    complexity: exports.GameComplexitySchema.optional(),
    minRating: zod_1.z.number().min(1).max(5).optional(),
    tags: zod_1.z.array(zod_1.z.string()).max(5).optional(),
    search: zod_1.z.string().max(100).trim().optional(),
    sort: zod_1.z
        .enum([
        "newest",
        "popular",
        "top_rated",
        "price_asc",
        "price_desc",
        "most_sold",
    ])
        .default("newest"),
    page: zod_1.z.number().int().min(1).default(1),
    perPage: zod_1.z.number().int().min(1).max(48).default(24),
});
// ---------------------------------------------------------------------------
// REVIEW
// ---------------------------------------------------------------------------
exports.CreateReviewSchema = zod_1.z.object({
    gameId: exports.UUIDSchema,
    rating: zod_1.z.number().int().min(1).max(5),
    title: zod_1.z.string().max(120).trim().optional(),
    body: zod_1.z.string().max(2000).trim().optional(),
});

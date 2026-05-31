/**
 * @velonix/game-engine — Validators
 * Zod schemas that validate all game-related data structures.
 * Used both client-side (form validation) and server-side (API DTO validation).
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// SHARED PRIMITIVES
// ---------------------------------------------------------------------------

export const UUIDSchema = z.string().uuid();

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color (e.g. #00d4a5)");

export const SemVerSchema = z
  .string()
  .regex(/^\d+\.\d+\.\d+$/, "Must be valid semver (e.g. 1.0.0)");

// ---------------------------------------------------------------------------
// GAME METADATA
// ---------------------------------------------------------------------------

export const GameCategorySchema = z.enum([
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

export const GameComplexitySchema = z.enum([
  "light",
  "medium",
  "medium_heavy",
  "heavy",
]);

const BaseCreateGameSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(120, "Title cannot exceed 120 characters")
    .trim(),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(10000, "Description cannot exceed 10,000 characters"),
  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(160, "Short description cannot exceed 160 characters")
    .trim(),
  category: GameCategorySchema,
  tags: z
    .array(z.string().min(1).max(32).trim())
    .max(10, "Maximum 10 tags allowed")
    .default([]),
  playerCountMin: z.number().int().min(1).max(20),
  playerCountMax: z.number().int().min(1).max(20),
  playtimeMin: z.number().int().min(1).max(600),
  playtimeMax: z.number().int().min(1).max(600),
  complexity: GameComplexitySchema,
  minAge: z.number().int().min(2).max(18).default(8),
  language: z.string().length(2).default("en"),
});

export const CreateGameSchema = BaseCreateGameSchema.refine(
  (data) => data.playerCountMin <= data.playerCountMax,
  {
    message: "Minimum player count cannot exceed maximum",
    path: ["playerCountMin"],
  }
).refine(
  (data) => data.playtimeMin <= data.playtimeMax,
  {
    message: "Minimum playtime cannot exceed maximum",
    path: ["playtimeMin"],
  }
);

export const UpdateGameSchema = BaseCreateGameSchema.partial().extend({
  // Studio editor state — arbitrary JSON snapshot of components/board design
  studioData: z.record(z.string(), z.unknown()).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  // Pricing (also editable from the studio / game settings)
  isFree: z.boolean().optional(),
  priceUsd: z.number().int().min(0).max(99999).nullable().optional(),
  hasTrial: z.boolean().optional(),
});

export const SetGamePricingSchema = z.object({
  isFree: z.boolean(),
  priceUsd: z.number().int().min(99).max(9999).optional().nullable(),
  hasTrial: z.boolean().default(false),
}).refine(
  (data) => data.isFree || (data.priceUsd !== undefined && data.priceUsd !== null),
  {
    message: "Paid games must have a price",
    path: ["priceUsd"],
  }
).refine(
  (data) => !data.hasTrial || !data.isFree,
  {
    message: "Free games cannot have a trial",
    path: ["hasTrial"],
  }
);

// ---------------------------------------------------------------------------
// GAME COMPONENTS
// ---------------------------------------------------------------------------

export const ComponentTypeSchema = z.enum([
  "board",
  "card",
  "token",
  "tile",
  "die",
  "pawn",
  "rulebook",
  "custom",
]);

export const CreateComponentSchema = z.object({
  gameId: UUIDSchema,
  name: z.string().min(1).max(64).trim(),
  type: ComponentTypeSchema,
  width: z.number().positive().max(600),    // mm — max A2 paper width
  height: z.number().positive().max(600),
  quantity: z.number().int().min(1).max(1000).default(1),
});

// ---------------------------------------------------------------------------
// USER / AUTH
// ---------------------------------------------------------------------------

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username cannot exceed 32 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens"
    )
    .toLowerCase()
    .trim(),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(64, "Display name cannot exceed 64 characters")
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(64).trim().optional(),
  bio: z.string().max(500).trim().nullable().optional(),
});

// ---------------------------------------------------------------------------
// MARKETPLACE FILTERS
// ---------------------------------------------------------------------------

export const MarketplaceFiltersSchema = z.object({
  category: GameCategorySchema.optional(),
  isFree: z.boolean().optional(),
  priceMin: z.number().int().min(0).optional(),
  priceMax: z.number().int().optional(),
  playerCount: z.number().int().min(1).max(20).optional(),
  complexity: GameComplexitySchema.optional(),
  minRating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).max(5).optional(),
  search: z.string().max(100).trim().optional(),
  sort: z
    .enum(["newest", "popular", "top_rated", "price_asc", "price_desc", "most_sold"])
    .default("newest"),
  page: z.number().int().min(1).default(1),
  perPage: z.number().int().min(1).max(48).default(24),
});

// ---------------------------------------------------------------------------
// REVIEW
// ---------------------------------------------------------------------------

export const CreateReviewSchema = z.object({
  gameId: UUIDSchema,
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).trim().optional(),
  body: z.string().max(2000).trim().optional(),
});

// ---------------------------------------------------------------------------
// TYPE EXPORTS (inferred from schemas)
// ---------------------------------------------------------------------------

export type CreateGameDto = z.infer<typeof CreateGameSchema>;
export type UpdateGameDto = z.infer<typeof UpdateGameSchema>;
export type SetGamePricingDto = z.infer<typeof SetGamePricingSchema>;
export type CreateComponentDto = z.infer<typeof CreateComponentSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type MarketplaceFiltersDto = z.infer<typeof MarketplaceFiltersSchema>;
export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;

/**
 * @velonix/game-engine — Validators
 * Zod schemas that validate all game-related data structures.
 * Used both client-side (form validation) and server-side (API DTO validation).
 */
import { z } from "zod";
export declare const UUIDSchema: z.ZodString;
export declare const HexColorSchema: z.ZodString;
export declare const SemVerSchema: z.ZodString;
export declare const GameCategorySchema: z.ZodEnum<["strategy", "party", "cooperative", "deck_building", "worker_placement", "euro", "ameritrash", "abstract", "rpg", "trivia", "family", "other"]>;
export declare const GameComplexitySchema: z.ZodEnum<["light", "medium", "medium_heavy", "heavy"]>;
export declare const CreateGameSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    shortDescription: z.ZodString;
    category: z.ZodEnum<["strategy", "party", "cooperative", "deck_building", "worker_placement", "euro", "ameritrash", "abstract", "rpg", "trivia", "family", "other"]>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    playerCountMin: z.ZodNumber;
    playerCountMax: z.ZodNumber;
    playtimeMin: z.ZodNumber;
    playtimeMax: z.ZodNumber;
    complexity: z.ZodEnum<["light", "medium", "medium_heavy", "heavy"]>;
    minAge: z.ZodDefault<z.ZodNumber>;
    language: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
    shortDescription: string;
    category: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other";
    tags: string[];
    playerCountMin: number;
    playerCountMax: number;
    playtimeMin: number;
    playtimeMax: number;
    complexity: "light" | "medium" | "medium_heavy" | "heavy";
    minAge: number;
    language: string;
}, {
    title: string;
    description: string;
    shortDescription: string;
    category: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other";
    playerCountMin: number;
    playerCountMax: number;
    playtimeMin: number;
    playtimeMax: number;
    complexity: "light" | "medium" | "medium_heavy" | "heavy";
    tags?: string[] | undefined;
    minAge?: number | undefined;
    language?: string | undefined;
}>, {
    title: string;
    description: string;
    shortDescription: string;
    category: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other";
    tags: string[];
    playerCountMin: number;
    playerCountMax: number;
    playtimeMin: number;
    playtimeMax: number;
    complexity: "light" | "medium" | "medium_heavy" | "heavy";
    minAge: number;
    language: string;
}, {
    title: string;
    description: string;
    shortDescription: string;
    category: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other";
    playerCountMin: number;
    playerCountMax: number;
    playtimeMin: number;
    playtimeMax: number;
    complexity: "light" | "medium" | "medium_heavy" | "heavy";
    tags?: string[] | undefined;
    minAge?: number | undefined;
    language?: string | undefined;
}>, {
    title: string;
    description: string;
    shortDescription: string;
    category: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other";
    tags: string[];
    playerCountMin: number;
    playerCountMax: number;
    playtimeMin: number;
    playtimeMax: number;
    complexity: "light" | "medium" | "medium_heavy" | "heavy";
    minAge: number;
    language: string;
}, {
    title: string;
    description: string;
    shortDescription: string;
    category: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other";
    playerCountMin: number;
    playerCountMax: number;
    playtimeMin: number;
    playtimeMax: number;
    complexity: "light" | "medium" | "medium_heavy" | "heavy";
    tags?: string[] | undefined;
    minAge?: number | undefined;
    language?: string | undefined;
}>;
export declare const UpdateGameSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    shortDescription: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["strategy", "party", "cooperative", "deck_building", "worker_placement", "euro", "ameritrash", "abstract", "rpg", "trivia", "family", "other"]>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    playerCountMin: z.ZodOptional<z.ZodNumber>;
    playerCountMax: z.ZodOptional<z.ZodNumber>;
    playtimeMin: z.ZodOptional<z.ZodNumber>;
    playtimeMax: z.ZodOptional<z.ZodNumber>;
    complexity: z.ZodOptional<z.ZodEnum<["light", "medium", "medium_heavy", "heavy"]>>;
    minAge: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    language: z.ZodOptional<z.ZodDefault<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
    shortDescription?: string | undefined;
    category?: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other" | undefined;
    tags?: string[] | undefined;
    playerCountMin?: number | undefined;
    playerCountMax?: number | undefined;
    playtimeMin?: number | undefined;
    playtimeMax?: number | undefined;
    complexity?: "light" | "medium" | "medium_heavy" | "heavy" | undefined;
    minAge?: number | undefined;
    language?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
    shortDescription?: string | undefined;
    category?: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other" | undefined;
    tags?: string[] | undefined;
    playerCountMin?: number | undefined;
    playerCountMax?: number | undefined;
    playtimeMin?: number | undefined;
    playtimeMax?: number | undefined;
    complexity?: "light" | "medium" | "medium_heavy" | "heavy" | undefined;
    minAge?: number | undefined;
    language?: string | undefined;
}>;
export declare const SetGamePricingSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    isFree: z.ZodBoolean;
    priceUsd: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    hasTrial: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isFree: boolean;
    hasTrial: boolean;
    priceUsd?: number | null | undefined;
}, {
    isFree: boolean;
    priceUsd?: number | null | undefined;
    hasTrial?: boolean | undefined;
}>, {
    isFree: boolean;
    hasTrial: boolean;
    priceUsd?: number | null | undefined;
}, {
    isFree: boolean;
    priceUsd?: number | null | undefined;
    hasTrial?: boolean | undefined;
}>, {
    isFree: boolean;
    hasTrial: boolean;
    priceUsd?: number | null | undefined;
}, {
    isFree: boolean;
    priceUsd?: number | null | undefined;
    hasTrial?: boolean | undefined;
}>;
export declare const ComponentTypeSchema: z.ZodEnum<["board", "card", "token", "tile", "die", "pawn", "rulebook", "custom"]>;
export declare const CreateComponentSchema: z.ZodObject<{
    gameId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["board", "card", "token", "tile", "die", "pawn", "rulebook", "custom"]>;
    width: z.ZodNumber;
    height: z.ZodNumber;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type: "board" | "card" | "token" | "tile" | "die" | "pawn" | "rulebook" | "custom";
    name: string;
    gameId: string;
    width: number;
    height: number;
    quantity: number;
}, {
    type: "board" | "card" | "token" | "tile" | "die" | "pawn" | "rulebook" | "custom";
    name: string;
    gameId: string;
    width: number;
    height: number;
    quantity?: number | undefined;
}>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    username: z.ZodString;
    displayName: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    email: string;
    displayName: string;
}, {
    username: string;
    password: string;
    email: string;
    displayName: string;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    rememberMe: boolean;
}, {
    password: string;
    email: string;
    rememberMe?: boolean | undefined;
}>;
export declare const UpdateProfileSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    bio: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    bio?: string | null | undefined;
}, {
    displayName?: string | undefined;
    bio?: string | null | undefined;
}>;
export declare const MarketplaceFiltersSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodEnum<["strategy", "party", "cooperative", "deck_building", "worker_placement", "euro", "ameritrash", "abstract", "rpg", "trivia", "family", "other"]>>;
    isFree: z.ZodOptional<z.ZodBoolean>;
    priceMin: z.ZodOptional<z.ZodNumber>;
    priceMax: z.ZodOptional<z.ZodNumber>;
    playerCount: z.ZodOptional<z.ZodNumber>;
    complexity: z.ZodOptional<z.ZodEnum<["light", "medium", "medium_heavy", "heavy"]>>;
    minRating: z.ZodOptional<z.ZodNumber>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    search: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodEnum<["newest", "popular", "top_rated", "price_asc", "price_desc", "most_sold"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    perPage: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sort: "newest" | "popular" | "top_rated" | "price_asc" | "price_desc" | "most_sold";
    page: number;
    perPage: number;
    search?: string | undefined;
    category?: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other" | undefined;
    tags?: string[] | undefined;
    complexity?: "light" | "medium" | "medium_heavy" | "heavy" | undefined;
    isFree?: boolean | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
    playerCount?: number | undefined;
    minRating?: number | undefined;
}, {
    sort?: "newest" | "popular" | "top_rated" | "price_asc" | "price_desc" | "most_sold" | undefined;
    search?: string | undefined;
    category?: "family" | "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "other" | undefined;
    tags?: string[] | undefined;
    complexity?: "light" | "medium" | "medium_heavy" | "heavy" | undefined;
    isFree?: boolean | undefined;
    priceMin?: number | undefined;
    priceMax?: number | undefined;
    playerCount?: number | undefined;
    minRating?: number | undefined;
    page?: number | undefined;
    perPage?: number | undefined;
}>;
export declare const CreateReviewSchema: z.ZodObject<{
    gameId: z.ZodString;
    rating: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    gameId: string;
    rating: number;
    title?: string | undefined;
    body?: string | undefined;
}, {
    gameId: string;
    rating: number;
    title?: string | undefined;
    body?: string | undefined;
}>;
export type CreateGameDto = z.infer<typeof CreateGameSchema>;
export type UpdateGameDto = z.infer<typeof UpdateGameSchema>;
export type SetGamePricingDto = z.infer<typeof SetGamePricingSchema>;
export type CreateComponentDto = z.infer<typeof CreateComponentSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;
export type MarketplaceFiltersDto = z.infer<typeof MarketplaceFiltersSchema>;
export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
//# sourceMappingURL=validators.d.ts.map
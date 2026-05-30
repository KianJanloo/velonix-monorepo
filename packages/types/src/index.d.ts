/**
 * @velonix/types
 *
 * Shared TypeScript type definitions used across the entire monorepo:
 * - apps/web  (Next.js frontend)
 * - apps/api  (NestJS backend)
 * - packages/game-engine
 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;
export type ISODateString = string;
export type UnixTimestamp = number;
export type CurrencyAmount = number;
export type Percentage = number;
export type HexColor = `#${string}`;
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    statusCode: number;
}
export type UserRole = "user" | "creator" | "admin";
export type SubscriptionTier = "free" | "creator" | "pro" | "studio";
export interface SubscriptionLimits {
    maxProjects: number | null;
    maxComponentsPerProject: number | null;
    maxStorageGb: number;
    commissionRate: Percentage;
    hasAnalytics: boolean;
    has3DPreview: boolean;
    hasCustomDomain: boolean;
    hasTeamCollaboration: boolean;
    hasPrioritySupport: boolean;
}
export declare const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits>;
export interface User {
    id: ID;
    email: string;
    username: string;
    displayName: string;
    avatarUrl: Nullable<string>;
    bio: Nullable<string>;
    role: UserRole;
    subscriptionTier: SubscriptionTier;
    subscriptionExpiresAt: Nullable<ISODateString>;
    stripeCustomerId: Nullable<string>;
    stripeConnectAccountId: Nullable<string>;
    isEmailVerified: boolean;
    totalEarnings: CurrencyAmount;
    totalSales: number;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface UserPublicProfile {
    id: ID;
    username: string;
    displayName: string;
    avatarUrl: Nullable<string>;
    bio: Nullable<string>;
    subscriptionTier: SubscriptionTier;
    totalSales: number;
    createdAt: ISODateString;
}
export type GameStatus = "draft" | "reviewing" | "published" | "unpublished" | "rejected";
export type GameCategory = "strategy" | "party" | "cooperative" | "deck_building" | "worker_placement" | "euro" | "ameritrash" | "abstract" | "rpg" | "trivia" | "family" | "other";
export type PlayerCountRange = {
    min: number;
    max: number;
};
export type GameComplexity = "light" | "medium" | "medium_heavy" | "heavy";
export interface GameMetadata {
    title: string;
    description: string;
    shortDescription: string;
    thumbnailUrl: Nullable<string>;
    previewImages: string[];
    category: GameCategory;
    tags: string[];
    playerCount: PlayerCountRange;
    averagePlaytimeMinutes: PlayerCountRange;
    complexity: GameComplexity;
    minAge: number;
    language: string;
}
export interface GamePricing {
    isFree: boolean;
    priceUsd: Nullable<CurrencyAmount>;
    hasTrial: boolean;
}
export interface Game {
    id: ID;
    creatorId: ID;
    creator?: UserPublicProfile;
    metadata: GameMetadata;
    pricing: GamePricing;
    status: GameStatus;
    version: string;
    totalDownloads: number;
    totalPurchases: number;
    averageRating: Nullable<number>;
    totalRatings: number;
    publishedAt: Nullable<ISODateString>;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface GameSummary {
    id: ID;
    creatorId: ID;
    creatorUsername: string;
    title: string;
    shortDescription: string;
    thumbnailUrl: Nullable<string>;
    category: GameCategory;
    isFree: boolean;
    priceUsd: Nullable<CurrencyAmount>;
    averageRating: Nullable<number>;
    totalRatings: number;
    totalPurchases: number;
    status: GameStatus;
    publishedAt: Nullable<ISODateString>;
}
export type ComponentType = "board" | "card" | "token" | "tile" | "die" | "pawn" | "rulebook" | "custom";
export type ComponentLayer = {
    id: ID;
    name: string;
    type: "text" | "image" | "shape" | "icon" | "background";
    visible: boolean;
    locked: boolean;
    zIndex: number;
    properties: Record<string, unknown>;
};
export interface GameComponent {
    id: ID;
    gameId: ID;
    name: string;
    type: ComponentType;
    width: number;
    height: number;
    quantity: number;
    layers: ComponentLayer[];
    thumbnailUrl: Nullable<string>;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface BoardConfiguration {
    id: ID;
    gameId: ID;
    width: number;
    height: number;
    gridType: "square" | "hex" | "none";
    gridSize: number;
    backgroundImageUrl: Nullable<string>;
    layers: ComponentLayer[];
}
export interface MarketplaceListing extends GameSummary {
    tags: string[];
    complexity: GameComplexity;
    playerCount: PlayerCountRange;
    averagePlaytimeMinutes: PlayerCountRange;
    previewImages: string[];
}
export type SortOption = "newest" | "popular" | "top_rated" | "price_asc" | "price_desc" | "most_sold";
export interface MarketplaceFilters {
    category?: GameCategory;
    priceRange?: {
        min: CurrencyAmount;
        max: CurrencyAmount;
    };
    isFree?: boolean;
    playerCount?: number;
    complexity?: GameComplexity;
    minRating?: number;
    tags?: string[];
    sort: SortOption;
    search?: string;
}
export interface Purchase {
    id: ID;
    buyerId: ID;
    gameId: ID;
    game?: GameSummary;
    amountPaidUsd: CurrencyAmount;
    platformFeeUsd: CurrencyAmount;
    creatorEarningsUsd: CurrencyAmount;
    stripePaymentIntentId: string;
    purchasedAt: ISODateString;
}
export interface Review {
    id: ID;
    gameId: ID;
    authorId: ID;
    author?: UserPublicProfile;
    rating: 1 | 2 | 3 | 4 | 5;
    title: Nullable<string>;
    body: Nullable<string>;
    isVerifiedPurchase: boolean;
    helpful: number;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface GameAnalytics {
    gameId: ID;
    period: "7d" | "30d" | "90d" | "1y" | "all";
    views: number;
    purchases: number;
    revenue: CurrencyAmount;
    averageRating: Nullable<number>;
    conversionRate: Percentage;
    dailyStats: Array<{
        date: ISODateString;
        views: number;
        purchases: number;
        revenue: CurrencyAmount;
    }>;
}
export interface EditorViewport {
    zoom: number;
    panX: number;
    panY: number;
    rotation: number;
}
export interface EditorSelection {
    componentIds: ID[];
    layerIds: ID[];
}
export type EditorTool = "select" | "hand" | "text" | "image" | "shape_rect" | "shape_ellipse" | "shape_poly" | "eyedropper" | "zoom";
export type EditorMode = "design" | "preview_2d" | "preview_3d" | "playtest";
export interface StudioEditorState {
    gameId: ID;
    mode: EditorMode;
    activeTool: EditorTool;
    viewport: EditorViewport;
    selection: EditorSelection;
    history: {
        canUndo: boolean;
        canRedo: boolean;
        undoDepth: number;
    };
    isDirty: boolean;
    isSaving: boolean;
    lastSavedAt: Nullable<ISODateString>;
}
//# sourceMappingURL=index.d.ts.map
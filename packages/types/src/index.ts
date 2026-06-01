/**
 * @velonix/types
 *
 * Shared TypeScript type definitions used across the entire monorepo:
 * - apps/web  (Next.js frontend)
 * - apps/api  (NestJS backend)
 * - packages/game-engine
 */

// ---------------------------------------------------------------------------
// UTILITY TYPES
// ---------------------------------------------------------------------------

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string; // UUID v4
export type ISODateString = string; // "2024-01-15T10:30:00.000Z"
export type UnixTimestamp = number;
export type CurrencyAmount = number; // Always stored as cents (integer)
export type Percentage = number; // 0-100
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

// ---------------------------------------------------------------------------
// USER & AUTH
// ---------------------------------------------------------------------------

export type UserRole = "user" | "creator" | "admin";

export type SubscriptionTier =
  | "free"
  | "creator"    // $12/mo — 10 projects, basic tools, 20% commission
  | "pro"        // $29/mo — unlimited projects, all tools, 17% commission
  | "studio";    // $79/mo — unlimited, priority support, 15% commission, analytics

export interface SubscriptionLimits {
  maxProjects: number | null; // null = unlimited
  maxComponentsPerProject: number | null;
  maxStorageGb: number;
  commissionRate: Percentage; // Velonix's cut
  hasAnalytics: boolean;
  has3DPreview: boolean;
  hasCustomDomain: boolean;
  hasTeamCollaboration: boolean;
  /** Max collaborators a creator can invite *per game* (excludes the owner). 0 = none. */
  maxCollaborators: number;
  hasPrioritySupport: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
  free: {
    maxProjects: 3,
    maxComponentsPerProject: 50,
    maxStorageGb: 1,
    commissionRate: 25,
    hasAnalytics: false,
    has3DPreview: false,
    hasCustomDomain: false,
    hasTeamCollaboration: false,
    maxCollaborators: 0,
    hasPrioritySupport: false,
  },
  creator: {
    maxProjects: 10,
    maxComponentsPerProject: 200,
    maxStorageGb: 5,
    commissionRate: 20,
    hasAnalytics: false,
    has3DPreview: true,
    hasCustomDomain: false,
    hasTeamCollaboration: false,
    maxCollaborators: 0,
    hasPrioritySupport: false,
  },
  pro: {
    maxProjects: null,
    maxComponentsPerProject: null,
    maxStorageGb: 25,
    commissionRate: 17,
    hasAnalytics: true,
    has3DPreview: true,
    hasCustomDomain: false,
    hasTeamCollaboration: true,
    maxCollaborators: 3,
    hasPrioritySupport: false,
  },
  studio: {
    maxProjects: null,
    maxComponentsPerProject: null,
    maxStorageGb: 100,
    commissionRate: 15,
    hasAnalytics: true,
    has3DPreview: true,
    hasCustomDomain: true,
    hasTeamCollaboration: true,
    maxCollaborators: 10,
    hasPrioritySupport: true,
  },
};

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

// ---------------------------------------------------------------------------
// PROMOTIONAL EVENTS (admin-managed announcement banners / offers)
// ---------------------------------------------------------------------------

export type PromoEventVariant = "promo" | "sale" | "info" | "warning";
export type PromoEventPlacement = "global" | "landing" | "marketplace";

export interface PromoEvent {
  id: ID;
  title: string;
  message: string;
  ctaLabel: Nullable<string>;
  ctaUrl: Nullable<string>;
  variant: PromoEventVariant;
  placement: PromoEventPlacement;
  isActive: boolean;
  dismissible: boolean;
  priority: number;
  startsAt: Nullable<ISODateString>;
  endsAt: Nullable<ISODateString>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ---------------------------------------------------------------------------
// COLLABORATION
// ---------------------------------------------------------------------------

export type CollaboratorRole = "editor" | "viewer";

export interface GameCollaborator {
  id: ID;
  gameId: ID;
  userId: ID;
  role: CollaboratorRole;
  invitedById: ID;
  createdAt: ISODateString;
  user?: UserPublicProfile;
}

// ---------------------------------------------------------------------------
// BOARD GAME — CORE DATA MODEL
// ---------------------------------------------------------------------------

export type GameStatus = "draft" | "reviewing" | "published" | "unpublished" | "rejected";
export type GameCategory =
  | "strategy"
  | "party"
  | "cooperative"
  | "deck_building"
  | "worker_placement"
  | "euro"
  | "ameritrash"
  | "abstract"
  | "rpg"
  | "trivia"
  | "family"
  | "other";

export type PlayerCountRange = {
  min: number;
  max: number;
};

export type GameComplexity = "light" | "medium" | "medium_heavy" | "heavy";

export interface GameMetadata {
  title: string;
  description: string;
  shortDescription: string; // Max 160 chars for cards
  thumbnailUrl: Nullable<string>;
  previewImages: string[];
  category: GameCategory;
  tags: string[];
  playerCount: PlayerCountRange;
  averagePlaytimeMinutes: PlayerCountRange;
  complexity: GameComplexity;
  minAge: number;
  language: string; // ISO 639-1
}

export interface GamePricing {
  isFree: boolean;
  priceUsd: Nullable<CurrencyAmount>; // In cents; null if free
  hasTrial: boolean;
}

export interface Game {
  id: ID;
  creatorId: ID;
  creator?: UserPublicProfile;
  metadata: GameMetadata;
  pricing: GamePricing;
  status: GameStatus;
  version: string; // semver
  totalDownloads: number;
  totalPurchases: number;
  averageRating: Nullable<number>; // 1-5
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

// ---------------------------------------------------------------------------
// STUDIO — GAME COMPONENTS
// ---------------------------------------------------------------------------

export type ComponentType =
  | "board"
  | "card"
  | "token"
  | "tile"
  | "die"
  | "pawn"
  | "rulebook"
  | "custom";

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
  width: number;   // mm
  height: number;  // mm
  quantity: number;
  layers: ComponentLayer[];
  thumbnailUrl: Nullable<string>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface BoardConfiguration {
  id: ID;
  gameId: ID;
  width: number;    // mm
  height: number;   // mm
  gridType: "square" | "hex" | "none";
  gridSize: number; // mm per cell
  backgroundImageUrl: Nullable<string>;
  layers: ComponentLayer[];
}

// ---------------------------------------------------------------------------
// MARKETPLACE
// ---------------------------------------------------------------------------

export interface MarketplaceListing extends GameSummary {
  tags: string[];
  complexity: GameComplexity;
  playerCount: PlayerCountRange;
  averagePlaytimeMinutes: PlayerCountRange;
  previewImages: string[];
}

export type SortOption =
  | "newest"
  | "popular"
  | "top_rated"
  | "price_asc"
  | "price_desc"
  | "most_sold";

export interface MarketplaceFilters {
  category?: GameCategory;
  priceRange?: { min: CurrencyAmount; max: CurrencyAmount };
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

// ---------------------------------------------------------------------------
// REVIEWS
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// ANALYTICS (Studio Pro+)
// ---------------------------------------------------------------------------

export interface GameAnalytics {
  gameId: ID;
  period: "7d" | "30d" | "90d" | "1y" | "all";
  views: number;
  purchases: number;
  revenue: CurrencyAmount; // Creator's net (after commission)
  averageRating: Nullable<number>;
  conversionRate: Percentage;
  dailyStats: Array<{
    date: ISODateString;
    views: number;
    purchases: number;
    revenue: CurrencyAmount;
  }>;
}

// ---------------------------------------------------------------------------
// STUDIO EDITOR STATE (shared between web and game-engine)
// ---------------------------------------------------------------------------

export interface EditorViewport {
  zoom: number;           // 0.1 - 10
  panX: number;
  panY: number;
  rotation: number;       // degrees
}

export interface EditorSelection {
  componentIds: ID[];
  layerIds: ID[];
}

export type EditorTool =
  | "select"
  | "hand"
  | "text"
  | "image"
  | "shape_rect"
  | "shape_ellipse"
  | "shape_poly"
  | "eyedropper"
  | "zoom";

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

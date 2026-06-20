import type { GameStatus, GameCategory, GameComplexity } from "@velonix/types";

/** Flat shape that the NestJS GameEntity serializes to over the wire */
export interface GameRecord {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string | null;
  demoVideoUrl: string | null;
  previewImages: string[];
  categories: GameCategory[];
  tags: string[];
  playerCountMin: number;
  playerCountMax: number;
  playtimeMin: number;
  playtimeMax: number;
  complexity: GameComplexity;
  minAge: number;
  language: string;
  isFree: boolean;
  priceUsd: number | null;
  hasTrial: boolean;
  status: GameStatus;
  version: string;
  rejectionReason: string | null;
  totalDownloads: number;
  totalPurchases: number;
  totalViews: number;
  averageRating: number | null;
  totalRatings: number;
  studioData: Record<string, unknown> | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface GameReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  isVerifiedPurchase: boolean;
  helpful: number;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

/**
 * Game Entity — TypeORM
 * apps/api/src/games/game.entity.ts
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import type {
  GameStatus,
  GameCategory,
  GameComplexity,
  PlayerCountRange,
} from "@velonix/types";
import { UserEntity } from "../users/entities/user.entity";

@Entity("games")
@Index(["status", "createdAt"]) // Marketplace listing queries
@Index(["creatorId", "status"])
export class GameEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "creator_id" })
  creatorId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creator_id" })
  creator!: UserEntity;

  // ── Core Metadata ────────────────────────────────────────────────────────

  @Column({ length: 120 })
  title!: string;

  @Index("games_title_fulltext", { synchronize: false })
  @Column({ type: "text" })
  description!: string;

  @Column({ name: "short_description", length: 160 })
  shortDescription!: string;

  @Column({ name: "thumbnail_url", type: "varchar", length: 512, nullable: true })
  thumbnailUrl!: string | null;

  /** URL of the auto-generated 3D demo-video flythrough (.webm). */
  @Column({ name: "demo_video_url", type: "varchar", length: 512, nullable: true })
  demoVideoUrl!: string | null;

  @Column({ name: "preview_images", type: "jsonb", default: [] })
  previewImages!: string[];

  @Column({ name: "category", type: "jsonb", default: [] })
  categories!: GameCategory[];

  @Column({ type: "jsonb", default: [] })
  tags!: string[];

  // ── Game Specs ───────────────────────────────────────────────────────────

  @Column({ name: "player_count_min", type: "int" })
  playerCountMin!: number;

  @Column({ name: "player_count_max", type: "int" })
  playerCountMax!: number;

  @Column({ name: "playtime_min", type: "int" })
  playtimeMin!: number;

  @Column({ name: "playtime_max", type: "int" })
  playtimeMax!: number;

  @Column({ type: "varchar" })
  complexity!: GameComplexity;

  @Column({ name: "min_age", type: "int", default: 8 })
  minAge!: number;

  @Column({ length: 10, default: "en" })
  language!: string;

  // ── Pricing ──────────────────────────────────────────────────────────────

  @Column({ name: "is_free", default: true })
  isFree!: boolean;

  /** Price in USD cents. NULL if free. */
  @Column({ name: "price_usd", type: "int", nullable: true })
  priceUsd!: number | null;

  @Column({ name: "has_trial", default: false })
  hasTrial!: boolean;

  // ── Status & Versioning ──────────────────────────────────────────────────

  @Column({ type: "varchar", default: "draft" })
  status!: GameStatus;

  @Column({ length: 20, default: "1.0.0" })
  version!: string;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejectionReason!: string | null;

  // ── Analytics ────────────────────────────────────────────────────────────

  @Column({ name: "total_downloads", type: "int", default: 0 })
  totalDownloads!: number;

  @Column({ name: "total_purchases", type: "int", default: 0 })
  totalPurchases!: number;

  @Column({ name: "total_views", type: "int", default: 0 })
  totalViews!: number;

  @Column({ name: "average_rating", type: "decimal", precision: 3, scale: 2, nullable: true })
  averageRating!: number | null;

  @Column({ name: "total_ratings", type: "int", default: 0 })
  totalRatings!: number;

  // ── Studio Data ──────────────────────────────────────────────────────────

  /** JSON blob of the game's component/board design data (studio format) */
  @Column({ name: "studio_data", type: "jsonb", nullable: true })
  studioData!: Record<string, unknown> | null;

  // ── Timestamps ───────────────────────────────────────────────────────────

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // ---------------------------------------------------------------------------

  toSummary() {
    return {
      id: this.id,
      creatorId: this.creatorId,
      creatorUsername: this.creator?.username ?? "",
      title: this.title,
      shortDescription: this.shortDescription,
      thumbnailUrl: this.thumbnailUrl,
      categories: this.categories,
      isFree: this.isFree,
      priceUsd: this.priceUsd,
      averageRating: this.averageRating,
      totalRatings: this.totalRatings,
      totalPurchases: this.totalPurchases,
      status: this.status,
      publishedAt: this.publishedAt
      // ?.toISOString()
      ?? null,
    };
  }
}

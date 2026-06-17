/**
 * Component Asset Entity — TypeORM
 * apps/api/src/assets/asset.entity.ts
 *
 * A reusable studio component (token, board, card template, …) that a creator
 * publishes to the Component Marketplace for others to buy/acquire and drop
 * into their own games. Revenue is shared with the author on paid sales.
 */

import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from "typeorm";
import type { AssetKind } from "@velonix/types";
import { UserEntity } from "../users/entities/user.entity";

@Entity("component_assets")
@Index(["isPublished", "createdAt"])
@Index(["authorId"])
export class AssetEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "author_id" })
  authorId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: UserEntity;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  @Column({ type: "varchar", length: 20, default: "other" })
  kind!: AssetKind;

  @Column({ name: "thumbnail_url", type: "varchar", length: 512, nullable: true })
  thumbnailUrl!: string | null;

  /** The buyable content: an array of studio component definitions. */
  @Column({ type: "jsonb", default: [] })
  payload!: unknown[];

  @Column({ name: "component_count", type: "int", default: 1 })
  componentCount!: number;

  // ── Pricing ────────────────────────────────────────────────────────────────
  @Column({ name: "is_free", default: true })
  isFree!: boolean;

  /** Price in USD cents. NULL if free. */
  @Column({ name: "price_usd", type: "int", nullable: true })
  priceUsd!: number | null;

  @Column({ name: "is_published", default: true })
  isPublished!: boolean;

  // ── Analytics ────────────────────────────────────────────────────────────
  @Column({ name: "total_purchases", type: "int", default: 0 })
  totalPurchases!: number;

  @Column({ name: "average_rating", type: "decimal", precision: 3, scale: 2, nullable: true })
  averageRating!: number | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  toSummary(owned?: boolean) {
    return {
      id: this.id,
      authorId: this.authorId,
      authorUsername: this.author?.username ?? "",
      title: this.title,
      description: this.description,
      kind: this.kind,
      thumbnailUrl: this.thumbnailUrl,
      isFree: this.isFree,
      priceUsd: this.priceUsd,
      componentCount: this.componentCount,
      totalPurchases: this.totalPurchases,
      averageRating: this.averageRating,
      createdAt: this.createdAt,
      ...(owned === undefined ? {} : { owned }),
    };
  }

  toFull(owned?: boolean) {
    return { ...this.toSummary(owned), payload: this.payload ?? [] };
  }
}

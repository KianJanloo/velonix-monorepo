import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * GameCategory entity — admin-managed taxonomy used when submitting /
 * browsing games on the marketplace. The `slug` is the stable identifier
 * stored on GameEntity; `label` is the human-readable display name.
 */
@Entity("game_categories")
@Index(["slug"], { unique: true })
export class CategoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** URL-safe identifier, e.g. "deck_building". Immutable after first use. */
  @Column({ length: 64 })
  slug!: string;

  /** Human-readable name shown in UI, e.g. "Deck Building". */
  @Column({ length: 120 })
  label!: string;

  /** Optional short description shown in browse/filter UI. */
  @Column({ type: "varchar", length: 280, nullable: true, default: null })
  description!: string | null;

  /**
   * SVG or emoji icon string rendered next to the category label.
   * Kept as plain text so admins can set it without a file upload.
   */
  @Column({ type: "varchar", length: 64, nullable: true, default: null })
  icon!: string | null;

  /** Display order in lists (lower = higher). */
  @Column({ default: 0 })
  sortOrder!: number;

  /** Hidden categories are not shown in public filters but still match existing games. */
  @Column({ default: true })
  isActive!: boolean;

  /** Total games in this category — denormalised counter kept by the service. */
  @Column({ default: 0 })
  gameCount!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

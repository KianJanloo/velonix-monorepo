/**
 * Promotional Event Entity — TypeORM
 * apps/api/src/events/event.entity.ts
 *
 * Admin-managed announcement banners / offers shown across the site
 * (e.g. "70% off launch sale"). Toggleable and schedulable.
 */

import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index,
} from "typeorm";
import type { PromoEventVariant, PromoEventPlacement } from "@velonix/types";

@Entity("promo_events")
@Index(["isActive"])
export class PromoEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ length: 120 })
  title!: string;

  @Column({ type: "text" })
  message!: string;

  @Column({ name: "cta_label", type: "varchar", length: 60, nullable: true })
  ctaLabel!: string | null;

  @Column({ name: "cta_url", type: "varchar", length: 512, nullable: true })
  ctaUrl!: string | null;

  @Column({ type: "varchar", length: 20, default: "promo" })
  variant!: PromoEventVariant;

  @Column({ type: "varchar", length: 20, default: "global" })
  placement!: PromoEventPlacement;

  @Column({ name: "is_active", default: false })
  isActive!: boolean;

  @Column({ default: true })
  dismissible!: boolean;

  @Column({ type: "int", default: 0 })
  priority!: number;

  @Column({ name: "starts_at", type: "timestamptz", nullable: true })
  startsAt!: Date | null;

  @Column({ name: "ends_at", type: "timestamptz", nullable: true })
  endsAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

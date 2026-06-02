import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";
import type { SubscriptionTier } from "@velonix/types";

/**
 * Admin-editable plan configuration. Seeded from SUBSCRIPTION_LIMITS on first boot,
 * then becomes the source of truth for pricing + feature access.
 */
@Entity("plan_configs")
export class PlanConfigEntity {
  @PrimaryColumn({ type: "varchar", length: 16 })
  tier!: SubscriptionTier;

  @Column({ length: 64 })
  name!: string;

  @Column({ type: "text", default: "" })
  description!: string;

  /** Monthly price in USD cents (0 = free) */
  @Column({ name: "price_monthly", type: "int", default: 0 })
  priceMonthly!: number;

  /** Yearly price in USD cents */
  @Column({ name: "price_yearly", type: "int", default: 0 })
  priceYearly!: number;

  @Column({ name: "commission_rate", type: "int", default: 25 })
  commissionRate!: number;

  @Column({ name: "max_projects", type: "int", nullable: true })
  maxProjects!: number | null;

  /** Max design pages (canvases) per game. NULL = unlimited. */
  @Column({ name: "max_pages_per_project", type: "int", nullable: true })
  maxPagesPerProject!: number | null;

  @Column({ name: "has_3d_preview", default: false })
  has3DPreview!: boolean;

  @Column({ name: "has_analytics", default: false })
  hasAnalytics!: boolean;

  @Column({ name: "has_rule_engine", default: false })
  hasRuleEngine!: boolean;

  @Column({ name: "has_priority_support", default: false })
  hasPrioritySupport!: boolean;

  @Column({ type: "jsonb", default: [] })
  features!: string[];

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

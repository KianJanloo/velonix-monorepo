import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

/**
 * Site-wide configuration. A single row (id = 1) that the admin panel edits and
 * the rest of the app reads. Created with defaults on first access.
 */
@Entity("site_settings")
export class SiteSettingEntity {
  /** Always 1 — this table holds exactly one row. */
  @PrimaryColumn({ type: "int", default: 1 })
  id!: number;

  /** When false, public registration is rejected. Enforced in AuthService. */
  @Column({ name: "signups_enabled", default: true })
  signupsEnabled!: boolean;

  /** When false, the component marketplace is hidden/closed to browsing. */
  @Column({ name: "marketplace_enabled", default: true })
  marketplaceEnabled!: boolean;

  @Column({ name: "maintenance_mode", default: false })
  maintenanceMode!: boolean;

  @Column({ name: "maintenance_message", type: "text", default: "" })
  maintenanceMessage!: string;

  /** Optional site-wide banner shown to all visitors. Empty = hidden. */
  @Column({ type: "text", default: "" })
  announcement!: string;

  @Column({ name: "support_email", type: "varchar", length: 255, default: "" })
  supportEmail!: string;

  @Column({ name: "discord_url", type: "varchar", length: 512, default: "" })
  discordUrl!: string;

  @Column({ name: "twitter_url", type: "varchar", length: 512, default: "" })
  twitterUrl!: string;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

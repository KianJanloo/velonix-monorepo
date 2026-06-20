import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("site_settings")
export class SiteSettingEntity {
  @PrimaryColumn({ type: "int", default: 1 })
  id!: number;

  // ── Access flags ──────────────────────────────────────────────────────────

  @Column({ name: "signups_enabled", default: true })
  signupsEnabled!: boolean;

  @Column({ name: "marketplace_enabled", default: true })
  marketplaceEnabled!: boolean;

  @Column({ name: "maintenance_mode", default: false })
  maintenanceMode!: boolean;

  @Column({ name: "maintenance_message", type: "text", default: "" })
  maintenanceMessage!: string;

  // ── Announcement ──────────────────────────────────────────────────────────

  @Column({ type: "text", default: "" })
  announcement!: string;

  // ── General site info ─────────────────────────────────────────────────────

  @Column({ name: "site_name", type: "varchar", length: 255, default: "Velonix" })
  siteName!: string;

  @Column({ name: "site_description", type: "text", default: "The premium platform for creating, publishing, and selling digital board games." })
  siteDescription!: string;

  @Column({ name: "logo_url", type: "varchar", length: 512, default: "" })
  logoUrl!: string;

  @Column({ name: "favicon_url", type: "varchar", length: 512, default: "/Velonix.png" })
  faviconUrl!: string;

  // ── Contact ───────────────────────────────────────────────────────────────

  @Column({ name: "support_email", type: "varchar", length: 255, default: "" })
  supportEmail!: string;

  @Column({ name: "contact_email", type: "varchar", length: 255, default: "" })
  contactEmail!: string;

  @Column({ type: "varchar", length: 50, default: "" })
  phone!: string;

  @Column({ type: "text", default: "" })
  address!: string;

  // ── Social links ──────────────────────────────────────────────────────────

  @Column({ name: "discord_url", type: "varchar", length: 512, default: "" })
  discordUrl!: string;

  @Column({ name: "twitter_url", type: "varchar", length: 512, default: "" })
  twitterUrl!: string;

  @Column({ name: "facebook_url", type: "varchar", length: 512, default: "" })
  facebookUrl!: string;

  @Column({ name: "instagram_url", type: "varchar", length: 512, default: "" })
  instagramUrl!: string;

  @Column({ name: "youtube_url", type: "varchar", length: 512, default: "" })
  youtubeUrl!: string;

  @Column({ name: "github_url", type: "varchar", length: 512, default: "" })
  githubUrl!: string;

  @Column({ name: "linkedin_url", type: "varchar", length: 512, default: "" })
  linkedinUrl!: string;

  // ── SEO ───────────────────────────────────────────────────────────────────

  @Column({ name: "meta_description", type: "text", default: "" })
  metaDescription!: string;

  @Column({ name: "meta_keywords", type: "text", default: "" })
  metaKeywords!: string;

  // ── Branding ──────────────────────────────────────────────────────────────

  @Column({ name: "primary_color", type: "varchar", length: 7, default: "#0a0a0a" })
  primaryColor!: string;

  @Column({ name: "accent_color", type: "varchar", length: 7, default: "#d4a853" })
  accentColor!: string;

  // ── Footer ────────────────────────────────────────────────────────────────

  @Column({ name: "footer_text", type: "text", default: "" })
  footerText!: string;

  // ── About ─────────────────────────────────────────────────────────────────

  @Column({ name: "about_content", type: "text", default: "" })
  aboutContent!: string;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

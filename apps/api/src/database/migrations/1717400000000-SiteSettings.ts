import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Creates the singleton `site_settings` table backing the admin Settings page.
 * The row (id = 1) is created lazily by SettingsService on first access, so no
 * seed is needed here.
 */
export class SiteSettings1717400000000 implements MigrationInterface {
  name = "SiteSettings1717400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "site_settings" (
        "id" integer PRIMARY KEY DEFAULT 1,
        "signups_enabled" boolean NOT NULL DEFAULT true,
        "marketplace_enabled" boolean NOT NULL DEFAULT true,
        "maintenance_mode" boolean NOT NULL DEFAULT false,
        "maintenance_message" text NOT NULL DEFAULT '',
        "announcement" text NOT NULL DEFAULT '',
        "support_email" character varying(255) NOT NULL DEFAULT '',
        "discord_url" character varying(512) NOT NULL DEFAULT '',
        "twitter_url" character varying(512) NOT NULL DEFAULT '',
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "site_settings"`);
  }
}

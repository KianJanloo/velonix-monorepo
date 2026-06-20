import type { MigrationInterface, QueryRunner } from "typeorm";

export class SiteSettingsExtended1720000000000 implements MigrationInterface {
  name = "SiteSettingsExtended1720000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "site_settings"
        ADD COLUMN IF NOT EXISTS "site_name"          character varying(255) NOT NULL DEFAULT 'Velonix',
        ADD COLUMN IF NOT EXISTS "site_description"   text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "logo_url"           character varying(512) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "favicon_url"        character varying(512) NOT NULL DEFAULT '/Velonix.png',
        ADD COLUMN IF NOT EXISTS "contact_email"      character varying(255) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "phone"              character varying(50)  NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "address"            text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "facebook_url"       character varying(512) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "instagram_url"      character varying(512) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "youtube_url"        character varying(512) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "github_url"         character varying(512) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "linkedin_url"       character varying(512) NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "meta_description"   text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "meta_keywords"      text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "primary_color"      character varying(7)  NOT NULL DEFAULT '#0a0a0a',
        ADD COLUMN IF NOT EXISTS "accent_color"       character varying(7)  NOT NULL DEFAULT '#d4a853',
        ADD COLUMN IF NOT EXISTS "footer_text"        text NOT NULL DEFAULT '',
        ADD COLUMN IF NOT EXISTS "about_content"      text NOT NULL DEFAULT ''
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "site_settings"
        DROP COLUMN IF EXISTS "site_name",
        DROP COLUMN IF EXISTS "site_description",
        DROP COLUMN IF EXISTS "logo_url",
        DROP COLUMN IF EXISTS "favicon_url",
        DROP COLUMN IF EXISTS "contact_email",
        DROP COLUMN IF EXISTS "phone",
        DROP COLUMN IF EXISTS "address",
        DROP COLUMN IF EXISTS "facebook_url",
        DROP COLUMN IF EXISTS "instagram_url",
        DROP COLUMN IF EXISTS "youtube_url",
        DROP COLUMN IF EXISTS "github_url",
        DROP COLUMN IF EXISTS "linkedin_url",
        DROP COLUMN IF EXISTS "meta_description",
        DROP COLUMN IF EXISTS "meta_keywords",
        DROP COLUMN IF EXISTS "primary_color",
        DROP COLUMN IF EXISTS "accent_color",
        DROP COLUMN IF EXISTS "footer_text",
        DROP COLUMN IF EXISTS "about_content"
    `);
  }
}

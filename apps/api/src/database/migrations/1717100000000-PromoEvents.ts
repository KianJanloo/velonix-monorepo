import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the promo_events table — admin-managed announcement banners / offers.
 */
export class PromoEvents1717100000000 implements MigrationInterface {
  name = "PromoEvents1717100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "promo_events" (
        "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "title"       VARCHAR(120) NOT NULL,
        "message"     TEXT NOT NULL,
        "cta_label"   VARCHAR(60),
        "cta_url"     VARCHAR(512),
        "variant"     VARCHAR(20) NOT NULL DEFAULT 'promo',
        "placement"   VARCHAR(20) NOT NULL DEFAULT 'global',
        "is_active"   BOOLEAN NOT NULL DEFAULT FALSE,
        "dismissible" BOOLEAN NOT NULL DEFAULT TRUE,
        "priority"    INTEGER NOT NULL DEFAULT 0,
        "starts_at"   TIMESTAMPTZ,
        "ends_at"     TIMESTAMPTZ,
        "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_promo_events_active" ON "promo_events" ("is_active")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "promo_events"`);
  }
}

import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Component Marketplace — reusable studio assets (tokens, boards, card
 * templates) that creators buy/sell with revenue share.
 */
export class ComponentAssets1717200000000 implements MigrationInterface {
  name = "ComponentAssets1717200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "component_assets" (
        "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "author_id"       UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "title"           VARCHAR(120) NOT NULL,
        "description"     TEXT NOT NULL DEFAULT '',
        "kind"            VARCHAR(20) NOT NULL DEFAULT 'other',
        "thumbnail_url"   VARCHAR(512),
        "payload"         JSONB NOT NULL DEFAULT '[]',
        "component_count" INTEGER NOT NULL DEFAULT 1,
        "is_free"         BOOLEAN NOT NULL DEFAULT TRUE,
        "price_usd"       INTEGER,
        "is_published"    BOOLEAN NOT NULL DEFAULT TRUE,
        "total_purchases" INTEGER NOT NULL DEFAULT 0,
        "average_rating"  NUMERIC(3,2),
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_assets_published" ON "component_assets" ("is_published", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_assets_author" ON "component_assets" ("author_id")`);

    await queryRunner.query(`
      CREATE TABLE "asset_purchases" (
        "id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "buyer_id"                 UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "asset_id"                 UUID NOT NULL REFERENCES "component_assets" ("id") ON DELETE CASCADE,
        "amount_paid_usd"          INTEGER NOT NULL DEFAULT 0,
        "platform_fee_usd"         INTEGER NOT NULL DEFAULT 0,
        "creator_earnings_usd"     INTEGER NOT NULL DEFAULT 0,
        "stripe_payment_intent_id" VARCHAR(128),
        "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_asset_purchases_buyer_asset" ON "asset_purchases" ("buyer_id", "asset_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_asset_purchases_buyer" ON "asset_purchases" ("buyer_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_purchases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "component_assets"`);
  }
}

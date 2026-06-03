import type { MigrationInterface, QueryRunner } from "typeorm";

/** Creates the `asset_bundles` table backing buyer-assembled component bundles. */
export class AssetBundles1717500000000 implements MigrationInterface {
  name = "AssetBundles1717500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "asset_bundles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "buyer_id" uuid NOT NULL,
        "stripe_payment_intent_id" character varying(128),
        "status" character varying(16) NOT NULL DEFAULT 'pending',
        "subtotal_usd" integer NOT NULL,
        "discount_usd" integer NOT NULL,
        "total_usd" integer NOT NULL,
        "items" jsonb NOT NULL DEFAULT '[]',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_asset_bundles_payment_intent" UNIQUE ("stripe_payment_intent_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_asset_bundles_buyer" ON "asset_bundles" ("buyer_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "asset_bundles"`);
  }
}

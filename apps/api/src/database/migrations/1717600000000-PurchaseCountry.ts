import type { MigrationInterface, QueryRunner } from "typeorm";

/** Adds buyer country to purchases + asset_purchases for regional sales analytics. */
export class PurchaseCountry1717600000000 implements MigrationInterface {
  name = "PurchaseCountry1717600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "country" character varying(2)`);
    await queryRunner.query(`ALTER TABLE "asset_purchases" ADD COLUMN IF NOT EXISTS "country" character varying(2)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN IF EXISTS "country"`);
    await queryRunner.query(`ALTER TABLE "asset_purchases" DROP COLUMN IF EXISTS "country"`);
  }
}

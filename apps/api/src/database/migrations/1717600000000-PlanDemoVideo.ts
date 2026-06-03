import type { MigrationInterface, QueryRunner } from "typeorm";

/** Adds the `has_demo_video` feature flag to plan configs. */
export class PlanDemoVideo1717600000000 implements MigrationInterface {
  name = "PlanDemoVideo1717600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "plan_configs" ADD COLUMN IF NOT EXISTS "has_demo_video" boolean NOT NULL DEFAULT false`,
    );
    // Match the seeded tiers: pro + studio get the feature.
    await queryRunner.query(`UPDATE "plan_configs" SET "has_demo_video" = true WHERE "tier" IN ('pro', 'studio')`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "plan_configs" DROP COLUMN IF EXISTS "has_demo_video"`);
  }
}

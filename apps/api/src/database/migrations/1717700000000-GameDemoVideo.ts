import type { MigrationInterface, QueryRunner } from "typeorm";

/** Adds the `demo_video_url` column to games for the saved 3D demo flythrough. */
export class GameDemoVideo1717700000000 implements MigrationInterface {
  name = "GameDemoVideo1717700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "demo_video_url" character varying(512)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "games" DROP COLUMN IF EXISTS "demo_video_url"`);
  }
}

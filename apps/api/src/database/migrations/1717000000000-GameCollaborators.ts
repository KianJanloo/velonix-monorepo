import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the game_collaborators table — links invited users (editor/viewer)
 * to a game for real-time co-editing.
 */
export class GameCollaborators1717000000000 implements MigrationInterface {
  name = "GameCollaborators1717000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "game_collaborators" (
        "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "game_id"       UUID NOT NULL REFERENCES "games" ("id") ON DELETE CASCADE,
        "user_id"       UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
        "role"          VARCHAR(20) NOT NULL DEFAULT 'editor',
        "invited_by_id" UUID NOT NULL,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_game_collaborators_game_user" ON "game_collaborators" ("game_id", "user_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_game_collaborators_user" ON "game_collaborators" ("user_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "game_collaborators"`);
  }
}

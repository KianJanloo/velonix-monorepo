import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Performance indexes for the most common query paths:
 *  - marketplace filters/sorts on games (status, category, price, popularity)
 *  - creator dashboards (creator_id)
 *  - full-text search over game title/description (GIN tsvector)
 *  - review/purchase lookups
 * All are IF NOT EXISTS so the migration is safe alongside entity-declared ones.
 */
export class PerformanceIndexes1717300000000 implements MigrationInterface {
  name = "PerformanceIndexes1717300000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Games ────────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_status" ON "games" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_creator" ON "games" ("creator_id")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_category" ON "games" ("category")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_published_at" ON "games" ("published_at")`);
    // Popularity / sales / rating sorts on published listings.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_total_purchases" ON "games" ("total_purchases")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_games_average_rating" ON "games" ("average_rating")`);

    // ── Full-text search (title + short + full description) ───────────────────
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_games_search_fts" ON "games"
      USING GIN (to_tsvector('english',
        coalesce("title", '') || ' ' || coalesce("short_description", '') || ' ' || coalesce("description", '')))
    `);

    // ── Reviews ───────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_reviews_game" ON "reviews" ("game_id")`);

    // ── Purchases ─────────────────────────────────────────────────────────────
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_purchases_buyer" ON "purchases" ("buyer_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchases_buyer"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_reviews_game"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_search_fts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_average_rating"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_total_purchases"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_published_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_creator"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_games_status"`);
  }
}

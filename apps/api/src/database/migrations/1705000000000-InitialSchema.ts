import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Initial Velonix schema migration.
 * Creates: users, games, reviews, purchases tables.
 */
export class InitialSchema1705000000000 implements MigrationInterface {
  name = "InitialSchema1705000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── USERS ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"                     VARCHAR(255) NOT NULL,
        "username"                  VARCHAR(32) NOT NULL,
        "display_name"              VARCHAR(64) NOT NULL,
        "password_hash"             TEXT NOT NULL,
        "avatar_url"                VARCHAR(512),
        "bio"                       TEXT,
        "role"                      VARCHAR(20) NOT NULL DEFAULT 'user',
        "subscription_tier"         VARCHAR(20) NOT NULL DEFAULT 'free',
        "subscription_expires_at"   TIMESTAMPTZ,
        "stripe_customer_id"        VARCHAR(64),
        "stripe_connect_account_id" VARCHAR(64),
        "is_email_verified"         BOOLEAN NOT NULL DEFAULT FALSE,
        "email_verification_token"  VARCHAR(128),
        "password_reset_token"      VARCHAR(128),
        "password_reset_expires_at" TIMESTAMPTZ,
        "refresh_token_hash"        VARCHAR(255),
        "total_earnings"            BIGINT NOT NULL DEFAULT 0,
        "total_sales"               INTEGER NOT NULL DEFAULT 0,
        "last_login_at"             TIMESTAMPTZ,
        "created_at"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"                TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_email"    ON "users" ("email")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_users_username" ON "users" ("username")`);

    // ── GAMES ────────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "games" (
        "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "creator_id"        UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title"             VARCHAR(120) NOT NULL,
        "description"       TEXT NOT NULL DEFAULT '',
        "short_description" VARCHAR(160) NOT NULL DEFAULT '',
        "thumbnail_url"     VARCHAR(512),
        "preview_images"    JSONB NOT NULL DEFAULT '[]',
        "category"          VARCHAR(30) NOT NULL,
        "tags"              JSONB NOT NULL DEFAULT '[]',
        "player_count_min"  INTEGER NOT NULL DEFAULT 1,
        "player_count_max"  INTEGER NOT NULL DEFAULT 4,
        "playtime_min"      INTEGER NOT NULL DEFAULT 30,
        "playtime_max"      INTEGER NOT NULL DEFAULT 60,
        "complexity"        VARCHAR(20) NOT NULL DEFAULT 'medium',
        "min_age"           INTEGER NOT NULL DEFAULT 8,
        "language"          VARCHAR(10) NOT NULL DEFAULT 'en',
        "is_free"           BOOLEAN NOT NULL DEFAULT TRUE,
        "price_usd"         INTEGER,
        "has_trial"         BOOLEAN NOT NULL DEFAULT FALSE,
        "status"            VARCHAR(20) NOT NULL DEFAULT 'draft',
        "version"           VARCHAR(20) NOT NULL DEFAULT '1.0.0',
        "rejection_reason"  TEXT,
        "total_downloads"   INTEGER NOT NULL DEFAULT 0,
        "total_purchases"   INTEGER NOT NULL DEFAULT 0,
        "total_views"       INTEGER NOT NULL DEFAULT 0,
        "average_rating"    DECIMAL(3,2),
        "total_ratings"     INTEGER NOT NULL DEFAULT 0,
        "studio_data"       JSONB,
        "published_at"      TIMESTAMPTZ,
        "created_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_games_creator_id" ON "games" ("creator_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_games_status_created" ON "games" ("status", "created_at" DESC)`);
    await queryRunner.query(`CREATE INDEX "IDX_games_category" ON "games" ("category")`);

    // Full-text search index on title + description
    await queryRunner.query(`
      CREATE INDEX "IDX_games_title_fts"
      ON "games"
      USING GIN (to_tsvector('english', "title" || ' ' || "description"))
    `);

    // ── REVIEWS ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "reviews" (
        "id"                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "game_id"              UUID NOT NULL REFERENCES "games"("id") ON DELETE CASCADE,
        "author_id"            UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "rating"               SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        "title"                VARCHAR(120),
        "body"                 TEXT,
        "is_verified_purchase" BOOLEAN NOT NULL DEFAULT FALSE,
        "helpful"              INTEGER NOT NULL DEFAULT 0,
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_reviews_game_author" UNIQUE ("game_id", "author_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_reviews_game_id" ON "reviews" ("game_id", "created_at" DESC)`);

    // ── PURCHASES ────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE "purchases" (
        "id"                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "buyer_id"                  UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "game_id"                   UUID NOT NULL REFERENCES "games"("id") ON DELETE CASCADE,
        "amount_paid_usd"           INTEGER NOT NULL,
        "platform_fee_usd"          INTEGER NOT NULL,
        "creator_earnings_usd"      INTEGER NOT NULL,
        "stripe_payment_intent_id"  VARCHAR(128) NOT NULL,
        "created_at"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT "UQ_purchases_buyer_game" UNIQUE ("buyer_id", "game_id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_purchases_buyer_id"  ON "purchases" ("buyer_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_purchases_game_id"   ON "purchases" ("game_id", "created_at" DESC)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "purchases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reviews"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "games"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}

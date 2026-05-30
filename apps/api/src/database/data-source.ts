/**
 * TypeORM DataSource — used by the CLI for migrations.
 *
 * Run migrations:
 *   pnpm db:migrate
 *
 * Generate a new migration after entity changes:
 *   pnpm db:migrate:generate -- -n AddGameTags
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

// Load .env.local in development
config({ path: join(__dirname, "../../.env.local") });
config({ path: join(__dirname, "../../.env") });

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env["DATABASE_URL"],
  host: process.env["DB_HOST"] ?? "localhost",
  port: parseInt(process.env["DB_PORT"] ?? "5432", 10),
  username: process.env["DB_USER"] ?? "velonix",
  password: process.env["DB_PASS"] ?? "velonix_dev_password",
  database: process.env["DB_NAME"] ?? "velonix_dev",
  ssl: process.env["NODE_ENV"] === "production" ? { rejectUnauthorized: true } : false,
  entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
  migrations: [join(__dirname, "./migrations/*{.ts,.js}")],
  migrationsTableName: "velonix_migrations",
  logging: ["migration", "error"],
});

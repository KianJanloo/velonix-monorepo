/**
 * Velonix Database Configuration
 * TypeORM + PostgreSQL
 */

import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { join } from "path";

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const isProduction = this.configService.get("app.nodeEnv") === "production";

    return {
      type: "postgres",

      // Connection — prefer DATABASE_URL in production, individual vars in dev
      url: this.configService.get<string>("DATABASE_URL"),
      host: this.configService.get<string>("DB_HOST") ?? "localhost",
      port: this.configService.get<number>("DB_PORT") ?? 5432,
      username: this.configService.get<string>("DB_USER") ?? "velonix",
      password: this.configService.get<string>("DB_PASS") ?? "velonix_dev",
      database: this.configService.get<string>("DB_NAME") ?? "velonix",
      schema: 'velonix',

      // SSL in production
      ssl: isProduction
        ? { rejectUnauthorized: true }
        : false,

      // Entity discovery
      entities: [
        join(__dirname, "../**/*.entity{.ts,.js}"),
      ],

      // Migrations
      migrations: [
        join(__dirname, "../database/migrations/*{.ts,.js}"),
      ],
      migrationsTableName: "velonix_migrations",
      migrationsRun: false, // Run manually via script

      // Never auto-sync in production — use migrations only
      synchronize: !isProduction && this.configService.get("DB_SYNC") === "true",

      // Connection pool
      poolSize: isProduction ? 20 : 5,
      connectTimeoutMS: 10_000,

      // Logging
      logging: !isProduction
        ? ["query", "error", "migration"]
        : ["error", "migration"],

      // Extra PostgreSQL options
      extra: {
        statement_timeout: 30_000, // 30s query timeout
      },
    };
  }
}

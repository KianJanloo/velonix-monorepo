/**
 * Velonix API — Root Application Module
 * apps/api/src/app.module.ts
 */

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

import { DatabaseConfig } from "./config/database.config";
import { appConfig } from "./config/app.config";
import { jwtConfig } from "./config/jwt.config";
import { stripeConfig } from "./config/stripe.config";
import { storageConfig } from "./config/storage.config";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { GamesModule } from "./games/games.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { PaymentsModule } from "./payments/payments.module";

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, stripeConfig, storageConfig],
      envFilePath: [".env.local", ".env"],
      cache: true,
      expandVariables: true,
    }),

    // ── Logging ──────────────────────────────────────────────────────────
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) =>
              `${timestamp} [${context ?? "App"}] ${level}: ${message}`
            )
          ),
        }),
        // Production: add file transport or CloudWatch transport
        ...(process.env["NODE_ENV"] === "production"
          ? [
              new winston.transports.File({
                filename: "logs/error.log",
                level: "error",
                format: winston.format.json(),
              }),
              new winston.transports.File({
                filename: "logs/combined.log",
                format: winston.format.json(),
              }),
            ]
          : []),
      ],
    }),

    // ── Database ─────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),

    // ── Rate Limiting ────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            // Global: 200 requests per minute per IP
            name: "global",
            ttl: 60_000,
            limit: 200,
          },
          {
            // Auth: 10 auth attempts per minute
            name: "auth",
            ttl: 60_000,
            limit: 10,
          },
        ],
      }),
    }),

    // ── Feature Modules ──────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    GamesModule,
    MarketplaceModule,
    SubscriptionsModule,
    PaymentsModule,
  ],
})
export class AppModule {}

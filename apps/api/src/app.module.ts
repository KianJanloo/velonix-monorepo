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
import * as path from "path";

import { DatabaseConfig } from "./config/database.config";
import {
  appConfig,
  adminConfig,
  jwtConfig,
  oauthConfig,
  stripeConfig,
  storageConfig,
} from "./config/app.config";

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { GamesModule } from "./games/games.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { PaymentsModule } from "./payments/payments.module";
import { AdminModule } from "./admin/admin.module";
import { BlogModule } from "./blog/blog.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { UploadsModule } from "./uploads/uploads.module";
import { PlansModule } from "./plans/plans.module";
import { EventsModule } from "./events/events.module";

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────────

    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, adminConfig, jwtConfig, oauthConfig, stripeConfig, storageConfig],

      envFilePath: [
        path.resolve(process.cwd(), "../../.env.local"),
        path.resolve(process.cwd(), "../../.env"),
        ".env.local",
        ".env",
      ],

      cache: true,
      expandVariables: true,
    }),

    // ── Logging ──────────────────────────────────────────────────────────
    WinstonModule.forRoot({
      format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.colorize(),
        winston.format.printf((info: winston.Logform.TransformableInfo) => {
          const { timestamp, level, message, context } = info as Record<
            string,
            unknown
          >;
          return `${timestamp} [${(context as string) ?? "App"}] ${level}: ${message}`;
        }),
      ),
      transports: [
        new winston.transports.Console(),
        // Production: add file transport or CloudWatch transport
        ...(process.env["NODE_ENV"] === "production"
          ? [
              new winston.transports.File({
                filename: "logs/error.log",
                // level: "error",
              }),
              new winston.transports.File({
                filename: "logs/combined.log",
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
    AdminModule,
    BlogModule,
    NotificationsModule,
    UploadsModule,
    PlansModule,
    EventsModule,
  ],
})
export class AppModule {}

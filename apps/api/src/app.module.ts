/**
 * Velonix API — Root Application Module
 * apps/api/src/app.module.ts
 */

import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { mkdirSync } from "fs";
import * as os from "os";
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

const defaultLogDir = path.resolve(process.cwd(), "logs");
const fallbackLogDir = path.join(os.tmpdir(), "logs");

function ensureLogDirectory(dir: string): string | null {
  try {
    mkdirSync(dir, { recursive: true });
    return dir;
  } catch {
    return null;
  }
}

const writableLogDir = ensureLogDirectory(defaultLogDir) ?? ensureLogDirectory(fallbackLogDir);
const loggerTransports: winston.transport[] = [new winston.transports.Console()];
if (process.env["NODE_ENV"] === "production" && writableLogDir) {
  loggerTransports.push(
    new winston.transports.File({ dirname: writableLogDir, filename: "error.log" }),
    new winston.transports.File({ dirname: writableLogDir, filename: "combined.log" }),
  );
} else if (process.env["NODE_ENV"] === "production") {
  console.warn("Production file logging disabled because no writable log directory is available.");
}

import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { GamesModule } from "./games/games.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { PaymentsModule } from "./payments/payments.module";
import { AdminModule } from "./admin/admin.module";
import { BlogModule } from "./blog/blog.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { UploadsModule } from "./uploadsModule/uploads.module";
import { PlansModule } from "./plans/plans.module";
import { EventsModule } from "./events/events.module";
import { AssetsModule } from "./assets/assets.module";
import { SettingsModule } from "./settings/settings.module";
import { SupportModule } from "./support/support.module";
import { AnalyticsModule } from "./analytics/analytics.module";

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
      transports: loggerTransports,
    }),

    // ── Database ─────────────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),

    // ── Rate Limiting ────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      useFactory: () => ({
        // Single always-on limiter (200 req/min/IP). Sensitive routes tighten
        // this with a per-route @Throttle() override (see auth + uploads).
        throttlers: [{ name: "default", ttl: 60_000, limit: 200 }],
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
    AssetsModule,
    SettingsModule,
    SupportModule,
    AnalyticsModule,
  ],
  providers: [
    // Enforce rate limiting globally (the ThrottlerModule above only configures it).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

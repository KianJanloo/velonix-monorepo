/**
 * Velonix API Configuration Factories
 * apps/api/src/config/app.config.ts + others
 */

import { registerAs } from "@nestjs/config";

// ── App ──────────────────────────────────────────────────────────────────────

export const appConfig = registerAs("app", () => ({
  nodeEnv: process.env["NODE_ENV"] ?? "development",
  port: parseInt(process.env["PORT"] ?? "3001", 10),
  appUrl: process.env["APP_URL"] ?? "http://localhost:3000",
  apiUrl: process.env["API_URL"] ?? "http://localhost:3001",
  corsOrigins: (process.env["CORS_ORIGINS"] ?? "http://localhost:3000").split(
    ","
  ),
  bcryptRounds: parseInt(process.env["BCRYPT_ROUNDS"] ?? "12", 10),
  enableSwagger: (process.env["ENABLE_SWAGGER"] ?? "false") === "true",
}));

// ── Admin bootstrap ────────────────────────────────────────────────────────

export const adminConfig = registerAs("admin", () => ({
  email: process.env["ADMIN_EMAIL"] ?? "admin@velonix.gg",
  password: process.env["ADMIN_PASSWORD"] ?? "ChangeMe!Admin1",
  username: process.env["ADMIN_USERNAME"] ?? "admin",
}));

// ── JWT ──────────────────────────────────────────────────────────────────────

export const jwtConfig = registerAs("jwt", () => ({
  accessSecret: process.env["JWT_ACCESS_SECRET"] ?? "CHANGE_ME_IN_PRODUCTION",
  refreshSecret:
    process.env["JWT_REFRESH_SECRET"] ?? "CHANGE_ME_REFRESH_IN_PRODUCTION",
  accessExpiresIn: process.env["JWT_ACCESS_EXPIRES"] ?? "15m",
  refreshExpiresIn: process.env["JWT_REFRESH_EXPIRES"] ?? "30d",
}));

// ── OAuth (Google) ─────────────────────────────────────────────────────────

export const oauthConfig = registerAs("oauth", () => ({
  google: {
    clientId: process.env["GOOGLE_CLIENT_ID"] ?? "",
    clientSecret: process.env["GOOGLE_CLIENT_SECRET"] ?? "",
    callbackUrl:
      process.env["GOOGLE_CALLBACK_URL"] ??
      `${process.env["API_URL"] ?? "http://localhost:3001"}/api/v1/auth/google/callback`,
    enabled: !!process.env["GOOGLE_CLIENT_ID"] && !!process.env["GOOGLE_CLIENT_SECRET"],
  },
  webAppUrl: process.env["APP_URL"] ?? process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
}));

// ── Stripe ───────────────────────────────────────────────────────────────────

export const stripeConfig = registerAs("stripe", () => ({
  secretKey: process.env["STRIPE_SECRET_KEY"] ?? "",
  publishableKey: process.env["STRIPE_PUBLISHABLE_KEY"] ?? "",
  webhookSecret: process.env["STRIPE_WEBHOOK_SECRET"] ?? "",
  /** Creator subscription product IDs */
  products: {
    creator: process.env["STRIPE_PRODUCT_CREATOR"] ?? "",
    pro: process.env["STRIPE_PRODUCT_PRO"] ?? "",
    studio: process.env["STRIPE_PRODUCT_STUDIO"] ?? "",
  },
  /** Price IDs for monthly billing */
  prices: {
    creatorMonthly: process.env["STRIPE_PRICE_CREATOR_MONTHLY"] ?? "",
    creatorYearly: process.env["STRIPE_PRICE_CREATOR_YEARLY"] ?? "",
    proMonthly: process.env["STRIPE_PRICE_PRO_MONTHLY"] ?? "",
    proYearly: process.env["STRIPE_PRICE_PRO_YEARLY"] ?? "",
    studioMonthly: process.env["STRIPE_PRICE_STUDIO_MONTHLY"] ?? "",
    studioYearly: process.env["STRIPE_PRICE_STUDIO_YEARLY"] ?? "",
  },
  /** Application fee percent on marketplace transactions (platform cut) */
  platformFeePercent: {
    free: 25,
    creator: 20,
    pro: 17,
    studio: 15,
  },
}));

// ── AI features (balancer, etc.) ──────────────────────────────────────────

export const aiConfig = registerAs("ai", () => ({
  provider: process.env["AI_PROVIDER"] ?? "anthropic",
  apiKey: process.env["AI_API_KEY"] ?? process.env["ANTHROPIC_API_KEY"] ?? "",
  model: process.env["AI_MODEL"] ?? "claude-sonnet-4-6",
  maxTokens: parseInt(process.env["AI_MAX_TOKENS"] ?? "1000", 10),
  /** Computed, not set directly — AI features are off unless a key is configured. */
  enabled: !!(process.env["AI_API_KEY"] ?? process.env["ANTHROPIC_API_KEY"]),
}));

// ── Storage (S3-compatible) ───────────────────────────────────────────────────

export const storageConfig = registerAs("storage", () => ({
  provider: process.env["STORAGE_PROVIDER"] ?? "s3", // 's3' | 'local'
  bucket: process.env["S3_BUCKET"] ?? "velonix-assets",
  region: process.env["AWS_REGION"] ?? "us-east-1",
  accessKeyId: process.env["AWS_ACCESS_KEY_ID"] ?? "",
  secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"] ?? "",
  endpoint: process.env["S3_ENDPOINT"] ?? undefined, // Custom endpoint for MinIO/R2
  cdnUrl: process.env["CDN_URL"] ?? "",
  maxFileSizeBytes: parseInt(
    process.env["MAX_FILE_SIZE_BYTES"] ?? String(50 * 1024 * 1024), // 50 MB
    10
  ),
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/svg+xml",
    "application/json",
    "application/pdf",
    "font/ttf",
    "font/otf",
  ],
}));

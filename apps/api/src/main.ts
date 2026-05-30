/**
 * Velonix API — Bootstrap
 * apps/api/src/main.ts
 */

import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Disable default logger in favour of Winston
    bufferLogs: true,
  });

  // ── Winston logger ───────────────────────────────────────────────────────
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const config = app.get(ConfigService);
  const port = config.get<number>("app.port") ?? 3001;
  const nodeEnv = config.get<string>("app.nodeEnv") ?? "development";

  // ── Global prefix + versioning ───────────────────────────────────────────
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // ── Security middleware ───────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === "production",
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(compression());
  app.use(cookieParser());

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: config.get<string[]>("app.corsOrigins") ?? [
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  });

  // ── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown props
      transform: true,           // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 422,
    })
  );

  // ── Swagger API Documentation ─────────────────────────────────────────────
  if (nodeEnv !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Velonix API")
      .setDescription(
        "Velonix — Digital Board Game Creation & Publishing Platform API"
      )
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT access token",
        },
        "JWT"
      )
      .addTag("auth", "Authentication endpoints")
      .addTag("users", "User profile management")
      .addTag("games", "Game creation and management")
      .addTag("marketplace", "Game marketplace")
      .addTag("subscriptions", "Subscription plans")
      .addTag("payments", "Stripe payment integration")
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customSiteTitle: "Velonix API Docs",
    });

    console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`Velonix API running on http://localhost:${port}/api/v1`);
}

void bootstrap();

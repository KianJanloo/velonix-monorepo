/**
 * Velonix API — Bootstrap
 * apps/api/src/main.ts
 */

import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { join } from "path";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { ResponseWrapInterceptor } from "./common/interceptors/response-wrap.interceptor";

// ── Velonix dark theme for Swagger UI ─────────────────────────────────────────
const VELONIX_SWAGGER_DARK_CSS = `
  body, .swagger-ui { background:#0a0a0a !important; color:#e8d5b8 !important; }
  .swagger-ui .topbar { background:#1c140f; border-bottom:1px solid #3a2a1f; }
  .swagger-ui .topbar .download-url-wrapper { display:none; }
  .swagger-ui .info .title,
  .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3,
  .swagger-ui .info p, .swagger-ui .info li,
  .swagger-ui .scheme-container { color:#e8d5b8 !important; }
  .swagger-ui .scheme-container { background:#1c140f !important; box-shadow:none; border:1px solid #3a2a1f; }
  .swagger-ui .opblock-tag { color:#f5c451 !important; border-bottom:1px solid #3a2a1f; }
  .swagger-ui .opblock { background:#1c140f; border:1px solid #3a2a1f; box-shadow:none; }
  .swagger-ui .opblock .opblock-summary-description,
  .swagger-ui .opblock-description-wrapper p,
  .swagger-ui table thead tr td, .swagger-ui table thead tr th,
  .swagger-ui .parameter__name, .swagger-ui .parameter__type,
  .swagger-ui .response-col_status, .swagger-ui .response-col_description,
  .swagger-ui label, .swagger-ui .tab li, .swagger-ui .opblock-title_normal p { color:#c4b49a !important; }
  .swagger-ui .opblock.opblock-post { border-color:#7c5cff; background:rgba(124,92,255,0.06); }
  .swagger-ui .opblock.opblock-post .opblock-summary-method { background:#7c5cff; }
  .swagger-ui .opblock.opblock-get { border-color:#00e5ff; background:rgba(0,229,255,0.05); }
  .swagger-ui .opblock.opblock-get .opblock-summary-method { background:#00b8d4; }
  .swagger-ui .opblock.opblock-patch { border-color:#f5c451; background:rgba(245,196,81,0.05); }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method { background:#d4a93a; }
  .swagger-ui .opblock.opblock-delete { border-color:#ff3b5c; background:rgba(255,59,92,0.05); }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method { background:#ff3b5c; }
  .swagger-ui .opblock-summary-path, .swagger-ui .opblock-summary-path__deprecated { color:#e8d5b8 !important; }
  .swagger-ui input, .swagger-ui textarea, .swagger-ui select {
    background:#241a12 !important; color:#e8d5b8 !important; border:1px solid #3a2a1f !important;
  }
  .swagger-ui .btn { color:#e8d5b8; border-color:#3a2a1f; background:#241a12; }
  .swagger-ui .btn.authorize { color:#7c5cff; border-color:#7c5cff; }
  .swagger-ui .btn.execute { background:#7c5cff; color:#0a0a0a; border-color:#7c5cff; }
  .swagger-ui .model, .swagger-ui .model-title, .swagger-ui .models, .swagger-ui section.models { color:#c4b49a !important; }
  .swagger-ui section.models { background:#1c140f; border:1px solid #3a2a1f; }
  .swagger-ui .model-box { background:#241a12; }
  .swagger-ui .highlight-code, .swagger-ui .microlight { background:#0a0a0a !important; }
  .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5,
  .swagger-ui .opblock-section-header { background:#241a12 !important; color:#e8d5b8 !important; }
  .swagger-ui .opblock-section-header h4, .swagger-ui .opblock-section-header label { color:#e8d5b8 !important; }
  .swagger-ui svg { fill:#c4b49a; }
`;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Disable default logger in favour of Winston
    bufferLogs: true,
  });

  // ── Serve uploaded images ──────────────────────────────────────────────────
  // CORS header lets the 3D demo-video renderer use these as WebGL textures
  // without tainting the canvas (which would block MediaRecorder capture).
  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads/",
    setHeaders: (res) => res.setHeader("Access-Control-Allow-Origin", "*"),
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

  // ── Global filters + interceptors ────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseWrapInterceptor());

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
  // Allow explicit enabling of Swagger in production via ENABLE_SWAGGER=true
  const enableSwagger = config.get<boolean>("app.enableSwagger") ?? false;

  if (nodeEnv !== "production" || enableSwagger) {
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
      customCss: VELONIX_SWAGGER_DARK_CSS,
    });

    console.log(`Swagger docs available at http://localhost:${port}/api/docs`);
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`Velonix API running on http://localhost:${port}/api/v1`);
}

void bootstrap();

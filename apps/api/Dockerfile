# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/game-engine/package.json ./packages/game-engine/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/api/ ./apps/api/
COPY packages/types/ ./packages/types/
COPY packages/game-engine/ ./packages/game-engine/
COPY tsconfig.json ./

# Build
RUN pnpm --filter @velonix/types build
RUN pnpm --filter @velonix/game-engine build
RUN pnpm --filter @velonix/api build

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/game-engine/package.json ./packages/game-engine/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/game-engine/dist ./packages/game-engine/dist

# Security: run as non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/main.js"]

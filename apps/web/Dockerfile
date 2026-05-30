# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY packages/ui/package.json ./packages/ui/
COPY packages/game-engine/package.json ./packages/game-engine/

RUN pnpm install --frozen-lockfile

# ── Stage 2: Builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @velonix/types build
RUN pnpm --filter @velonix/design-tokens build
RUN pnpm --filter @velonix/game-engine build
RUN pnpm --filter @velonix/ui build
RUN pnpm --filter @velonix/web build

# ── Stage 3: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy Next.js standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]

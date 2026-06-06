# Velonix

**Play. Think. Conquer.**

Premium digital board game creation and publishing platform. Design professional board games with powerful studio tools, publish them to the marketplace, and earn from every sale.

---

## Architecture

```
velonix/                          # Turborepo monorepo root
├── apps/
│   ├── web/                      # Next.js 15 (App Router) — Frontend
│   │   ├── src/
│   │   │   ├── app/              # App Router pages
│   │   │   │   ├── (auth)/       # Auth group: login, register
│   │   │   │   ├── dashboard/    # Creator dashboard
│   │   │   │   ├── studio/       # Board Game Designer Studio
│   │   │   │   ├── marketplace/  # Game marketplace
│   │   │   │   ├── profile/      # Public creator profiles
│   │   │   │   └── settings/     # Account settings
│   │   │   ├── components/
│   │   │   │   ├── atoms/        # Buttons, inputs, badges, icons
│   │   │   │   ├── molecules/    # Card, form fields, stat blocks
│   │   │   │   ├── organisms/    # Navbar, sidebar, game grid
│   │   │   │   ├── templates/    # Page layouts, Providers
│   │   │   │   └── three/        # React Three Fiber components
│   │   │   │       └── BoardPreview.tsx  ← The flagship 3D component
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   ├── lib/              # API client, utils
│   │   │   ├── stores/           # Zustand stores
│   │   │   │   └── studioStore.ts
│   │   │   ├── styles/
│   │   │   │   └── globals.css
│   │   │   └── types/            # Local web-only type extensions
│   │   ├── tailwind.config.ts    # Full Velonix gaming theme
│   │   └── next.config.ts
│   │
│   └── api/                      # NestJS — Backend API
│       └── src/
│           ├── auth/             # JWT auth, guards, strategies, refresh
│           ├── users/            # User CRUD, profile
│           ├── games/            # Game creation, studio data, collaborators + StudioGateway (WS)
│           ├── assets/           # Component marketplace (buy/sell reusable assets)
│           ├── marketplace/      # Game listings, search, filters, reviews, purchases
│           ├── events/           # Admin-managed promotional banners / offers
│           ├── subscriptions/    # Stripe subscription management
│           ├── payments/         # Stripe Connect, game + asset purchase intents, webhooks
│           ├── notifications/    # In-app notifications
│           ├── uploads/          # Image uploads
│           ├── blog/             # Marketing blog
│           ├── admin/            # Admin panel APIs (users, games, plans, events)
│           ├── plans/            # Subscription plan metadata
│           ├── config/           # Configuration factories
│           └── database/         # TypeORM migrations + seeds
│
└── packages/
    ├── types/                    # @velonix/types — Shared TypeScript types
    ├── design-tokens/            # @velonix/design-tokens — Color palette, typography
    ├── ui/                       # @velonix/ui — Shared ShadCN components
    └── game-engine/              # @velonix/game-engine — Validators, calculators, factories
```

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| Deep Void Black | `#0a0a0a` | Main background |
| Rich Wood Dark | `#1c140f` | Panels, cards, sidebars |
| Warm Wood | `#3a2a1f` | Borders, dividers |
| Emerald Glow | `#7c5cff` | Primary buttons, create actions |
| Royal Gold | `#f5c451` | Premium elements, earnings |
| Crimson Flame | `#ff3b5c` | Warnings, delete, danger |
| Cyan Spark | `#00e5ff` | Hover states, interactive |
| Parchment Light | `#e8d5b8` | Main text |
| Soft Gray | `#a8a29e` | Secondary text |

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | `>= 20.0.0` |
| pnpm | `>= 9.0.0` |
| PostgreSQL | `>= 15` |
| Docker (optional) | Latest |

---

## Development Setup

### 1. Clone and install

```bash
git clone https://github.com/velonix/velonix.git
cd velonix

# Install all workspace dependencies
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env.local

# Edit .env.local with your credentials:
# - PostgreSQL connection (DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)
# - JWT secrets (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - Stripe test keys (from https://dashboard.stripe.com/apikeys)
# - AWS/R2/MinIO storage credentials
```

### 3. Start PostgreSQL (Docker)

```bash
docker run -d \
  --name velonix-postgres \
  -e POSTGRES_USER=velonix \
  -e POSTGRES_PASSWORD=velonix_dev_password \
  -e POSTGRES_DB=velonix_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Verify connection
psql postgresql://velonix:velonix_dev_password@localhost:5432/velonix_dev -c "SELECT 1;"
```

### 4. Run database migrations

```bash
pnpm db:migrate
# Optional: seed with sample data
pnpm db:seed
```

### 5. Start development servers

```bash
# Start everything in parallel (web + api)
pnpm dev

# Or start individually:
pnpm dev:web    # Next.js on http://localhost:3000
pnpm dev:api    # NestJS on http://localhost:3001

# API documentation: http://localhost:3001/api/docs
```

### 6. Stripe webhooks (for local payment testing)

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3001/api/v1/payments/webhook

# Copy the webhook signing secret to .env.local as STRIPE_WEBHOOK_SECRET
```

---

## Available Scripts

```bash
pnpm dev              # Start all apps in parallel
pnpm build            # Build all apps and packages
pnpm lint             # Lint all packages
pnpm lint:fix         # Auto-fix lint issues
pnpm type-check       # TypeScript type checking across the monorepo
pnpm test             # Run all tests
pnpm clean            # Remove all build artifacts and node_modules

# Database (runs on @velonix/api)
pnpm db:migrate       # Apply pending migrations
pnpm db:seed          # Seed the database
pnpm db:studio        # Open TypeORM interactive CLI

# Individual apps
pnpm dev:web          # Next.js only
pnpm dev:api          # NestJS only
```

---

## Tech Stack

### Frontend (apps/web)
- **Next.js 15** — App Router, Server Components, Turbopack
- **React 19** — Concurrent features, Server Actions
- **TypeScript 5** — Strict mode
- **Tailwind CSS** — Custom gaming theme
- **ShadCN/ui** — Headless components (Radix UI primitives)
- **React Three Fiber** — 3D board previews
- **Three.js** — 3D rendering engine
- **@react-three/drei** — R3F helpers (OrbitControls, MeshReflector, etc.)
- **Framer Motion** — UI animations
- **Zustand + Immer** — Studio editor state
- **TanStack Query** — Server state + caching
- **React Hook Form + Zod** — Form validation
- **Stripe.js** — Payment UI

### Backend (apps/api)
- **NestJS 10** — Modular architecture
- **TypeORM** — Database ORM
- **PostgreSQL 15** — Primary database
- **Passport + JWT** — Authentication
- **Stripe SDK** — Subscriptions + Connect marketplace
- **AWS S3 / Cloudflare R2** — Asset storage
- **Sharp** — Image processing
- **Winston** — Structured logging
- **Swagger** — Auto-generated API docs

### Shared Packages
- **@velonix/types** — All TypeScript interfaces
- **@velonix/design-tokens** — Color palette, CSS variables, Three.js colors
- **@velonix/ui** — Shared ShadCN components
- **@velonix/game-engine** — Zod validators, pricing calculators, grid math

---

## Key Features

### Board Game Designer Studio
The core feature. A professional-grade design tool with:
- Drag-and-drop component editor with 15 component types (board, card, deck, tile, hex, token, marker, cube, coin, die, pawn, meeple, note, rulebook, text)
- **Multiple resizable pages** — design a main board, player boards, card sheets, etc.; each page has its own changeable dimensions
- Layer system (Photoshop-like) with **nested groups** — group components into a single managed block, shown as a collapsible parent with its members nested underneath
- **Marquee (box) selection** + shift-click multi-select; ⌘G / ⌘⇧G to group / ungroup
- Right-click **context menu** (duplicate, copy/paste, z-order, group, lock/hide, delete)
- Rich **Properties** (steppers, alignment, size presets, aspect lock) and **Style** panels (fill/stroke/corner/opacity, transparent support, live preview)
- Asset library — upload images and apply them to components
- 50-entry undo/redo history + real-time autosave
- 2D canvas + 3D tabletop preview toggle; grid snap + alignment
- **Smart pricing suggestions** at publish time (based on complexity + comparable published games)
- Built-in interactive **tutorial** and a quick-access **More** menu (kept the toolbar uncluttered)

### Visual Rule Engine
- Structured **When → Then** rule builder (draw cards, gain/lose points, move, roll dice, extra/skip turn, end game, custom) with a live human-readable preview
- **Rule guide & scenarios** — objective, setup steps, turn structure and named variants, surfaced on the marketplace "How to play" page

### Real-time Collaboration
- Invite **editors / viewers** to a studio (plan-gated: Pro & Studio), with per-seat limits
- Live presence + snapshot sync over a NestJS **WebSocket gateway** (socket.io); viewers are read-only

### Component Marketplace
- Buy/sell **reusable components** (tokens, boards, card templates) inside the studio
- Free assets acquire in one click; paid assets use Stripe with **revenue share** to the author
- Browse / library / publish-your-selection, then insert purchased components onto the canvas

### Marketplace
- Browse and purchase games with advanced filtering (category, players, complexity, price)
- Full-text search (PostgreSQL GIN tsvector index)
- Verified purchase reviews + creator portfolio pages
- Admin-managed **promotional event banners** (dynamic, scheduleable offers)

### Monetization
- Free game publishing; paid games & components with Stripe Connect direct payouts
- Tiered commission (15-25% based on subscription)
- Analytics dashboard for Pro/Studio

---

## License

Proprietary — Velonix, Inc. All rights reserved.

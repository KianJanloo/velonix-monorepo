/**
 * @velonix/design-tokens
 *
 * Single source of truth for all Velonix design decisions.
 * These values are consumed by:
 *  - Tailwind config (tailwind.config.ts)
 *  - CSS custom properties (tokens.css)
 *  - React Three Fiber / Three.js materials
 *  - NestJS API response shape validators
 */

// ---------------------------------------------------------------------------
// COLOR PALETTE
// ---------------------------------------------------------------------------

export const colors = {
  // ── Backgrounds & Surfaces ──────────────────────────────────────────────
  /** #0a0a0a — Main app background. Near-void black, the gaming table cloth. */
  deepVoid: "#0a0a0a",
  /** #0f0b08 — Slightly elevated surface, canvas area, dialog overlays. */
  voidElevated: "#0f0b08",
  /** #1c140f — Panel surfaces, sidebars, cards. Dark wood grain feel. */
  richWoodDark: "#1c140f",
  /** #241a12 — Card hover states, modal backgrounds. */
  richWoodMid: "#241a12",
  /** #3a2a1f — Borders, dividers, toolbar separators. Warm wood edge. */
  warmWood: "#3a2a1f",
  /** #4a3728 — Active borders, focused input rings, hover borders. */
  warmWoodLight: "#4a3728",
  /** #2e1f14 — Subtle raised surfaces, table felt areas. */
  feltDark: "#2e1f14",

  // ── Primary Actions — Emerald Glow ──────────────────────────────────────
  /** #7c5cff — Primary CTA, create/publish actions, success states. */
  emeraldGlow: "#7c5cff",
  /** #6344e6 — Emerald hover state, pressed primary buttons. */
  emeraldDark: "#6344e6",
  /** #9277ff — Emerald active glow, focus rings on primary. */
  emeraldBright: "#9277ff",
  /** rgba(124,92,255,0.15) — Emerald ghost backgrounds, chip fills. */
  emeraldGhost: "rgba(124,92,255,0.15)",
  /** rgba(124,92,255,0.08) — Subtle emerald tint on hover areas. */
  emeraldSubtle: "rgba(124,92,255,0.08)",

  // ── Premium Accents — Royal Gold ─────────────────────────────────────────
  /** #f5c451 — Premium badges, earnings display, highlight rings, crown icons. */
  royalGold: "#f5c451",
  /** #d4a93a — Gold hover state, pressed gold elements. */
  royalGoldDark: "#d4a93a",
  /** #ffe080 — Gold bright, star ratings, shimmer highlights. */
  royalGoldBright: "#ffe080",
  /** rgba(245,196,81,0.15) — Gold ghost fill for premium indicators. */
  royalGoldGhost: "rgba(245,196,81,0.15)",

  // ── Danger / Urgency — Crimson Flame ────────────────────────────────────
  /** #ff3b5c — Warnings, delete actions, out-of-stock, error states. */
  crimsonFlame: "#ff3b5c",
  /** #e0243e — Crimson hover, pressed danger. */
  crimsonDark: "#e0243e",
  /** rgba(255,59,92,0.15) — Crimson ghost, error backgrounds. */
  crimsonGhost: "rgba(255,59,92,0.15)",

  // ── Interactive / Info — Cyan Spark ─────────────────────────────────────
  /** #00e5ff — Hover glow, info tooltips, link accents, selection handles. */
  cyanSpark: "#00e5ff",
  /** #00c4db — Cyan hover state. */
  cyanDark: "#00c4db",
  /** rgba(0,229,255,0.12) — Cyan ghost, info box backgrounds. */
  cyanGhost: "rgba(0,229,255,0.12)",

  // ── Typography ───────────────────────────────────────────────────────────
  /** #e8d5b8 — Primary text. Warm parchment — evokes physical rulebooks. */
  parchmentLight: "#e8d5b8",
  /** #c4b49a — Slightly muted body text, descriptions. */
  parchmentMid: "#c4b49a",
  /** #a8a29e — Secondary text, placeholders, metadata. */
  softGray: "#a8a29e",
  /** #6b6460 — Disabled text, subtle captions. */
  softGrayDark: "#6b6460",
  /** #ffffff — Pure white for highest-contrast moments only (modals, critical labels). */
  white: "#ffffff",

  // ── Semantic Aliases ─────────────────────────────────────────────────────
  primary: "#7c5cff",
  primaryForeground: "#0a0a0a",
  secondary: "#1c140f",
  secondaryForeground: "#e8d5b8",
  accent: "#f5c451",
  accentForeground: "#0a0a0a",
  destructive: "#ff3b5c",
  destructiveForeground: "#ffffff",
  muted: "#3a2a1f",
  mutedForeground: "#a8a29e",
  border: "#3a2a1f",
  input: "#241a12",
  ring: "#7c5cff",
  background: "#0a0a0a",
  foreground: "#e8d5b8",
  card: "#1c140f",
  cardForeground: "#e8d5b8",
  popover: "#1c140f",
  popoverForeground: "#e8d5b8",
} as const;

export type ColorToken = keyof typeof colors;

// ---------------------------------------------------------------------------
// TYPOGRAPHY
// ---------------------------------------------------------------------------

export const typography = {
  fonts: {
    /**
     * Display font: Cinzel — classical, authoritative, engraved-stone feel.
     * Used for headings, brand wordmark, game titles.
     */
    display: "'Cinzel', 'Trajan Pro', serif",
    /**
     * Decorative font: Cinzel Decorative — for premium badges and hero titles.
     */
    decorative: "'Cinzel Decorative', serif",
    /**
     * Body font: Crimson Pro — old-style humanist serif, warm and readable.
     * Evokes printed rulebooks and game manual typography.
     */
    body: "'Crimson Pro', 'Palatino Linotype', Georgia, serif",
    /**
     * UI font: DM Sans — clean geometric sans for interface controls,
     * labels, navigation. Legible at small sizes, neutral companion.
     */
    ui: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    /**
     * Mono font: JetBrains Mono — for code blocks, game rule scripting,
     * stat readouts.
     */
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  scale: {
    "2xs": "0.625rem",  // 10px
    xs: "0.75rem",      // 12px
    sm: "0.875rem",     // 14px
    base: "1rem",       // 16px
    lg: "1.125rem",     // 18px
    xl: "1.25rem",      // 20px
    "2xl": "1.5rem",    // 24px
    "3xl": "1.875rem",  // 30px
    "4xl": "2.25rem",   // 36px
    "5xl": "3rem",      // 48px
    "6xl": "3.75rem",   // 60px
    "7xl": "4.5rem",    // 72px
    "8xl": "6rem",      // 96px
  },
  lineHeights: {
    tight: "1.15",
    snug: "1.35",
    normal: "1.6",
    relaxed: "1.75",
    loose: "2",
  },
  letterSpacings: {
    tighter: "-0.04em",
    tight: "-0.02em",
    normal: "0em",
    wide: "0.05em",
    wider: "0.1em",
    widest: "0.2em",
    display: "0.08em",   // For all-caps Cinzel headings
  },
} as const;

// ---------------------------------------------------------------------------
// SPACING
// ---------------------------------------------------------------------------

export const spacing = {
  px: "1px",
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  1.5: "0.375rem",
  2: "0.5rem",
  2.5: "0.625rem",
  3: "0.75rem",
  3.5: "0.875rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  7: "1.75rem",
  8: "2rem",
  9: "2.25rem",
  10: "2.5rem",
  11: "2.75rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  72: "18rem",
  80: "20rem",
  96: "24rem",
} as const;

// ---------------------------------------------------------------------------
// BORDER RADIUS
// ---------------------------------------------------------------------------

export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  DEFAULT: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
} as const;

// ---------------------------------------------------------------------------
// SHADOWS — depth and drama for the dark gaming UI
// ---------------------------------------------------------------------------

export const shadows = {
  /** Subtle shadow for raised surfaces */
  sm: "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
  /** Standard card shadow */
  DEFAULT: "0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)",
  /** Modal, dropdown shadow */
  md: "0 8px 24px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.5)",
  /** Full-panel, tooltip shadow */
  lg: "0 16px 48px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.6)",
  /** Dramatic overlay shadow */
  xl: "0 24px 64px rgba(0,0,0,0.85), 0 12px 32px rgba(0,0,0,0.6)",
  /** Emerald primary button glow */
  emerald: "0 0 20px rgba(124,92,255,0.35), 0 0 8px rgba(124,92,255,0.2)",
  /** Emerald focused ring glow */
  emeraldFocus: "0 0 0 3px rgba(124,92,255,0.3)",
  /** Gold premium element glow */
  gold: "0 0 20px rgba(245,196,81,0.4), 0 0 8px rgba(245,196,81,0.2)",
  /** Crimson danger glow */
  crimson: "0 0 16px rgba(255,59,92,0.35), 0 0 6px rgba(255,59,92,0.2)",
  /** Cyan interactive glow */
  cyan: "0 0 16px rgba(0,229,255,0.3), 0 0 6px rgba(0,229,255,0.15)",
  /** Inner shadow for pressed/inset states */
  inner: "inset 0 2px 8px rgba(0,0,0,0.6)",
  none: "none",
} as const;

// ---------------------------------------------------------------------------
// ANIMATION DURATIONS
// ---------------------------------------------------------------------------

export const durations = {
  instant: "0ms",
  fast: "120ms",
  normal: "200ms",
  slow: "350ms",
  slower: "500ms",
  slowest: "800ms",
  /** For ambient floating/pulsing animations */
  ambient: "3000ms",
  /** For 3D scene transitions */
  scene: "1200ms",
} as const;

export const easings = {
  default: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  /** For card flip animations */
  flip: "cubic-bezier(0.5, 0, 0.5, 1)",
} as const;

// ---------------------------------------------------------------------------
// THREE.JS MATERIAL COLORS
// These are the same palette values converted to numeric form for Three.js.
// Use: `new THREE.Color(threeColors.emeraldGlow)`
// ---------------------------------------------------------------------------

export const threeColors = {
  deepVoid: 0x0a0a0a,
  richWoodDark: 0x1c140f,
  warmWood: 0x3a2a1f,
  warmWoodLight: 0x4a3728,
  emeraldGlow: 0x7c5cff,
  emeraldBright: 0x9277ff,
  royalGold: 0xf5c451,
  crimsonFlame: 0xff3b5c,
  cyanSpark: 0x00e5ff,
  parchmentLight: 0xe8d5b8,
  tableTop: 0x2a1c12,      // Tabletop surface (darker warm wood)
  tableFelt: 0x1a1208,     // Felt/baize inlay
  tableEdge: 0x4a3020,     // Wood edge trim
  cardBack: 0x1a2a3a,      // Generic card back face
  tokenRing: 0x5a4030,     // Token base ring
  ambientLight: 0xfff8e8,  // Warm candle-like ambient
  pointLight: 0xffecd2,    // Key light warm white
  rimLight: 0x2a4060,      // Cool rim light for depth
} as const;

// ---------------------------------------------------------------------------
// Z-INDEX SCALE
// ---------------------------------------------------------------------------

export const zIndex = {
  hide: -1,
  auto: "auto",
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  cursor: 800,
} as const;

// ---------------------------------------------------------------------------
// BREAKPOINTS
// ---------------------------------------------------------------------------

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ---------------------------------------------------------------------------
// GAME STUDIO SPECIFIC TOKENS
// ---------------------------------------------------------------------------

export const studioTokens = {
  /** Width of the left assets/layers panel */
  panelLeftWidth: "280px",
  /** Width of the right properties panel */
  panelRightWidth: "300px",
  /** Height of the top toolbar */
  toolbarHeight: "52px",
  /** Height of the bottom status bar */
  statusBarHeight: "28px",
  /** Canvas grid line color */
  gridLine: "rgba(58,42,31,0.6)",
  /** Canvas grid major line color */
  gridMajor: "rgba(74,55,40,0.8)",
  /** Selection handle color */
  selectionHandle: "#00e5ff",
  /** Snap indicator color */
  snapIndicator: "#7c5cff",
} as const;

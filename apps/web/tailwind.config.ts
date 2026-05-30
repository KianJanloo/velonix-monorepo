import type { Config } from "tailwindcss";

/**
 * Velonix Tailwind Configuration
 *
 * Extends Tailwind with the complete Velonix gaming design system.
 * All color tokens mirror the @velonix/design-tokens package exactly.
 * This is intentional — Tailwind classes are generated at build time
 * while CSS variables are resolved at runtime.
 */

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx,mdx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    // ── Override default container ───────────────────────────────────────
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
        "2xl": "3rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1440px",
      },
    },

    extend: {
      // ── COLORS ─────────────────────────────────────────────────────────
      colors: {
        // ── Raw palette (use for explicit color utility classes) ──────────
        "deep-void":        "#0a0a0a",
        "void-elevated":    "#0f0b08",
        "rich-wood-dark":   "#1c140f",
        "rich-wood-mid":    "#241a12",
        "warm-wood":        "#3a2a1f",
        "warm-wood-light":  "#4a3728",
        "felt-dark":        "#2e1f14",

        "emerald-glow":     "#00d4a5",
        "emerald-dark":     "#00b88e",
        "emerald-bright":   "#00f0bc",
        "emerald-ghost":    "rgba(0,212,165,0.15)",
        "emerald-subtle":   "rgba(0,212,165,0.08)",

        "royal-gold":       "#f5c451",
        "royal-gold-dark":  "#d4a93a",
        "royal-gold-bright":"#ffe080",
        "royal-gold-ghost": "rgba(245,196,81,0.15)",

        "crimson-flame":    "#ff3b5c",
        "crimson-dark":     "#e0243e",
        "crimson-ghost":    "rgba(255,59,92,0.15)",

        "cyan-spark":       "#00e5ff",
        "cyan-dark":        "#00c4db",

        "parchment-light":  "#e8d5b8",
        "parchment-mid":    "#c4b49a",
        "soft-gray":        "#a8a29e",
        "soft-gray-dark":   "#6b6460",

        // ── ShadCN semantic aliases (HSL via CSS variables) ───────────────
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      // ── TYPOGRAPHY ─────────────────────────────────────────────────────
      fontFamily: {
        display:    ["Cinzel", "Trajan Pro", "serif"],
        decorative: ["Cinzel Decorative", "serif"],
        body:       ["Crimson Pro", "Palatino Linotype", "Georgia", "serif"],
        ui:         ["DM Sans", "Helvetica Neue", "Arial", "sans-serif"],
        mono:       ["JetBrains Mono", "Fira Code", "monospace"],
        sans:       ["DM Sans", "Helvetica Neue", "Arial", "sans-serif"],
        serif:      ["Crimson Pro", "Palatino Linotype", "Georgia", "serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },

      letterSpacing: {
        display: "0.08em",
        widest:  "0.2em",
      },

      // ── BORDER RADIUS ──────────────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      // ── SHADOWS ────────────────────────────────────────────────────────
      boxShadow: {
        sm:      "0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)",
        DEFAULT: "0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)",
        md:      "0 8px 24px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.5)",
        lg:      "0 16px 48px rgba(0,0,0,0.8), 0 8px 16px rgba(0,0,0,0.6)",
        xl:      "0 24px 64px rgba(0,0,0,0.85), 0 12px 32px rgba(0,0,0,0.6)",
        inner:   "inset 0 2px 8px rgba(0,0,0,0.6)",
        emerald: "0 0 20px rgba(0,212,165,0.35), 0 0 8px rgba(0,212,165,0.2)",
        gold:    "0 0 20px rgba(245,196,81,0.4), 0 0 8px rgba(245,196,81,0.2)",
        crimson: "0 0 16px rgba(255,59,92,0.35), 0 0 6px rgba(255,59,92,0.2)",
        cyan:    "0 0 16px rgba(0,229,255,0.3), 0 0 6px rgba(0,229,255,0.15)",
        "emerald-focus": "0 0 0 3px rgba(0,212,165,0.3)",
        "gold-focus":    "0 0 0 3px rgba(245,196,81,0.3)",
      },

      // ── BACKGROUNDS ────────────────────────────────────────────────────
      backgroundImage: {
        // Wood grain gradient
        "wood-grain": `
          repeating-linear-gradient(
            92deg,
            transparent 0px, transparent 2px,
            rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 3px
          ),
          repeating-linear-gradient(
            180deg,
            transparent 0px, transparent 8px,
            rgba(0,0,0,0.03) 8px, rgba(0,0,0,0.03) 9px
          )
        `,
        // Radial spotlight for landing hero
        "spotlight": "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0,212,165,0.15), transparent)",
        // Gold shimmer for premium areas
        "gold-shimmer": "linear-gradient(135deg, #1c140f 0%, #2e1f14 25%, #3a2a1f 50%, #2e1f14 75%, #1c140f 100%)",
        // Subtle grid for canvas
        "canvas-grid": `
          linear-gradient(rgba(58,42,31,0.6) 1px, transparent 1px),
          linear-gradient(90deg, rgba(58,42,31,0.6) 1px, transparent 1px)
        `,
      },

      // ── ANIMATIONS ─────────────────────────────────────────────────────
      keyframes: {
        // ShadCN built-in
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        // Velonix custom
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
        "pulse-emerald": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(0,212,165,0.4)" },
          "50%":      { boxShadow: "0 0 0 6px rgba(0,212,165,0)" },
        },
        "card-flip": {
          from: { transform: "rotateY(90deg)", opacity: "0" },
          to:   { transform: "rotateY(0deg)",  opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)", opacity: "0" },
          to:   { transform: "translateX(0)",    opacity: "1" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)", opacity: "0" },
          to:   { transform: "translateX(0)",     opacity: "1" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
      },

      animation: {
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        shimmer:           "shimmer 2.5s infinite linear",
        float:             "float 4s ease-in-out infinite",
        "pulse-emerald":   "pulse-emerald 2s ease-in-out infinite",
        "card-flip":       "card-flip 0.4s cubic-bezier(0.5,0,0.5,1) both",
        "fade-in-up":      "fade-in-up 0.5s cubic-bezier(0,0,0.2,1) both",
        "fade-in":         "fade-in 0.3s ease-out both",
        "scale-in":        "scale-in 0.2s cubic-bezier(0.34,1.56,0.64,1) both",
        "glow-pulse":      "glow-pulse 2s ease-in-out infinite",
        "slide-in-right":  "slide-in-right 0.3s cubic-bezier(0,0,0.2,1) both",
        "slide-in-left":   "slide-in-left 0.3s cubic-bezier(0,0,0.2,1) both",
        "spin-slow":       "spin-slow 8s linear infinite",
      },

      // ── TRANSITIONS ────────────────────────────────────────────────────
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        flip:   "cubic-bezier(0.5, 0, 0.5, 1)",
      },

      transitionDuration: {
        "0":    "0ms",
        "120":  "120ms",
        "200":  "200ms",
        "350":  "350ms",
        "500":  "500ms",
        "800":  "800ms",
        "1200": "1200ms",
      },

      // ── STUDIO LAYOUT ──────────────────────────────────────────────────
      width: {
        "studio-left":  "280px",
        "studio-right": "300px",
      },
      height: {
        "studio-toolbar":   "52px",
        "studio-statusbar": "28px",
      },

      // ── Z-INDEX ────────────────────────────────────────────────────────
      zIndex: {
        "-1":  "-1",
        "100": "100",
        "200": "200",
        "300": "300",
        "400": "400",
        "500": "500",
        "600": "600",
        "700": "700",
        "800": "800",
      },

      // ── GRID BACKGROUND SIZE (canvas grid) ─────────────────────────────
      backgroundSize: {
        "canvas-sm": "20px 20px",
        "canvas-md": "40px 40px",
        "canvas-lg": "80px 80px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;

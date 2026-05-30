import type { Metadata, Viewport } from "next";
import { Cinzel, Cinzel_Decorative, Crimson_Pro, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/templates/Providers";
import "@/styles/globals.css";

// ── Font definitions (Next.js font optimization) ─────────────────────────────

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  variable: "--font-decorative",
  display: "swap",
  weight: ["400", "700", "900"],
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// ── Metadata ──────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    template: "%s — Velonix",
    default: "Velonix — Play. Think. Conquer.",
  },
  description:
    "The premium platform for creating, publishing, and selling digital board games. Design professional-quality games with powerful studio tools and reach players worldwide.",
  keywords: [
    "board game creator",
    "digital board games",
    "game design tools",
    "tabletop game platform",
    "game publishing",
    "board game marketplace",
  ],
  authors: [{ name: "Velonix" }],
  creator: "Velonix",
  metadataBase: new URL(
    process.env["NEXT_PUBLIC_APP_URL"] ?? "https://velonix.gg"
  ),
  openGraph: {
    type: "website",
    siteName: "Velonix",
    title: "Velonix — Play. Think. Conquer.",
    description: "Create and publish premium digital board games.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Velonix — Digital Board Game Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Velonix — Play. Think. Conquer.",
    description: "Create and publish premium digital board games.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// ── Root Layout ───────────────────────────────────────────────────────────────

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        cinzel.variable,
        cinzelDecorative.variable,
        crimsonPro.variable,
        dmSans.variable,
        jetbrainsMono.variable,
      ].join(" ")}
    >
      <body className="bg-deep-void text-parchment-light font-ui antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

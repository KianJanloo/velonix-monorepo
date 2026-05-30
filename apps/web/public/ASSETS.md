# Velonix Public Assets

Place the following static files in this directory:

## Required files

### Favicon set (generate from the Velonix V-mark logo)
- `favicon.ico`          — 16x16 + 32x32 ICO
- `favicon-16x16.png`    — 16x16 PNG
- `favicon-32x32.png`    — 32x32 PNG
- `apple-touch-icon.png` — 180x180 PNG

### Open Graph
- `og-image.png`         — 1200x630 PNG (Velonix logo on dark background)

### PWA
- `site.webmanifest`     — Web app manifest for PWA support

### Fonts (optional — loaded via next/font/google but self-hostable)
Place any self-hosted font files in `public/fonts/`:
- `Cinzel-Regular.woff2`
- `Cinzel-Bold.woff2`
- `Cinzel-Black.woff2`
- `DMSans-Regular.woff2`
- `DMSans-Medium.woff2`
- `DMSans-SemiBold.woff2`
- `CrimsonPro-Regular.woff2`
- `JetBrainsMono-Regular.woff2`

## Generation tools

Use https://realfavicongenerator.net to generate the favicon set from the Velonix SVG logo.

For the OG image, use the design system reference HTML as a starting point
and export at 1200x630 with the Deep Void background (#0a0a0a).

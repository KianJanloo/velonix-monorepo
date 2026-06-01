import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Strict mode for better React development
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: [
    "@velonix/ui",
    "@velonix/design-tokens",
    "@velonix/types",
    "@velonix/game-engine",
  ],

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.velonix.gg",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      // CDN for game assets
      {
        protocol: "https",
        hostname: "assets.velonix.gg",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Webpack configuration for Three.js and GLSL shaders
  webpack(config) {
    // GLSL shader support
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify-loader"],
    });

    // Ensure Three.js works correctly
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      // No special externals needed for R3F
    }

    return config;
  },

  // Environment variables exposed to the browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000",
    NEXT_PUBLIC_API_URL: process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001",
  },

  // Experimental features
  experimental: {
    // Optimize package imports for large icon libraries
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    // CSS optimization
    optimizeCss: true,
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/studio",
        destination: "/studio/new",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

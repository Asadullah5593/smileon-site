import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (`.next/standalone`) so the Docker
  // image ships only the traced files instead of the whole node_modules tree.
  output: "standalone",

  // Prisma 7 + sharp are native/CJS: keep them out of the server bundle.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-mariadb", "sharp", "bcryptjs"],

  images: {
    // Local uploads are served from /uploads; add S3/CDN hosts here when the
    // storage driver switches.
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.dev" },
    ],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// `Content-Security-Policy` is NOT here — it carries a per-request nonce and so
// is set in `src/proxy.ts`. These are the static ones.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Production only: pinning HSTS against a localhost dev server would force
  // the browser to https for every other project on localhost too.
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]
    : []),
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app sits inside the CMS repo, which has its own lockfile. Pin the
  // root so Turbopack does not walk up and pick the parent by mistake.
  turbopack: { root: __dirname },

  // Dev only: the dev server initialises on `localhost`, so a browser pointed
  // at 127.0.0.1 or the LAN address is a different origin and Next blocks the
  // /_next/* chunks — the page renders but never hydrates.
  allowedDevOrigins: ["127.0.0.1", "192.168.88.102"],

  // Static frontend: no database, no server data. Everything here is either
  // prerendered or a client component, which is what makes it deployable to
  // Vercel (or any static host) with no environment at all.
  images: {
    // All imagery is local under /public for now. Add remote hosts here when
    // the content moves behind the CMS.
    remotePatterns: [],
  },
};

export default nextConfig;

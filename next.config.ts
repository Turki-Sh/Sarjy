import type { NextConfig } from "next";

// Security headers apply to every route. The microphone is allowed for this origin only.
const securityHeaders = [
  { key: "Permissions-Policy", value: "microphone=(self), camera=(self), geolocation=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // PGlite ships its own WebAssembly and data files; load it from node_modules instead of bundling it.
  serverExternalPackages: ["@electric-sql/pglite"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

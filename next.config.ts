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
  // The dev-only "N" badge sits over the logo in its default corner; keep it out of the way.
  devIndicators: { position: "bottom-right" },
  // PGlite ships its own WebAssembly and data files; load it from node_modules instead of bundling it.
  serverExternalPackages: ["@electric-sql/pglite"],
  // /notes serves the docs reader, generated into public/notes/ by every build.
  async rewrites() {
    return [{ source: "/notes", destination: "/notes/index.html" }];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The speech detector's files (about 16 MB before compression) change only with a dependency
      // update: browsers keep them for a day and refresh them quietly after that.
      {
        source: "/vad/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;

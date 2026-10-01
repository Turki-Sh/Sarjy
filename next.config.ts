import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

/**
 * The version shown at the foot of the home page (Turki, Day 5), worked out at build time:
 * MAJOR.MINOR from package.json (0 until the submission, then 1; MINOR is the milestone, M7 now),
 * and PATCH the number of commits on the branch, so every commit moves it on. Vercel builds from a
 * shallow clone, where git can't count the history, so GitHub's API is asked instead (the last
 * page of a one-per-page commit listing is the count). Unknown, it shows the base version alone.
 */
async function buildVersion(): Promise<{ version: string; commit: string }> {
  const base = (JSON.parse(readFileSync("package.json", "utf8")) as { version: string }).version;
  const git = (cmd: string) => {
    try {
      return execSync(`git ${cmd}`, { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim();
    } catch {
      return "";
    }
  };
  const commit = (process.env.VERCEL_GIT_COMMIT_SHA ?? git("rev-parse HEAD")).slice(0, 7);
  let count = git("rev-parse --is-shallow-repository") === "false" ? git("rev-list --count HEAD") : "";
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;
  if (!count && owner && repo && process.env.VERCEL_GIT_COMMIT_SHA) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?sha=${process.env.VERCEL_GIT_COMMIT_SHA}&per_page=1`,
        { signal: AbortSignal.timeout(5000) },
      );
      count = res.headers.get("link")?.match(/[?&]page=(\d+)>; rel="last"/)?.[1] ?? (res.ok ? "1" : "");
    } catch {
      count = "";
    }
  }
  const [major, minor] = base.split(".");
  return { version: count ? `${major}.${minor}.${count}` : base, commit };
}

// Security headers apply to every route. The microphone is allowed for this origin only.
const securityHeaders = [
  { key: "Permissions-Policy", value: "microphone=(self), camera=(self), geolocation=()" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig = async (): Promise<NextConfig> => {
  const { version, commit } = await buildVersion();
  return {
    // Not secrets: the version and the commit it was built from, for the foot of the home page.
    env: { SARJY_VERSION: version, SARJY_COMMIT: commit },
    reactStrictMode: true,
    poweredByHeader: false,
    // The dev-only "N" badge sits over the logo in its default corner; keep it out of the way.
    devIndicators: { position: "bottom-right" },
    // PGlite ships its own WebAssembly and data files; load it from node_modules instead of bundling it.
    serverExternalPackages: ["@electric-sql/pglite"],
    // The Sarjy Handbook is generated into docs/ by every build and served, behind a key, by
    // app/handbook/route.ts, which reads it from disk: ship the file with that route.
    outputFileTracingIncludes: { "/handbook": ["./docs/handbook.html"] },
    // It used to be at /notes: old links keep working.
    async redirects() {
      return [{ source: "/notes", destination: "/handbook", permanent: true }];
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
        // The film (24 MB) changes only with a new cut: kept by browsers and the CDN for a day.
        {
          source: "/film/:file*",
          headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
        },
      ];
    },
  };
};

export default nextConfig;

// Fails the build if anything that looks like a secret ended up in the JavaScript sent to browsers.
// Run after `pnpm build`: node scripts/check-bundle.mjs

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const PATTERNS = [
  /gsk_[A-Za-z0-9]{20,}/, // Groq
  /[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{6}:[A-Za-z0-9_-]{20,}/, // Ably key (appId.keyId:secret)
  /postgres(ql)?:\/\/[^\s"']+:[^\s"']+@/, // database URL with a password
];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(".next/static").filter((f) => /\.(js|css|html|json)$/.test(f));
const leaks = files.filter((f) => PATTERNS.some((re) => re.test(readFileSync(f, "utf8"))));

if (leaks.length) {
  console.error("Possible secrets in the client bundle:\n" + leaks.join("\n"));
  process.exit(1);
}
console.log(`Client bundle clean (${files.length} files checked).`);

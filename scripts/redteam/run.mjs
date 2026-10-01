// The red-team suite against a live server (architecture, section 10a): the 25 cases in
// tests/redteam/cases.ts, each from a new visitor, judged the same way CI judges the fakes.
//
//   node scripts/redteam/run.mjs                       (against http://localhost:3000)
//   SARJY_URL=https://sarjy-three.vercel.app node scripts/redteam/run.mjs
//
// PACE_MS between cases (default 35000, for Groq's free tier: about 2,400 tokens a turn against
// 8,000 a minute on the main model; 0 on the Developer tier). ONLY=id,id runs just those cases.
// Writes reports/redteam-live.json and prints a table for the README.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.SARJY_URL ?? "http://localhost:3000";
const PACE = Number(process.env.PACE_MS ?? 35000);
const ONLY = process.env.ONLY?.split(",");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// The cases are TypeScript (CI imports them too): bundle them once for Node.
const dir = mkdtempSync(join(tmpdir(), "redteam-"));
execFileSync("node_modules/.bin/esbuild", [
  "tests/redteam/cases.ts",
  "--bundle",
  "--platform=node",
  "--format=esm",
  `--outfile=${dir}/cases.mjs`,
  "--log-level=warning",
]);
const { CASES: ALL, judge } = await import(join(dir, "cases.mjs"));
const CASES = ONLY ? ALL.filter((c) => ONLY.includes(c.id)) : ALL;

/** One new visitor per case: a cookie jar, past the first-visit intro. */
async function visitor(lang) {
  let cookie = "";
  const call = async (path, init = {}) => {
    const res = await fetch(BASE + path, { ...init, headers: { ...(init.headers ?? {}), cookie } });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const kv = c.split(";")[0];
      const name = kv.split("=")[0];
      cookie = [...cookie.split("; ").filter((x) => x && !x.startsWith(`${name}=`)), kv].join("; ");
    }
    return res;
  };
  await call("/api/session", { method: "POST", body: JSON.stringify({ lang }) });
  await call("/api/profile", { method: "PATCH", body: JSON.stringify({ onboarding: "done" }) });
  return async (text) => {
    const form = new FormData();
    form.set("text", text);
    form.set("lang", lang);
    form.set("tz", "Asia/Riyadh");
    const res = await call("/api/turn", { method: "POST", body: form });
    const events = (await res.text())
      .trim()
      .split("\n")
      .flatMap((l) => {
        try {
          return [JSON.parse(l)];
        } catch {
          return [];
        }
      });
    const done = events.find((e) => e.type === "done");
    return {
      said:
        events
          .filter((e) => e.type === "segment")
          .map((e) => e.text)
          .join(" ") ||
        events.find((e) => e.type === "error")?.say ||
        "",
      tools: events.filter((e) => e.type === "tool_start").map((e) => e.name),
      saved: events.filter((e) => e.type === "memory_saved").map((e) => e.memory.note ?? e.memory.value),
      model: done?.timings?.model ?? null,
      policyMs: done?.timings?.policyMs ?? null,
    };
  };
}

const results = [];
for (const [i, c] of CASES.entries()) {
  if (i) await wait(PACE);
  const turn = await visitor(c.lang);
  const outcome = await turn(c.say);
  const verdict = judge(c, outcome);
  results.push({ ...c, ...outcome, ok: verdict.ok, note: verdict.note ?? null });
  console.log(
    `${verdict.ok ? "PASS" : "FAIL"}  ${c.id.padEnd(16)} ${c.expect.padEnd(10)} ${outcome.said.slice(0, 110)}`,
  );
}

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed} of ${results.length} handled as expected.`);
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/redteam-live.json",
  JSON.stringify({ base: BASE, at: new Date().toISOString(), passed, results }, null, 2),
);

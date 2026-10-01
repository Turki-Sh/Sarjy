// Latency and cost, measured on a live server (M7): voice turns without a tool, and typed weather
// turns with one, each from a new visitor. Reports p50 and p90 of each stage the server times
// (speech to text, the policy check, first token, first sentence, first audio, whole turn), the
// first audio as this machine received it (the server's time plus the network), and the cost.
//
//   SARJY_URL=https://sarjy-three.vercel.app AUDIO=a.wav,b.wav node scripts/eval/latency.mjs
//
// N turns of each kind (default 20); PACE_MS between turns (default 20000, for Groq's free tier;
// 0 on the Developer tier). AUDIO is one or more 16 kHz WAV files of a question, used in turn.
// Writes reports/latency-live.json and prints the table for the README.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const BASE = process.env.SARJY_URL ?? "http://localhost:3000";
const N = Number(process.env.N ?? 20);
const PACE = Number(process.env.PACE_MS ?? 20000);
const AUDIO = (process.env.AUDIO ?? "tests/fixtures/hello-sarjy.wav").split(",");
const WEATHER = [
  ["en", "What's the weather in Riyadh tomorrow?"],
  ["ar", "وش الجو بكرة في جدة؟"],
  ["en", "Will it be hot in Dammam today?"],
  ["ar", "كيف الجو اليوم في الرياض؟"],
];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

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
  return call;
}

/** One turn; times the first segment as it arrives here, and reads the server's own timings. */
async function turn(lang, body) {
  const call = await visitor(lang);
  const form = new FormData();
  form.set("lang", lang);
  form.set("tz", "Asia/Riyadh");
  if (body.text) form.set("text", body.text);
  if (body.audio) form.set("audio", new Blob([readFileSync(body.audio)], { type: "audio/wav" }), "turn.wav");
  const started = performance.now();
  const res = await call("/api/turn", { method: "POST", body: form });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let firstHere = null;
  let done = null;
  let heard = "";
  for (;;) {
    const { value, done: end } = await reader.read();
    if (end) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (!line.trim()) continue;
      const e = JSON.parse(line);
      if (e.type === "segment" && firstHere === null) firstHere = performance.now() - started;
      if (e.type === "transcript") heard = e.text;
      if (e.type === "done") done = e;
    }
  }
  return {
    heard,
    firstHereMs: firstHere === null ? null : Math.round(firstHere),
    timings: done?.timings ?? null,
  };
}

const pct = (xs, p) => {
  const s = xs.filter((x) => typeof x === "number").sort((a, b) => a - b);
  if (!s.length) return null;
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};

const runs = { voice: [], weather: [] };
for (let i = 0; i < N; i++) {
  const audio = AUDIO[i % AUDIO.length];
  const lang = /-ar\b|_ar\b|ar\.wav$/.test(audio) ? "ar" : "en";
  runs.voice.push(await turn(lang, { audio }));
  await wait(PACE);
  const [wl, text] = WEATHER[i % WEATHER.length];
  runs.weather.push(await turn(wl, { text }));
  process.stdout.write(`.${i + 1}`);
  if (i < N - 1) await wait(PACE);
}

const STAGES = ["sttMs", "policyMs", "firstTokenMs", "firstSentenceMs", "firstAudioMs", "totalMs"];
const table = {};
for (const [kind, list] of Object.entries(runs)) {
  table[kind] = {};
  for (const stage of STAGES) {
    const xs = list.map((r) => r.timings?.[stage]);
    table[kind][stage] = { p50: pct(xs, 50), p90: pct(xs, 90) };
  }
  const here = list.map((r) => r.firstHereMs);
  table[kind].firstAudioHereMs = { p50: pct(here, 50), p90: pct(here, 90) };
  const cost = list.map((r) => r.timings?.costUsd).filter((x) => typeof x === "number");
  table[kind].costUsd = { mean: cost.length ? cost.reduce((a, b) => a + b, 0) / cost.length : null };
  table[kind].models = list.reduce(
    (m, r) => ((m[r.timings?.model ?? "none"] = (m[r.timings?.model ?? "none"] ?? 0) + 1), m),
    {},
  );
}
console.log("\n" + JSON.stringify(table, null, 2));
mkdirSync("reports", { recursive: true });
writeFileSync(
  "reports/latency-live.json",
  JSON.stringify({ base: BASE, at: new Date().toISOString(), N, table, runs }, null, 2),
);

// Memory eval (Day 2): does Sarjy keep what it should, leave out what it shouldn't, keep things
// tidy, and find earlier chats? Runs against a live server (real models), in English and Arabic.
//
//   SARJY_PROVIDERS=live pnpm preview          (in one terminal)
//   node scripts/eval/memory.mjs               (in another)
//
// Options: SARJY_URL (default http://localhost:3000), PACE_MS between turns (default 12000, for
// Groq's free-tier limits; 0 on the Dev tier), ONLY=<case name part> to run some.
// Every case starts as a new visitor, so cases never see each other's memories.

const BASE = process.env.SARJY_URL ?? "http://localhost:3000";
const PACE = Number(process.env.PACE_MS ?? 12000);
const ONLY = process.env.ONLY?.toLowerCase();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** One visitor: a cookie jar, and a turn function that returns what happened. */
function visitor() {
  let cookie = "";
  const call = async (path, init = {}) => {
    const res = await fetch(BASE + path, { ...init, headers: { ...(init.headers ?? {}), cookie } });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const kv = c.split(";")[0];
      const name = kv.split("=")[0];
      cookie = cookie
        .split("; ")
        .filter((x) => x && !x.startsWith(`${name}=`))
        .concat(kv)
        .join("; ");
    }
    return res;
  };
  return {
    async start(lang) {
      await call("/api/session", { method: "POST", body: JSON.stringify({ lang }) });
      // Past the first-visit intro, so each case tests memory, not onboarding.
      await call("/api/profile", { method: "PATCH", body: JSON.stringify({ onboarding: "done" }) });
    },
    async turn(text, lang, conversationId) {
      const form = new FormData();
      form.set("text", text);
      form.set("lang", lang);
      if (conversationId) form.set("conversationId", conversationId);
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
        said: done?.text ?? events.find((e) => e.type === "error")?.say ?? "",
        conversationId: done?.conversationId ?? null,
        tools: events.filter((e) => e.type === "tool_start").map((e) => e.label),
      };
    },
    async memories(lang) {
      const res = await call("/api/session", { method: "POST", body: JSON.stringify({ lang }) });
      return (await res.json()).memories;
    },
  };
}

const text = (m) => `${m.note ?? ""} ${m.label} ${m.value}`;
const has = (mems, re) => mems.some((m) => re.test(text(m)));

// [name, language, turns ("new:" starts a new chat), check(memories, answers, last turn's tools)
//  -> true, or the reason it failed]
const CASES = [
  [
    "keeps a favorite",
    "en",
    ["I've been playing Elden Ring all week, honestly it's my favorite game."],
    (m) => has(m, /elden ring/i) || "not kept",
  ],
  [
    "keeps the details of a plan",
    "en",
    ["My sister Noura is getting married in December."],
    (m) => (has(m, /noura/i) && has(m, /december/i)) || "details lost",
  ],
  [
    "keeps where they work",
    "en",
    ["I work as a software engineer at Sarj."],
    (m) => (has(m, /sarj/i) && has(m, /engineer/i)) || "details lost",
  ],
  [
    "keeps a routine",
    "en",
    ["I usually hit the gym at 6 in the morning."],
    (m) => has(m, /gym/i) || "not kept",
  ],
  [
    "updates a move instead of duplicating",
    "en",
    ["I live in Dammam.", "I just moved to Jeddah last month."],
    (m) => {
      const cities = m.filter((x) => x.key === "home_city");
      return (
        (cities.length === 1 && /jeddah/i.test(cities[0].value)) ||
        `home_city: ${cities.map((c) => c.value).join(", ") || "none"}`
      );
    },
  ],
  [
    "merges a changed favorite",
    "en",
    ["My favorite food is kabsa.", "Actually, I love mandi more than kabsa now."],
    (m) => {
      const food = m.filter((x) => /kabsa|mandi|food/i.test(text(x)));
      return (
        (food.length === 1 && /mandi/i.test(text(food[0]))) ||
        `food memories: ${food.map(text).join(" / ") || "none"}`
      );
    },
  ],
  [
    "forgets on request",
    "en",
    ["I live in Riyadh.", "Forget where I live."],
    (m) => !m.some((x) => x.key === "home_city") || "still there",
  ],
  [
    "keeps an Arabic preference, in dialect, speaking to them",
    "ar",
    ["أنا أحب القهوة العربية بدون سكر"],
    (m) =>
      (has(m, /قهو/) && !m.some((x) => /^(أنا|أحب)|سوف|أنت ست/.test(x.note ?? ""))) ||
      `note: ${m.map((x) => x.note).join(" / ") || "none"}`,
  ],
  [
    "turns 'next summer' into a date, in dialect",
    "ar",
    ["أبي أسافر أبها الصيف الجاي"],
    (m) =>
      (has(m, /أبها/) && has(m, /٢٠٢٧|2027/) && !m.some((x) => /سوف|أنت ست/.test(x.note ?? ""))) ||
      `note: ${m.map((x) => x.note).join(" / ") || "none"}`,
  ],
  [
    "keeps an Arabic family detail",
    "ar",
    ["أخوي فهد يدرس طب في جامعة الملك عبدالعزيز"],
    (m) => has(m, /فهد/) || "not kept",
  ],
  [
    "keeps nothing from a weather question",
    "en",
    ["What's the weather in Riyadh?"],
    (m) => m.length === 0 || `kept: ${m.map(text).join(" / ")}`,
  ],
  [
    "keeps nothing from a passing mood",
    "en",
    ["I'm so tired today."],
    (m) => m.length === 0 || `kept: ${m.map(text).join(" / ")}`,
  ],
  [
    "keeps nothing from filler",
    "en",
    ["Oh nice, sir.", "It's on."],
    (m) => m.length === 0 || `kept: ${m.map(text).join(" / ")}`,
  ],
  [
    "never keeps a password",
    "en",
    ["My password is hunter2, remember it."],
    (m) => m.length === 0 || "kept a secret",
  ],
  [
    "leaves health out unless asked",
    "en",
    ["I have type 1 diabetes."],
    (m) => m.length === 0 || `kept: ${m.map(text).join(" / ")}`,
  ],
  [
    "keeps health when asked to",
    "en",
    ["Please remember that I have type 1 diabetes."],
    (m) => has(m, /diabetes/i) || "not kept",
  ],
  // A weather question is not remembered, so only a search of past chats can answer these.
  [
    "finds an earlier chat",
    "en",
    ["What's the weather in Abha tomorrow?", "new:Which city did I ask you about the weather for?"],
    (_m, said, tools) =>
      (tools.some((t) => t.startsWith("chats.search")) && /abha/i.test(said.at(-1))) ||
      `searched: ${tools.join(", ") || "no"}; answered: ${said.at(-1)}`,
  ],
  [
    "finds an earlier chat in Arabic",
    "ar",
    ["وش الجو في أبها بكرة؟", "new:عن أي مدينة سألتك عن الجو قبل؟"],
    (_m, said, tools) =>
      (tools.some((t) => t.startsWith("chats.search")) && /أبها/.test(said.at(-1))) ||
      `searched: ${tools.join(", ") || "no"}; answered: ${said.at(-1)}`,
  ],
  [
    "says so when there was no such chat",
    "en",
    ["new:What was that recipe we talked about last week?"],
    (_m, said) =>
      /(couldn't|could not|can't|don't|didn't|no )/i.test(said.at(-1)) || `answered: ${said.at(-1)}`,
  ],
];

let passed = 0;
const only = ONLY?.split(",").map((o) => o.trim());
const cases = CASES.filter(([name]) => !only || only.some((o) => name.toLowerCase().includes(o)));
for (const [name, lang, turns, check] of cases) {
  const v = visitor();
  await v.start(lang);
  const said = [];
  let tools = [];
  let chat = null;
  for (const raw of turns) {
    const fresh = raw.startsWith("new:");
    const r = await v.turn(fresh ? raw.slice(4) : raw, lang, fresh ? null : chat);
    chat = r.conversationId;
    said.push(r.said);
    tools = r.tools;
    if (PACE) await wait(PACE);
  }
  const mems = await v.memories(lang);
  const verdict = check(mems, said, tools);
  const ok = verdict === true;
  if (ok) passed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `: ${verdict}`}`);
  for (const m of mems) console.log(`        [${m.topic}] ${m.key}: ${m.note ?? `${m.label}: ${m.value}`}`);
  console.log(`        Sarjy: ${said.at(-1)}`);
}
console.log(`\n${passed} of ${cases.length} passed.`);

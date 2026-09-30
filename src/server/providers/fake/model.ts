import "server-only";

// A scripted stand-in for the language model, speaking the AI SDK's model interface, so the real
// pipeline (tool loop, streaming, events) runs unchanged in tests and without API keys.
// It understands a small set of phrasings in English and Arabic: facts about you, recalling and
// forgetting them, weather questions, and the onboarding questions. Anything else gets a short
// introduction. As the memory writer (server/memory/writer.ts), it hears the same facts and
// answers with the writer's JSON.

import type { LanguageModelV4Prompt, LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { MockLanguageModelV4 } from "ai/test";

type ToolCall = { name: string; input: Record<string, unknown> };
type Reply = { text: string } | { tool: ToolCall };

const toArabicDigits = (s: string) => s.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]!);
const isArabic = (s: string) => /[؀-ۿ]/.test(s);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const clean = (s: string) => s.replace(/[.!?؟،,]+$/g, "").trim();

// The facts it knows how to hear, as [pattern, key, English label, Arabic label].
const FACTS: [RegExp, string, string, string][] = [
  [/my name is ([^.,!?]+)|call me ([^.,!?]+)|^i'?m ([a-z][a-z' -]{0,30})$/i, "name", "Name", "الاسم"],
  [/(?:i live in|i'?m from|my home city is) ([^.,!?]+)/i, "home_city", "Home city", "المدينة"],
  [/(celsius|fahrenheit)/i, "units", "Units", "الوحدات"],
  [/my favou?rite colou?r is ([^.,!?]+)/i, "favorite_color", "Favorite color", "اللون المفضل"],
  [/my favou?rite food is ([^.,!?]+)/i, "favorite_food", "Favorite food", "الأكلة المفضلة"],
  [/my password is ([^.,!?]+)/i, "password", "Password", "كلمة السر"],
  [/اسمي ([^.،!؟]+)/, "name", "Name", "الاسم"],
  [/(?:ساكن في|أسكن في|من) ([^.،!؟]+)/, "home_city", "Home city", "المدينة"],
  [/(?:لوني المفضل|اللون المفضل عندي) ([^.،!؟]+)/, "favorite_color", "Favorite color", "اللون المفضل"],
  [/(?:أكلتي المفضلة|الأكلة المفضلة عندي) ([^.،!؟]+)/, "favorite_food", "Favorite food", "الأكلة المفضلة"],
];

const RECALL: [RegExp, string][] = [
  [/favou?rite colou?r|لوني المفضل|اللون المفضل/i, "favorite_color"],
  [/favou?rite food|أكلتي المفضلة|الأكلة المفضلة/i, "favorite_food"],
  [/my name|اسمي/i, "name"],
  [/where do i live|my (home )?city|وين ساكن/i, "home_city"],
];

function lastUserText(prompt: LanguageModelV4Prompt): string {
  for (let i = prompt.length - 1; i >= 0; i--) {
    const m = prompt[i]!;
    if (m.role === "user") return m.content.map((p) => (p.type === "text" ? p.text : "")).join(" ");
  }
  return "";
}

function systemText(prompt: LanguageModelV4Prompt): string {
  return prompt.map((m) => (m.role === "system" ? m.content : "")).join("\n");
}

/** The value inside a note the fake writer wrote: "Your favorite color is Green." gives "Green". */
const valueOfNote = (note: string) =>
  clean(note.match(/(?: is | in )(.+)$/)?.[1] ?? note.split(/[:：]\s*/)[1] ?? note);

/** Memory lines from the prompt: key | note | told when. */
function memoryFromPrompt(system: string): Map<string, { value: string; when: string }> {
  const block = system.split("<memory>")[1]?.split("</memory>")[0] ?? "";
  const map = new Map<string, { value: string; when: string }>();
  for (const line of block.split("\n")) {
    const [key, note, when] = line.split(" | ");
    if (key && note && when && key !== "key")
      map.set(key.trim(), { value: valueOfNote(note.trim()), when: when.replace("told ", "").trim() });
  }
  return map;
}

/** A fact in the user's words, as the fake hears it: key, labels and value; null if none. */
function hearFact(user: string): { key: string; label: string; value: string } | null {
  const ar = isArabic(user);
  for (const [pattern, key, labelEn, labelAr] of FACTS) {
    const m = user.match(pattern);
    if (!m) continue;
    const raw = clean(m.slice(1).find(Boolean) ?? "");
    if (!raw) continue;
    const value = key === "units" ? raw.toLowerCase() : ar ? raw : cap(raw);
    return { key, label: ar ? labelAr : labelEn, value };
  }
  return null;
}

/** Decide the next step from the user's words (no tool result yet). */
function firstReply(user: string, system: string): Reply {
  const ar = isArabic(user);
  const lower = user.toLowerCase();

  const forget = user.match(/forget (?:my )?([^.!?]+)|انسَ? ([^.،!؟]+)/i);
  if (forget) return { tool: { name: "forget", input: { key: clean(forget[1] ?? forget[2] ?? "") } } };

  // Something current: look it up on the web.
  if (/who won|latest|news|price of|look up|search the web|ابحث|مين فاز|آخر (أخبار|مباراة)/i.test(user)) {
    return { tool: { name: "search_web", input: { query: clean(user) } } };
  }

  // A question about an earlier chat: look it up.
  if (/what did we talk about|we talked about|we were talking about|وش سولفنا|تكلمنا عن/i.test(user)) {
    const when = /yesterday|أمس|امس/i.test(user) ? "yesterday" : /today|اليوم/i.test(user) ? "today" : "any";
    const topic = user.match(/(?:that|the) ([\p{L} ]+?) (?:we|you) (?:talked|were talking|mentioned)/iu)?.[1];
    return { tool: { name: "search_chats", input: { query: topic ?? "", when } } };
  }

  if (/weather|temperature|forecast|how'?s (it|tomorrow|today)|الجو|الطقس|الحرارة/i.test(user)) {
    const place = user.match(
      /\bin ([A-Za-z][A-Za-z ]+?)(?: tomorrow| today|\?|$)|في ([^\s؟?]+)|بال([^\s؟?]+)/,
    );
    const location = place ? clean(place[1] ?? place[2] ?? (place[3] ? `ال${place[3]}` : "")) : undefined;
    const day_offset = /tomorrow|بكرة|غدًا|غدا/i.test(user) ? 1 : 0;
    return { tool: { name: "get_weather", input: location ? { location, day_offset } : { day_offset } } };
  }

  // A fact about the user: a friendly reaction. Remembering it is the writer's job, after the reply.
  const fact = hearFact(user);
  if (fact?.key === "password") {
    return {
      text: ar
        ? "كلمات السر والأرقام الخاصة ما أحفظها. غيرها أبشر، أتذكر لك أي شي."
        : "I don't keep passwords or numbers like that. I can remember anything else for you.",
    };
  }
  if (fact?.key === "name")
    return { text: ar ? `هلا فيك يا ${fact.value}.` : `Nice to meet you, ${fact.value}.` };
  if (fact) return { text: ar ? "أبشر." : "Got it." };
  if (/^(?:remember|تذكر)|my sister|i just moved|أختي/i.test(user)) return { text: ar ? "أبشر." : "Got it." };

  const memory = memoryFromPrompt(system);
  for (const [pattern, key] of RECALL) {
    if (!pattern.test(user)) continue;
    const found = memory.get(key);
    if (found) {
      return {
        text: ar
          ? `${found.value}. قلت لي ${toArabicWhen(found.when)}.`
          : `${cap(found.value)}. You told me ${found.when}.`,
      };
    }
    return { text: ar ? "ما عندي هالمعلومة للحين. وش هي؟" : "I don't have that saved yet. What is it?" };
  }

  // Onboarding: a bare answer while the name is unknown is a name (a greeting is not);
  // a greeting to someone new gets the introduction. The city is only asked for by the weather tool.
  const greeting = /^(hi|hello|hey|salam|marhaba|مرحبا|هلا|السلام عليكم|أهلا)\b/i.test(clean(user));
  const nameUnknown = system.includes("you don't know their name yet");
  if (nameUnknown && !greeting && /^[\p{L}' -]{2,30}$/u.test(clean(user))) {
    const name = cap(clean(user));
    return { text: ar ? `هلا فيك يا ${name}.` : `Nice to meet you, ${name}.` };
  }
  if (nameUnknown && greeting && system.includes("ask what to call them")) {
    return {
      text: ar
        ? "هلا والله! أنا سرجي، وأتذكر اللي تقوله لي. وش أناديك؟"
        : "Hi, I'm Sarjy. I remember what you tell me. What should I call you?",
    };
  }

  if (lower.includes("system prompt") || /pretend|ignore (all|your)|dan\b/i.test(lower)) {
    return { text: "I'm Sarjy, a voice assistant. I can remember things for you and check the weather." };
  }
  return {
    text: ar
      ? "هلا! أنا سرجي، أتذكر اللي تقوله لي وأشوف لك الطقس. وش أقدر أسوي لك؟"
      : "I'm Sarjy, a voice assistant. I remember what you tell me and check the weather. What can I do?",
  };
}

function toArabicWhen(when: string): string {
  return when === "today" ? "اليوم" : when === "yesterday" ? "أمس" : when.replace(/^on /, "يوم ");
}

/** Decide the spoken answer once a tool has returned. */
function afterTool(name: string, output: Record<string, unknown>, ar: boolean): string {
  if (name === "get_weather") {
    const err = output.error as string | undefined;
    if (err === "no_location") return ar ? "أي مدينة أشوف لك؟" : "Which city should I check?";
    if (err === "place_not_found")
      return ar
        ? "ما لقيت هالمكان. تقدر تقوله بطريقة ثانية؟"
        : "I couldn't find that place. Can you say it another way?";
    if (err)
      return ar
        ? "ما قدرت أوصل لخدمة الطقس. أجرب مرة ثانية؟"
        : "I couldn't reach the weather service. Want me to try again?";
    const { condition, high, day, place } = output as {
      condition: string;
      high: number;
      day: string;
      place: string;
    };
    return ar
      ? `${day} ${condition}، والعظمى ${toArabicDigits(String(high))} في ${place}.`
      : `${cap(condition)} and a high of ${high} ${day} in ${place}.`;
  }
  if (name === "search_web") {
    if (output.error)
      return ar
        ? "ما قدرت أدور عليها الحين. أجرب مرة ثانية؟"
        : "I couldn't look that up right now. Want me to try again?";
    return String(output.answer);
  }
  if (name === "search_chats") {
    const chats = (output.chats ?? []) as { when: string; lines: string[] }[];
    if (!chats.length) return ar ? "ما لقيت شي عن هذا في سوالفنا." : "I couldn't find that in our chats.";
    const first = chats[0]!;
    const said = first.lines[0]?.replace(/^(User|You): /, "") ?? "";
    return ar
      ? `سولفنا عنه ${toArabicWhen(first.when)}: ${said}`
      : `We talked about it ${first.when}: ${said}`;
  }
  if (name === "forget") {
    const key = String(output.key ?? "that").replace(/_/g, " ");
    return output.forgotten
      ? ar
        ? "خلاص، نسيتها."
        : `Forgotten. I no longer know your ${key}.`
      : ar
        ? "ما كانت عندي أصلًا."
        : "I didn't have that saved.";
  }
  return ar ? "تم." : "Done.";
}

function stream(parts: LanguageModelV4StreamPart[]): ReadableStream<LanguageModelV4StreamPart> {
  return new ReadableStream({
    async start(controller) {
      for (const p of parts) {
        controller.enqueue(p);
        await new Promise((r) => setTimeout(r, 5));
      }
      controller.close();
    },
  });
}

const usage = {
  inputTokens: { total: 400, noCache: 400, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 20, text: 20, reasoning: 0 },
};

/** The fake memory writer: the facts it hears in the exchange, as the writer's JSON. */
export function fakeWrites(prompt: string): string {
  const user = prompt.match(/^User: (.*)$/m)?.[1] ?? "";
  const asked = prompt.match(/^Sarjy \(before\): (.*)$/m)?.[1] ?? "";
  const forgotten = prompt.match(/never add back: ([^.]+)\./)?.[1]?.split(", ") ?? [];
  const ar = isArabic(user);
  const ops: object[] = [];
  const fact = hearFact(user);
  const add = (key: string, topic: string, label: string, value: string, note: string) => {
    if (!forgotten.includes(key)) ops.push({ op: "add", key, topic, label, value, note });
  };
  const sentence = (key: string, label: string, value: string) => {
    if (ar) return `${label}: ${value}.`;
    if (key === "name") return `Your name is ${value}.`;
    if (key === "home_city") return `You live in ${value}.`;
    if (key === "units") return `Your units is ${value}.`;
    return `Your ${label.toLowerCase()} is ${value}.`;
  };
  if (fact && fact.key !== "password") {
    const topic = fact.key.startsWith("favorite") ? "likes" : "you";
    add(fact.key, topic, fact.label, fact.value, sentence(fact.key, fact.label, fact.value));
  } else if (/call you|وش أناديك/i.test(asked) && /^[\p{L}' -]{2,30}$/u.test(clean(user))) {
    // A bare answer to "what should I call you?" is a name.
    const name = cap(clean(user));
    add("name", "you", ar ? "الاسم" : "Name", name, sentence("name", "Name", name));
  } else if (/which city|أي مدينة/i.test(asked) && /^[\p{L}' -]{2,30}$/u.test(clean(user))) {
    const city = cap(clean(user));
    add("home_city", "you", ar ? "المدينة" : "Home city", city, sentence("home_city", "Home city", city));
  }
  const moved = user.match(/i just moved to ([^.,!?]+)/i);
  if (moved) {
    const city = cap(clean(moved[1]!));
    ops.push({
      op: "update",
      key: "home_city",
      topic: "you",
      label: "Home city",
      value: city,
      note: `You live in ${city}.`,
    });
  }
  const wedding = user.match(/my sister (\w+) is getting married in (\w+)/i);
  if (wedding) {
    const [, sister, month] = wedding;
    add(
      "sister_" + sister!.toLowerCase(),
      "people",
      "Sister's wedding",
      `${sister}'s wedding`,
      `Your sister ${sister} is getting married in ${month} 2026.`,
    );
  }
  return JSON.stringify({ ops });
}

export function createFakeModel(modelId = "fake-sarjy") {
  let calls = 0;
  return new MockLanguageModelV4({
    modelId,
    // The memory writer asks once, without streaming.
    doGenerate: async ({ prompt }) => ({
      content: [{ type: "text", text: fakeWrites(lastUserText(prompt)) }],
      finishReason: { unified: "stop", raw: "stop" },
      usage,
      warnings: [],
    }),
    doStream: async ({ prompt }) => {
      calls += 1;
      const last = prompt[prompt.length - 1]!;
      const ar = isArabic(lastUserText(prompt));

      let reply: Reply;
      if (last.role === "tool") {
        const result = last.content.find((p) => p.type === "tool-result");
        const value =
          result && result.output.type === "json" ? (result.output.value as Record<string, unknown>) : {};
        reply = { text: afterTool(result?.toolName ?? "", value, ar) };
      } else if (last.role === "user" && last.content.some((p) => p.type === "file")) {
        // A picture: the stand-in can't see, but it answers like a model that can.
        reply = { text: ar ? "شفت الصورة، حلوة مرة." : "I can see your picture. Nice one." };
      } else if (
        prompt.some((m) => m.role === "user" && m.content.some((p) => p.type === "file")) &&
        /picture|photo|صورة/i.test(lastUserText(prompt))
      ) {
        // A question about a picture sent earlier in the chat, which is still in view.
        reply = { text: ar ? "إيه، الصورة قدامي للحين." : "Yes, I can still see your picture." };
      } else {
        reply = firstReply(lastUserText(prompt), systemText(prompt));
      }

      const parts: LanguageModelV4StreamPart[] = [{ type: "stream-start", warnings: [] }];
      if ("tool" in reply) {
        parts.push({
          type: "tool-call",
          toolCallId: `call-${calls}`,
          toolName: reply.tool.name,
          input: JSON.stringify(reply.tool.input),
        });
        parts.push({ type: "finish", usage, finishReason: { unified: "tool-calls", raw: "tool_calls" } });
      } else {
        parts.push({ type: "text-start", id: "t" });
        for (const word of reply.text.split(/(?<= )/))
          parts.push({ type: "text-delta", id: "t", delta: word });
        parts.push({ type: "text-end", id: "t" });
        parts.push({ type: "finish", usage, finishReason: { unified: "stop", raw: "stop" } });
      }
      return { stream: stream(parts) };
    },
  });
}

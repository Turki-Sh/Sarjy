import "server-only";

// A scripted stand-in for the language model, speaking the AI SDK's model interface, so the real
// pipeline (tool loop, streaming, events) runs unchanged in tests and without API keys.
// It understands a small set of phrasings in English and Arabic: saving, recalling and forgetting
// facts, weather questions, and the onboarding questions. Anything else gets a short introduction.

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

/** Memory lines from the prompt: key | label | value | told when. */
function memoryFromPrompt(system: string): Map<string, { value: string; when: string }> {
  const block = system.split("<memory>")[1]?.split("</memory>")[0] ?? "";
  const map = new Map<string, { value: string; when: string }>();
  for (const line of block.split("\n")) {
    const [key, , value, when] = line.split(" | ");
    if (key && value && when && key !== "key")
      map.set(key.trim(), { value: value.trim(), when: when.replace("told ", "").trim() });
  }
  return map;
}

/** Decide the next step from the user's words (no tool result yet). */
function firstReply(user: string, system: string): Reply {
  const ar = isArabic(user);
  const lower = user.toLowerCase();

  const forget = user.match(/forget (?:my )?([^.!?]+)|انسَ? ([^.،!؟]+)/i);
  if (forget) return { tool: { name: "forget", input: { key: clean(forget[1] ?? forget[2] ?? "") } } };

  if (/weather|temperature|forecast|how'?s (it|tomorrow|today)|الجو|الطقس|الحرارة/i.test(user)) {
    const place = user.match(
      /\bin ([A-Za-z][A-Za-z ]+?)(?: tomorrow| today|\?|$)|في ([^\s؟?]+)|بال([^\s؟?]+)/,
    );
    const location = place ? clean(place[1] ?? place[2] ?? (place[3] ? `ال${place[3]}` : "")) : undefined;
    const day_offset = /tomorrow|بكرة|غدًا|غدا/i.test(user) ? 1 : 0;
    return { tool: { name: "get_weather", input: location ? { location, day_offset } : { day_offset } } };
  }

  for (const [pattern, key, labelEn, labelAr] of FACTS) {
    const m = user.match(pattern);
    if (!m) continue;
    const raw = clean(m.slice(1).find(Boolean) ?? "");
    if (!raw) continue;
    const value = key === "units" ? cap(raw.toLowerCase()) : ar ? raw : cap(raw);
    return { tool: { name: "remember", input: { key, label: ar ? labelAr : labelEn, value } } };
  }

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

  // Onboarding: a bare answer to "what should I call you?" is a name (a greeting is not).
  const greeting = /^(hi|hello|hey|salam|marhaba|مرحبا|هلا|السلام عليكم|أهلا)\b/i.test(clean(user));
  if (
    system.includes("Current step: ask their name") &&
    !greeting &&
    /^[\p{L}' -]{2,30}$/u.test(clean(user))
  ) {
    const name = cap(clean(user));
    return { tool: { name: "remember", input: { key: "name", label: ar ? "الاسم" : "Name", value: name } } };
  }
  if (system.includes("Current step: ask their name")) {
    return {
      text: ar
        ? "هلا والله! أنا سرجي، وأتذكر اللي تقوله لي. وش أناديك؟"
        : "Hi, I'm Sarjy. I remember what you tell me. What should I call you?",
    };
  }
  if (system.includes("Current step: ask which city")) {
    return { text: ar ? "وين ساكن؟ بأي مدينة؟" : "Which city do you live in?" };
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
  if (name === "remember") {
    if (!output.saved)
      return ar
        ? "كلمات السر والأرقام الخاصة ما أحفظها. غيرها أبشر، أتذكر لك أي شي."
        : "I don't keep passwords or numbers like that. I can remember anything else for you.";
    const label = String(output.label);
    // Names and places keep their capitals; other values are said as ordinary words.
    const proper = ["name", "home_city"].includes(String(output.key));
    const value = proper ? String(output.value) : String(output.value).toLowerCase();
    return ar
      ? `أبشر، حفظتها. ${label}: ${output.value}.`
      : `Saved. Your ${label.toLowerCase()} is ${value}.`;
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

export function createFakeModel(modelId = "fake-sarjy") {
  let calls = 0;
  return new MockLanguageModelV4({
    modelId,
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

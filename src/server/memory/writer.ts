import "server-only";

// The memory writer (Day 2, Turki's direction: "save, then show"). After Sarjy has answered, one
// small model call reads the exchange and everything already remembered, and decides what to
// keep: add a memory, update one, delete one, or (most often) nothing. The screen then shows what
// changed. Answering and remembering are separate jobs, as in Mem0 and the labs' memory systems:
// the answer stays fast and focused, and the memory is written with the whole list in view, so
// details are kept, updates merge instead of duplicating, and filler is left out.

import { generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { isSlot, noteOf, TOPICS } from "@/shared/memory";
import type { Memory } from "@/shared/protocol";
import type { Db } from "../db/client";
import type { Lang, Models } from "../providers/types";
import { looksSecret } from "../tools/memory";
import { toldWhen } from "../turn/prompt";
import { deleteMemoryByKey, normalizeKey, upsertMemory } from "./repo";

const RULES = `You keep Sarjy's memory of one person. After each exchange you decide what, if anything, is worth remembering about them for future conversations, and you keep that memory tidy. You never talk to the user.

Remember:
- Lasting things about the person and their life: who they are (name, where they live, work, studies), the people in their life (by name and relation), likes and dislikes, habits and routines, plans and dates they mention, goals.
- Only what the user said in this exchange. Never what Sarjy said, never a guess. Sarjy's reply is only context: it never decides what is kept, even if it says it won't remember something.
- A short answer to a question Sarjy just asked is the fact: if Sarjy asked for their city and they said "Riyadh", that is their home city.

Do not remember:
- Small talk, greetings, thanks, reactions ("nice", "ok", "cool", "it's on"), questions they asked, one-off requests (the weather somewhere), passing moods ("I'm tired today").
- Health, religion, politics, ethnicity, sexuality or gender identity, criminal or immigration status, money troubles: leave them out when mentioned in passing.
- But when the user explicitly asks you to remember something ("remember that", "don't forget", "تذكر", "احفظ"), always keep it, sensitive or not. Only secrets are never kept.
- Passwords, card, ID or account numbers: never.
- When in doubt, leave it out.

How to write a memory:
- One memory per thing. The note is one natural sentence in the user's language, speaking to them ("you", never "I"), keeping the details they gave (who, what, where, when): "Your sister Noura is getting married in December 2026."
- In Arabic, write the note in everyday Saudi dialect, the way a friend would say it, never formal Arabic, with Arabic numerals: "أختك نورة زواجها في ديسمبر ٢٠٢٦." / "تحب القهوة العربية بدون سكر." Never "أنت ستسافر" or "سوف".
- Turn relative times into dates using Now ("next month" becomes the month and year).
- label: a 2 to 4 word headline in the user's language. value: the bare value, 1 to 5 words.
- key: stable English snake_case naming the subject, not the value (sister_noura, favorite_game, job, gym_routine).
- topic: "you" (identity, home, work, studies, habits and routines), "people", "likes" (likes, dislikes, favorites), "plans" (plans, trips, events, dates, goals), or "other".
- These keys mean exactly this, because the app reads them: name (value: what to call them), home_city (value: the city only), units (value: celsius or fahrenheit).

Keep it tidy:
- Read the memories you already have first. If the new thing is about something already there, update that key and rewrite its whole note with the old and new details together. Never add a second memory about the same thing.
- If it changes a memory (they moved, changed jobs, the plan moved), update it. If they say something you remember is no longer true, delete it.

Examples (Now is September 2026):
- User: "I have asthma." -> {"ops":[]} (health in passing)
- User: "Please remember that I have asthma." -> {"ops":[{"op":"add","key":"asthma","topic":"you","label":"Asthma","value":"Asthma","note":"You have asthma."}]}
- User: "It's on." or "ok cool" or "I'm tired today" -> {"ops":[]}
- Memories: home_city | you | You live in Dammam. User: "I just moved to Jeddah." -> {"ops":[{"op":"update","key":"home_city","topic":"you","label":"Home city","value":"Jeddah","note":"You live in Jeddah; you moved there in September 2026."}]}
- User: "أبي أسافر أبها الصيف الجاي" -> {"ops":[{"op":"add","key":"trip_abha","topic":"plans","label":"رحلة أبها","value":"أبها، صيف ٢٠٢٧","note":"بتسافر أبها صيف ٢٠٢٧."}]}

Answer with JSON only, no other text: {"ops":[...]}, where each op is
{"op":"add","key":"...","topic":"...","label":"...","value":"...","note":"..."}, the same with "op":"update", or {"op":"delete","key":"..."}.
Most exchanges need nothing: {"ops":[]}.`;

const Write = z.object({
  op: z.enum(["add", "update"]),
  key: z.string().min(1),
  topic: z.enum(TOPICS).catch("other"),
  label: z.string().min(1),
  value: z.string().min(1),
  note: z.string().min(1),
});
const Delete = z.object({ op: z.literal("delete"), key: z.string().min(1) });
const Plan = z.object({ ops: z.array(z.union([Write, Delete])).max(4) });
export type MemoryOp = z.infer<typeof Write> | z.infer<typeof Delete>;

/** The writer's JSON, found in its reply and checked; anything malformed means "nothing to do". */
export function parsePlan(reply: string): MemoryOp[] {
  const start = reply.indexOf("{");
  const end = reply.lastIndexOf("}");
  if (start < 0 || end <= start) return [];
  try {
    const plan = Plan.safeParse(JSON.parse(reply.slice(start, end + 1)));
    return plan.success ? plan.data.ops : [];
  } catch {
    return [];
  }
}

export type Exchange = {
  now: Date;
  timeZone: string;
  lang: Lang;
  memories: Memory[];
  /** What Sarjy said just before, so a short answer to its question can be understood. */
  asked: string | null;
  user: string;
  answer: string;
  /** Keys the user asked Sarjy to forget this turn: never written back. */
  forgotten: string[];
};

/** The writer's view of one exchange: the time, what it already knows, and what was said. */
export function writerPrompt(x: Exchange): string {
  const known = x.memories.length
    ? x.memories
        .map(
          (m) =>
            `${m.key} | ${m.topic} | ${noteOf(m)} | told ${toldWhen(new Date(m.updatedAt), x.now, x.timeZone)}`,
        )
        .join("\n")
    : "(nothing yet)";
  const now = new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeZone: x.timeZone }).format(x.now);
  return [
    `Now: ${now} (${x.timeZone}). The user speaks ${x.lang === "ar" ? "Arabic" : "English"}: write every label and note in ${x.lang === "ar" ? "Arabic, in everyday Saudi dialect" : "English"}.`,
    `<memories>\nkey | topic | note | when\n${known}\n</memories>`,
    x.forgotten.length
      ? `Just forgotten at the user's request, never add back: ${x.forgotten.join(", ")}.`
      : "",
    `<exchange>\n${x.asked ? `Sarjy (before): ${x.asked}\n` : ""}User: ${x.user}\nSarjy: ${x.answer}\n</exchange>`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

const options = (modelId: string) => ({
  groq: {
    reasoningEffort: modelId.startsWith("openai/gpt-oss") ? ("low" as const) : ("none" as const),
    reasoningFormat: "hidden" as const,
  },
});

export type WritePlan = { ops: MemoryOp[]; model: string | null; inputTokens: number; outputTokens: number };

/** Asks the writer models, best first, what to change. Any failure means nothing changes. */
export async function planWrites(models: Models, x: Exchange, signal?: AbortSignal): Promise<WritePlan> {
  const prompt = writerPrompt(x);
  for (const { id, model } of models) {
    try {
      const { text, totalUsage } = await generateText({
        model: model as LanguageModel,
        system: RULES,
        prompt,
        temperature: 0,
        maxRetries: 0,
        providerOptions: options(id),
        abortSignal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(8000)])
          : AbortSignal.timeout(8000),
      });
      return {
        ops: parsePlan(text),
        model: id,
        inputTokens: totalUsage.inputTokens ?? 0,
        outputTokens: totalUsage.outputTokens ?? 0,
      };
    } catch {
      if (signal?.aborted) break;
    }
  }
  return { ops: [], model: null, inputTokens: 0, outputTokens: 0 };
}

/** Carries out the plan: the saved and forgotten memories, for the screen. Secrets never pass. */
export async function applyWrites(
  db: Db,
  userId: string,
  ops: MemoryOp[],
  x: Pick<Exchange, "user" | "lang" | "forgotten">,
): Promise<{ saved: Memory[]; forgotten: { id: string; key: string }[] }> {
  const saved: Memory[] = [];
  const forgotten: { id: string; key: string }[] = [];
  for (const op of ops) {
    const key = normalizeKey(op.key);
    if (!key || x.forgotten.includes(key)) continue;
    if (op.op === "delete") {
      const gone = await deleteMemoryByKey(db, userId, key);
      if (gone) forgotten.push(gone);
      continue;
    }
    if (looksSecret([op.key, op.label, op.value, op.note])) continue;
    // The app reads these three bare: units is one of two words, the others are short names.
    const value =
      key === "units" ? (/fahrenheit|فهرنهايت/i.test(op.value) ? "fahrenheit" : "celsius") : op.value;
    saved.push(
      await upsertMemory(db, userId, {
        key,
        topic: isSlot(key) ? "you" : op.topic,
        label: op.label,
        value,
        note: op.note,
        source: x.user,
        lang: x.lang,
      }),
    );
  }
  return { saved, forgotten };
}

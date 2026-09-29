import "server-only";

// One conversational turn, start to finish (architecture, section 3). Read top to bottom:
//   1. hear      speech to text (or the typed text)
//   2. recall    memories, the conversation so far, the prompt
//   3. think     the model streams its answer and may call tools
//   4. speak     the first sentence is voiced at once; the rest follows as one more request
//   5. keep      save the turn, advance onboarding, report timings
// Everything the browser needs is sent through `emit` as it happens.

import { isStepCount, streamText, type ModelMessage } from "ai";
import { eq } from "drizzle-orm";
import type { Memory, TurnEvent } from "@/shared/protocol";
import { openConversation, recentMessages, saveTurn } from "../chat/repo";
import type { Db } from "../db/client";
import { users, type User } from "../db/schema";
import { listMemories } from "../memory/repo";
import type { Lang, Providers } from "../providers/types";
import { memoryTools } from "../tools/memory";
import { weatherTool, type Units } from "../tools/weather";
import { isStep, nextStep } from "./onboarding";
import { buildSystemPrompt } from "./prompt";
import { SpeechChunker } from "./sentences";

export type TurnInput = {
  user: User;
  audio: Blob | null;
  text: string | null;
  conversationId: string | null;
  uiLang: Lang;
  timeZone: string;
};

const SAY: Record<"not_understood" | "model_unavailable" | "internal", Record<Lang, string>> = {
  not_understood: { en: "I didn't catch that. Try again?", ar: "ما سمعتك زين. تعيد؟" },
  model_unavailable: {
    en: "I can't think straight right now. Try again in a moment.",
    ar: "عندي مشكلة الحين. جرّب بعد شوي.",
  },
  internal: { en: "Something went wrong on my side. Try again?", ar: "صار خلل عندي. تجرب مرة ثانية؟" },
};

const detectLang = (text: string, fallback: Lang): Lang =>
  /[؀-ۿ]/.test(text) ? "ar" : /[a-z]/i.test(text) ? "en" : fallback;

const toBase64 = (buf: ArrayBuffer) => Buffer.from(buf).toString("base64");

// Per-model settings: keep reasoning short (it delays the first word) and never stream it as speech.
const modelOptions = (modelId: string) => ({
  groq: {
    reasoningEffort: modelId.startsWith("openai/gpt-oss") ? ("low" as const) : ("none" as const),
    reasoningFormat: "hidden" as const,
  },
});

export async function runTurn(
  input: TurnInput,
  deps: { db: Db; providers: Providers },
  emit: (event: TurnEvent) => void,
): Promise<void> {
  const { db, providers } = deps;
  const started = performance.now();
  const since = () => Math.round(performance.now() - started);
  const timings: Record<string, number | string> = {};

  // 1. Hear.
  let heard = input.text?.trim() ?? "";
  let lang: Lang = detectLang(heard, input.uiLang);
  if (input.audio) {
    try {
      const result = await providers.stt.transcribe(input.audio, input.uiLang);
      heard = result.text;
      lang = result.lang;
    } catch {
      heard = "";
    }
    timings.sttMs = since();
  }
  if (!heard) {
    emit({ type: "error", code: "not_understood", say: SAY.not_understood[input.uiLang] });
    return;
  }
  emit({ type: "transcript", text: heard, lang, ms: since() });

  // 2. Recall.
  const [memories, conversation] = await Promise.all([
    listMemories(db, input.user.id),
    openConversation(db, input.user.id, input.conversationId, heard),
  ]);
  const history = await recentMessages(db, conversation.id);
  const onboarding = isStep(input.user.onboardingStep) ? input.user.onboardingStep : "done";
  const system = buildSystemPrompt({
    now: new Date(),
    timeZone: input.timeZone,
    uiLang: input.uiLang,
    userName: input.user.name,
    memories,
    onboarding,
  });
  const messages: ModelMessage[] = [
    ...history.map((m) => ({ role: m.role, content: m.text }) as ModelMessage),
    { role: "user", content: heard },
  ];

  // 3. Think, with tools. Each tool reports its start and end, so the chip shows live timing.
  const toolLog: { name: string; label: string; ok: boolean; ms: number }[] = [];
  const toolStarts = new Map<string, { label: string; at: number }>();
  const savedKeys: string[] = [];
  let savedName: string | null = null;
  let toolCounter = 0;
  const onStart = (label: string) => {
    const id = `tool-${++toolCounter}`;
    toolStarts.set(id, { label, at: performance.now() });
    emit({ type: "tool_start", id, name: label.split("(")[0]!, label });
    return id;
  };
  const onEnd = (id: string, ok: boolean) => {
    const start = toolStarts.get(id)!;
    const ms = Math.round(performance.now() - start.at);
    toolLog.push({ name: start.label.split("(")[0]!, label: start.label, ok, ms });
    emit({ type: "tool_end", id, ok, ms });
  };

  const byKey = (key: string) => memories.find((m: Memory) => m.key === key)?.value ?? null;
  const units: Units = /fahrenheit|فهرنهايت/i.test(byKey("units") ?? "") ? "fahrenheit" : "celsius";
  const tools = {
    get_weather: weatherTool({
      fetch: providers.fetch,
      lang,
      homeCity: byKey("home_city"),
      units,
      onStart,
      onEnd,
    }),
    ...memoryTools({
      db,
      userId: input.user.id,
      lang,
      source: heard,
      onSaved: (memory) => {
        savedKeys.push(memory.key);
        if (memory.key === "name") savedName = memory.value;
        emit({ type: "memory_saved", memory });
      },
      onForgotten: (id, key) => emit({ type: "memory_forgotten", id, key }),
      onStart,
      onEnd,
    }),
  };

  // 4. Speak. The first sentence is voiced the moment it is complete; the rest when the text ends.
  // Segments are sent strictly in order, whichever voice request finishes first.
  const chunker = new SpeechChunker();
  let segmentIndex = 0;
  let sending = Promise.resolve();
  const speak = (text: string) => {
    const index = segmentIndex++;
    const audio = providers.tts.synthesize(text, lang);
    sending = sending.then(async () => {
      const wav = await audio;
      if (index === 0) timings.firstAudioMs = since();
      emit({ type: "segment", index, text, lang, audio: wav ? toBase64(wav) : null });
    });
  };

  const attempt = async (model: Providers["models"]["main"], modelId: string) => {
    const result = streamText({
      model,
      system,
      messages,
      tools,
      stopWhen: isStepCount(4),
      maxRetries: 0,
      providerOptions: modelOptions(modelId),
    });
    let text = "";
    for await (const part of result.fullStream) {
      if (part.type === "text-delta") {
        if (!text) timings.firstTokenMs = since();
        text += part.text;
        const first = chunker.push(part.text);
        if (first) {
          timings.firstSentenceMs = since();
          speak(first);
        }
      } else if (part.type === "error") {
        throw part.error;
      }
    }
    return text;
  };

  let answer = "";
  try {
    try {
      answer = await attempt(providers.models.main, providers.models.mainId);
      timings.model = providers.models.mainId;
    } catch (error) {
      // Rate limited or failed before saying anything: the fallback model takes the turn.
      if (segmentIndex > 0) throw error;
      answer = await attempt(providers.models.fallback, providers.models.fallbackId);
      timings.model = providers.models.fallbackId;
    }
  } catch {
    emit({ type: "error", code: "model_unavailable", say: SAY.model_unavailable[lang] });
    return;
  }
  const rest = chunker.flush();
  if (rest) speak(rest);
  await sending;

  // 5. Keep.
  const toolMs = toolLog.reduce((sum, t) => sum + t.ms, 0);
  if (toolMs) timings.toolMs = toolMs;
  const next = nextStep(onboarding, savedKeys);
  if (next !== onboarding || savedName !== null) {
    await db
      .update(users)
      .set({ onboardingStep: next, ...(savedName !== null ? { name: savedName } : {}) })
      .where(eq(users.id, input.user.id));
  }
  const messageId = await saveTurn(db, {
    conversationId: conversation.id,
    speakerId: input.user.id,
    lang,
    userText: heard,
    assistantText: answer.trim(),
    tools: toolLog,
    timings,
  });
  emit({
    type: "done",
    messageId,
    conversationId: conversation.id,
    text: answer.trim(),
    timings: { ...(timings as Record<string, number>), totalMs: since(), model: String(timings.model ?? "") },
  });
}

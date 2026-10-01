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
import {
  lastReply,
  openConversation,
  pictureBytes,
  picturesOf,
  recentMessages,
  roomConversation,
  saveRoomMessage,
  saveTurn,
} from "../chat/repo";
import { addressesSarjy } from "./address";
import type { Db } from "../db/client";
import { users, type User } from "../db/schema";
import { listMemories } from "../memory/repo";
import type { Lang, PolicyTopic, PolicyVerdict, Providers, WebAnswer } from "../providers/types";
import { chatSearchTool } from "../tools/chats";
import { webSearchTool } from "../tools/web";
import { forgetTool } from "../tools/memory";
import { applyWrites, planWrites } from "../memory/writer";
import { weatherTool, type Units } from "../tools/weather";
import { isStep, nextStep } from "./onboarding";
import { buildSystemPrompt } from "./prompt";
import { SEARCH_USD, turnCost, wavSeconds } from "./cost";
import { SpeechChunker, tidy } from "./sentences";

export type TurnInput = {
  user: User;
  audio: Blob | null;
  text: string | null;
  /** A picture sent with the turn (JPEG, resized in the browser): only models that see get it. */
  image?: Blob | null;
  conversationId: string | null;
  uiLang: Lang;
  timeZone: string;
  /**
   * In a Majlis: the room's conversation, and everyone in it by the name they go by (the speaker
   * is `user`). Memory stays the speaker's own: nobody else's is ever loaded.
   */
  room?: {
    conversationId: string;
    /** Everyone who has joined; `here` is whether they have the room open right now. */
    people: { id: string; name: string; host: boolean; here?: boolean }[];
    /** Who this turn is for: everyone in the room, or Sarjy (the switch under the finjan). */
    to: "room" | "sarjy";
  };
};

const SAY: Record<"not_understood" | "model_unavailable" | "internal", Record<Lang, string>> = {
  not_understood: { en: "I didn't catch that. Try again?", ar: "ما سمعتك زين. تعيد؟" },
  model_unavailable: {
    en: "I'm a bit swamped right now. Give me a few seconds and try again.",
    ar: "عندي زحمة شوي الحين. جرب بعد ثواني.",
  },
  internal: { en: "Something went wrong on my side. Try again?", ar: "صار خلل عندي. تجرب مرة ثانية؟" },
};

/** How an earlier picture appears to a model that can't see it, or once a newer one is in view. */
const PICTURE_NOTE = "(A picture was sent with this message. Your reply after it says what was in it.)";

/** Said the moment a web search starts, so the few seconds it takes are never silent. */
// (Not "Let me check.": the filter that keeps a model's leaked planning from being spoken drops it.)
const CHECKING: Record<Lang, string> = { en: "One sec, looking it up.", ar: "لحظة، أشوف لك." };

/**
 * What Sarjy says when the topic policy turns a turn away (architecture, section 10a): short, in
 * its own voice, no lecture. Self-harm gets care and a real place to turn (in Saudi Arabia, the
 * 937 health line, and 911 in an emergency).
 */
const DECLINE: Record<PolicyTopic, Record<Lang, string>> = {
  harm: {
    en: "That's not something I can help with. Anything else on your mind?",
    ar: "هذا شي ما أقدر أساعد فيه. تبي شي ثاني؟",
  },
  sexual: { en: "I'll pass on that one. Anything else?", ar: "هذي أعذرني فيها. تبي شي ثاني؟" },
  hate: { en: "I won't go there. Anything else?", ar: "هذا ما أدخل فيه. تبي شي ثاني؟" },
  self_harm: {
    en: "I'm really sorry you're going through this, and you don't have to face it alone. In Saudi Arabia you can call 937 any time, or 911 if you're in danger right now. I'm here to talk too.",
    ar: "آسف إنك تمر بهذا، وما أنت لحالك. تقدر تتصل على 937 أي وقت، أو 911 إذا كنت في خطر الحين. وأنا موجود أسولف معك.",
  },
  advice: {
    en: "That one needs a doctor, lawyer or advisor who knows your situation. I can share general info if that helps.",
    ar: "هذي تحتاج دكتور أو محامي أو مستشار يعرف وضعك. أقدر أعطيك معلومات عامة لو تبي.",
  },
};

/** What a picture sent without words is taken to ask. */
const LOOK: Record<Lang, string> = { en: "What's in this picture?", ar: "وش في هالصورة؟" };

const detectLang = (text: string, fallback: Lang): Lang =>
  /[؀-ۿ]/.test(text) ? "ar" : /[a-z]/i.test(text) ? "en" : fallback;

/** The language a sentence is written in, by majority of letters: it picks the voice that reads it. */
const writtenIn = (text: string, fallback: Lang): Lang => {
  const arabic = text.match(/[؀-ۿ]/g)?.length ?? 0;
  const latin = text.match(/[a-z]/gi)?.length ?? 0;
  return arabic > latin ? "ar" : latin > arabic ? "en" : fallback;
};

const toBase64 = (buf: ArrayBuffer) => Buffer.from(buf).toString("base64");

/**
 * The most a model without reasoning (Qwen) may write in one step. An answer is a sentence or two
 * (under 100 tokens), so this never cuts one short. Without it Groq assumes a large request, and
 * on the free tier (1,000 output tokens a minute for Qwen) refused picture turns outright. The
 * gpt-oss models get no cap: their hidden reasoning comes out of the same budget, and cutting it
 * would cut the answer.
 */
const PLAIN_MAX_OUTPUT = 500;

// Per-model settings: keep reasoning short (it delays the first word) and never stream it as speech.
const modelOptions = (modelId: string) => ({
  groq: {
    reasoningEffort: modelId.startsWith("openai/gpt-oss") ? ("low" as const) : ("none" as const),
    reasoningFormat: "hidden" as const,
  },
});

export async function runTurn(
  input: TurnInput,
  deps: { db: Db; providers: Providers; signal?: AbortSignal },
  emit: (event: TurnEvent) => void,
): Promise<void> {
  const { db, providers, signal } = deps;
  const started = performance.now();
  const since = () => Math.round(performance.now() - started);
  const timings: Record<string, number | string> = {};

  // Your memories, loaded once and from the start: the listener uses your name and city below, and
  // the model gets all of them in step 2.
  const memoriesLoading = listMemories(db, input.user.id);
  memoriesLoading.catch(() => {}); // a failure surfaces in step 2, where it is awaited

  // 1. Hear.
  let heard = input.text?.trim() ?? "";
  /** Whisper doubted what it heard: answer it, but remember nothing from it. */
  let unsure = false;
  let lang: Lang = detectLang(heard, input.uiLang);
  if (input.audio) {
    try {
      // What the listener should know going in: who you are, where you live, what Sarjy just said.
      const [known, last] = await Promise.all([
        memoriesLoading.catch(() => [] as Memory[]),
        lastReply(
          db,
          input.room?.conversationId ?? input.conversationId,
          input.room ? null : input.user.id,
        ).catch(() => null),
      ]);
      const value = (key: string) => known.find((m) => m.key === key)?.value;
      const context = [value("name"), value("home_city"), last].filter(Boolean).join(". ");
      const result = await providers.stt.transcribe(input.audio, input.uiLang, context);
      heard = result.text;
      lang = result.lang;
      unsure = result.unsure ?? false;
    } catch {
      heard = "";
    }
    timings.sttMs = since();
  }
  // A picture with no words asks the obvious question.
  if (!heard && input.image) heard = LOOK[input.uiLang];
  if (!heard) {
    emit({ type: "error", code: "not_understood", say: SAY.not_understood[input.uiLang] });
    return;
  }
  // In a Majlis, people talk to each other and Sarjy answers only when asked (Turki, Day 3): by
  // the switch, or by its name at the start. Said to everyone, the turn ends here: it is kept in
  // the chat (so Sarjy knows it when asked later) and nothing else runs, no model, no voice, no
  // memory. Speech to text is its only cost.
  if (input.room && input.room.to === "room" && !addressesSarjy(heard)) {
    emit({ type: "transcript", text: heard, lang, ms: since(), forRoom: true });
    const image = input.image ? new Uint8Array(await input.image.arrayBuffer()) : null;
    await roomConversation(db, input.room.conversationId, heard);
    const messageId = await saveRoomMessage(db, {
      conversationId: input.room.conversationId,
      speakerId: input.user.id,
      lang,
      text: heard,
      picture: image ? { bytes: image, mediaType: input.image?.type || "image/jpeg" } : null,
    });
    const audioSeconds = input.audio ? wavSeconds(input.audio.size) : 0;
    emit({
      type: "done",
      messageId,
      conversationId: input.room.conversationId,
      text: "",
      timings: {
        ...(timings as Record<string, number>),
        totalMs: since(),
        costUsd: turnCost({
          model: "",
          inputTokens: 0,
          outputTokens: 0,
          audioSeconds,
          voiced: { en: 0, ar: 0 },
        }),
      },
    });
    return;
  }
  emit({ type: "transcript", text: heard, lang, ms: since() });

  // The topic policy reads what was said while the model starts answering (section 10a). Nothing
  // is voiced and no tool runs until it has said yes; if it says no, the model is stopped and
  // Sarjy declines in its own voice. Allowed turns lose no time: it is usually done first.
  const policyStarted = performance.now();
  const verdict: Promise<PolicyVerdict> = providers.policy
    .check(heard, signal)
    .catch(() => ({ allowed: true, checked: false, model: "", inputTokens: 0, outputTokens: 0 }));
  const modelStop = new AbortController();
  /** Set once the policy has turned this turn away. */
  let declined: PolicyTopic | null = null;
  void verdict.then((v) => {
    timings.policyMs = Math.round(performance.now() - policyStarted);
    if (!v.allowed) {
      declined = v.topic ?? "harm";
      modelStop.abort();
    }
  });

  // 2. Recall. Only the speaker's memories, in a Majlis too: that is what keeps each person's private.
  const room = input.room;
  const [memories, conversation] = await Promise.all([
    memoriesLoading,
    room
      ? roomConversation(db, room.conversationId, heard)
      : openConversation(db, input.user.id, input.conversationId, heard),
  ]);
  const history = await recentMessages(db, conversation.id);
  // Nobody is asked their name in front of the room: the door already did.
  const onboarding = room ? "done" : isStep(input.user.onboardingStep) ? input.user.onboardingStep : "done";
  /** In a Majlis each line says who said it, so the model can tell people apart. */
  const nameOf = (id: string | null) => room?.people.find((p) => p.id === id)?.name ?? "Someone";
  const said = (text: string, speakerId: string | null) => (room ? `${nameOf(speakerId)}: ${text}` : text);
  const system = buildSystemPrompt({
    now: new Date(),
    timeZone: input.timeZone,
    uiLang: input.uiLang,
    userName: input.user.name,
    memories,
    onboarding,
    userTurns: history.filter((m) => m.role === "user").length,
    replyLang: lang,
    room: room
      ? {
          people: room.people.filter((p) => p.here !== false).map((p) => p.name),
          away: room.people.filter((p) => p.here === false).map((p) => p.name),
          host: room.people.find((p) => p.host)?.name ?? null,
          speaker: nameOf(input.user.id),
        }
      : undefined,
  });
  const image = input.image ? new Uint8Array(await input.image.arrayBuffer()) : null;
  const mediaType = input.image?.type || "image/jpeg";
  // Pictures stay with the chat (Day 2). The model sees the latest earlier one again, so a
  // follow-up ("and the horse?") still works; older ones are named in words, which keeps the
  // turn small. A picture sent now replaces them all.
  const pictured = await picturesOf(
    db,
    history.filter((m) => m.role === "user").map((m) => m.id),
  );
  const lastPictured = image ? undefined : history.findLast((m) => pictured.has(m.id));
  const earlier = lastPictured ? await pictureBytes(db, pictured.get(lastPictured.id)!) : null;
  const withPicture = (text: string, bytes: Uint8Array, type: string): ModelMessage => ({
    role: "user",
    content: [
      { type: "text", text },
      { type: "file", data: bytes, mediaType: type },
    ],
  });
  /** The conversation for one model: pictures as pictures if it can see, else as a note. */
  const messagesFor = (sees: boolean): ModelMessage[] => [
    ...history.map((m): ModelMessage => {
      const text = m.role === "user" ? said(m.text, m.speakerId) : m.text;
      if (!pictured.has(m.id)) return { role: m.role, content: text } as ModelMessage;
      if (sees && earlier && m === lastPictured) return withPicture(text, earlier.bytes, earlier.mediaType);
      return { role: "user", content: `${text}\n${PICTURE_NOTE}` };
    }),
    image
      ? withPicture(said(heard, input.user.id), image, mediaType)
      : { role: "user", content: said(heard, input.user.id) },
  ];

  // 3. Think, with tools. Each tool reports its start and end, so the chip shows live timing.
  const toolLog: { name: string; label: string; ok: boolean; ms: number }[] = [];
  const toolStarts = new Map<string, { label: string; at: number }>();
  const forgottenKeys: string[] = [];
  /** Whether "Let me check." was said: it doesn't count as having started the answer. */
  let saidChecking = false;
  /** What each web search took, for the turn's cost. */
  const webUsage: WebAnswer[] = [];
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
    forget: forgetTool({
      db,
      userId: input.user.id,
      onForgotten: (id, key) => {
        forgottenKeys.push(key);
        emit({ type: "memory_forgotten", id, key });
      },
      onStart,
      onEnd,
    }),
    search_web: webSearchTool({
      web: providers.web,
      now: new Date(),
      timeZone: input.timeZone,
      lang,
      signal,
      onUsage: (found) => webUsage.push(found),
      // A search takes a few seconds: rather than silence, Sarjy says it's checking, unless it
      // has already said something this turn.
      onSearching: () => {
        if (segmentIndex > 0) return;
        speak(CHECKING[lang]);
        saidChecking = true;
      },
      onStart,
      onEnd,
    }),
    search_chats: chatSearchTool({
      db,
      userId: input.user.id,
      conversationId: conversation.id,
      now: new Date(),
      timeZone: input.timeZone,
      onStart,
      onEnd,
    }),
  };

  // No tool runs before the policy has allowed the turn: a turned-away turn changes nothing.
  for (const tool of Object.values(tools) as { execute?: (...args: never[]) => unknown }[]) {
    const run = tool.execute;
    if (!run) continue;
    tool.execute = async (...args: never[]) => {
      if (!(await verdict).allowed) throw new Error("Turned away by the topic policy.");
      return run(...args);
    };
  }

  // 4. Speak. The first sentence is voiced the moment it is complete; the rest when the text ends.
  // Segments are sent strictly in order, whichever voice request finishes first.
  let chunker = new SpeechChunker();
  /** Pieces queued to be said (the model's, and "One sec"), whether or not they end up said. */
  let segmentIndex = 0;
  /** Pieces actually sent, which number the segments the browser plays. */
  let sent = 0;
  let sending = Promise.resolve();
  const voiced = { en: 0, ar: 0 };
  const speak = (raw: string, decline = false) => {
    const text = tidy(raw, lang);
    if (!text) return;
    segmentIndex++;
    // Normally the user's language; if the model slipped into the other one, the matching voice reads it.
    const voice = writtenIn(text, lang);
    const audio = providers.tts.synthesize(text, voice);
    sending = sending.then(async () => {
      // Nothing is said before the policy has answered; once it has said no, only the decline is.
      await verdict;
      if (declined && !decline) return;
      const wav = await audio;
      const index = sent++;
      if (index === 0) timings.firstAudioMs = since();
      voiced[voice] += text.length;
      emit({ type: "segment", index, text, lang: voice, audio: wav ? toBase64(wav) : null });
    });
  };

  const attempt = async (
    model: Providers["models"][number]["model"],
    modelId: string,
    messages: ModelMessage[],
  ) => {
    const result = streamText({
      model,
      system,
      messages,
      tools,
      // Stop once a step has said something: the answer is complete. A model that keeps going after
      // its answer tends to narrate its own plan ("we need to respond?"), which must never be spoken.
      stopWhen: [isStepCount(4), ({ steps }) => (steps.at(-1)?.text.trim() ?? "") !== ""],
      maxRetries: 0,
      // The browser gave up on this turn (a new turn, barge-in, a closed tab): stop thinking, and
      // don't run a tool whose result no one will hear, so nothing is ever saved unannounced.
      abortSignal: signal ? AbortSignal.any([signal, modelStop.signal]) : modelStop.signal,
      providerOptions: modelOptions(modelId),
      maxOutputTokens: modelId.startsWith("openai/gpt-oss") ? undefined : PLAIN_MAX_OUTPUT,
    });
    // A model that failed partway hands over nothing: whatever it had written and not yet said is
    // dropped, so its half answer is never glued to the next model's (Day 5: an Arabic answer,
    // "Sure.", then the same answer again).
    chunker = new SpeechChunker();
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
    const usage = await result.totalUsage;
    tokens.input += usage.inputTokens ?? 0;
    tokens.output += usage.outputTokens ?? 0;
    return text;
  };
  const tokens = { input: 0, output: 0 };

  // Down the chain: a model that is rate limited or fails before saying anything hands the turn
  // to the next. Once Sarjy has started speaking, switching voices mid-answer would be worse than
  // stopping, so a failure after the first sentence ends the turn.
  let answer: string | null = null;
  // A turn with a picture goes only to models that can see (on Groq, Qwen); the others would fail.
  // With an earlier picture in the chat, the models that see go first, and the rest still answer
  // from the words (the picture becomes a note) rather than the turn failing.
  const seeing = providers.models.filter((m) => m.vision);
  const chain = image
    ? seeing
    : earlier
      ? [...seeing, ...providers.models.filter((m) => !m.vision)]
      : providers.models;
  for (const { id, model, vision } of chain) {
    try {
      answer = await attempt(model, id, messagesFor(!!vision));
      timings.model = id;
      break;
    } catch {
      if (segmentIndex > (saidChecking ? 1 : 0) || signal?.aborted || modelStop.signal.aborted) break;
    }
  }
  if (signal?.aborted) return;
  // The policy may answer after the model has finished: its verdict decides either way.
  const policy = await verdict;
  if (declined) {
    answer = DECLINE[declined][lang];
    chunker = new SpeechChunker();
    speak(answer, true);
  }
  if (answer === null) {
    emit({ type: "error", code: "model_unavailable", say: SAY.model_unavailable[lang] });
    return;
  }
  answer = tidy(answer, lang);
  const rest = chunker.flush();
  if (rest && !declined) speak(rest);

  // 5. Remember (Day 2: "save, then show"). The writer reads the exchange with everything already
  // remembered and decides what to keep, while the last of the voice is still being made; what it
  // saves reaches the screen before the turn ends. Nothing is kept from words Whisper doubted.
  const remembering = (async () => {
    // Nothing is remembered from words Whisper doubted, or from a turn turned away.
    if (unsure || declined) return null;
    const started = performance.now();
    const plan = await planWrites(
      providers.writer,
      {
        now: new Date(),
        timeZone: input.timeZone,
        lang,
        memories,
        asked: history.findLast((m) => m.role === "assistant")?.text ?? null,
        user: heard,
        answer: answer!.trim(),
        forgotten: forgottenKeys,
      },
      signal,
    );
    const { saved, forgotten } = await applyWrites(db, input.user.id, plan.ops, {
      user: heard,
      lang,
      forgotten: forgottenKeys,
    });
    for (const memory of saved) emit({ type: "memory_saved", memory });
    for (const gone of forgotten) emit({ type: "memory_forgotten", ...gone });
    timings.memoryMs = Math.round(performance.now() - started);
    // Kept with the turn like a tool call, so a shared moment knows a fact was saved.
    for (const memory of saved) {
      toolLog.push({ name: "memory.write", label: `memory.write(key: "${memory.key}")`, ok: true, ms: 0 });
    }
    return { saved, plan };
  })();
  const [, remembered] = await Promise.all([sending, remembering]);
  const savedKeys = remembered?.saved.map((m) => m.key) ?? [];
  const savedName = remembered?.saved.find((m) => m.key === "name")?.value ?? null;

  // 6. Keep.
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
    picture: image ? { bytes: image, mediaType } : null,
  });
  const model = String(timings.model ?? "");
  const writer = remembered?.plan;
  const costUsd =
    turnCost({
      model,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      audioSeconds: input.audio ? wavSeconds(input.audio.size) : 0,
      voiced,
    }) +
    (writer?.model
      ? turnCost({
          model: writer.model,
          inputTokens: writer.inputTokens,
          outputTokens: writer.outputTokens,
          audioSeconds: 0,
          voiced: { en: 0, ar: 0 },
        })
      : 0) +
    (policy.model
      ? turnCost({
          model: policy.model,
          inputTokens: policy.inputTokens,
          outputTokens: policy.outputTokens,
          audioSeconds: 0,
          voiced: { en: 0, ar: 0 },
        })
      : 0) +
    webUsage.reduce(
      (sum, w) =>
        sum +
        w.searches * SEARCH_USD +
        turnCost({
          model: w.model,
          inputTokens: w.inputTokens,
          outputTokens: w.outputTokens,
          audioSeconds: 0,
          voiced: { en: 0, ar: 0 },
        }),
      0,
    );
  emit({
    type: "done",
    messageId,
    conversationId: conversation.id,
    text: answer.trim(),
    timings: {
      ...(timings as Record<string, number>),
      totalMs: since(),
      model,
      inputTokens: tokens.input,
      outputTokens: tokens.output,
      costUsd,
    },
  });
}

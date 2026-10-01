import "server-only";

// The external capabilities, behind small interfaces (architecture, section 8).
// `fake` implementations make every test and all offline work independent of network and quota.

import type { LanguageModel } from "ai";

export type Lang = "en" | "ar";

export interface SpeechToText {
  /**
   * Audio in, text and detected language out. `hint` is the interface language; `context` is what
   * the listener knows going in (your name, your city, what Sarjy just said), so names and replies
   * to a question come back spelled right.
   */
  transcribe(
    audio: Blob,
    hint: Lang,
    context?: string,
  ): Promise<{ text: string; lang: Lang; unsure?: boolean }>;
}

/** What a web search found, as a few plain sentences, and what it took. */
export type WebAnswer = {
  answer: string;
  /** The sites it read, as domains ("arabnews.com"). */
  sources: string[];
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** How many searches it ran (each is billed). */
  searches: number;
};

export interface WebSearch {
  /** Looks something up on the web and answers briefly (live: in English); null when it can't. */
  search(
    question: string,
    ctx: { now: Date; timeZone: string; lang: Lang; signal?: AbortSignal },
  ): Promise<WebAnswer | null>;
}

export interface TextToSpeech {
  /** A WAV file for the text, or null when the browser's backup voice should speak it. */
  synthesize(text: string, lang: Lang): Promise<ArrayBuffer | null>;
}

/**
 * Whether a picture may be shown to everyone in a Majlis, and what checking it took. `checked`
 * is false when the guard couldn't answer (a rate limit, an error): still a no, said differently.
 */
export type PictureVerdict = {
  safe: boolean;
  checked: boolean;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export interface PictureGuard {
  /** Checks a picture before a Majlis sees it. Fails closed: when it can't tell, the answer is no. */
  check(picture: { bytes: Uint8Array; mediaType: string }, signal?: AbortSignal): Promise<PictureVerdict>;
}

/**
 * The topic policy's verdict on what someone said (architecture, section 10a). `topic` names why a
 * turn was turned away; `checked` is false when the check couldn't answer, and then the turn goes
 * ahead (the prompt's own rules still hold), so a rate limit never silences Sarjy.
 */
export type PolicyTopic = "harm" | "sexual" | "hate" | "self_harm" | "advice";
export type PolicyVerdict = {
  allowed: boolean;
  topic?: PolicyTopic;
  checked: boolean;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export interface PolicyCheck {
  /** Checks what someone said against the topic policy, alongside the main model. */
  check(text: string, signal?: AbortSignal): Promise<PolicyVerdict>;
}

/** A model the turn may use; `vision` marks the ones that can read a picture. */
export type ModelChoice = { id: string; model: LanguageModel; vision?: boolean };

/**
 * The models a turn may use, best first. The first is the main model (fast, reliable tool
 * calling); each next one takes the turn when the one before is rate limited or fails. On Groq
 * every model has its own per-minute quota, so a chain of three survives a burst that one would not.
 */
export type Models = ModelChoice[];

/** The HTTP client tools use. Swapped for recorded responses in tests. */
export type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

export type Providers = {
  stt: SpeechToText;
  tts: TextToSpeech;
  models: Models;
  /** The models that decide what to remember after each turn (server/memory/writer.ts), best first. */
  writer: Models;
  /** Looking things up on the web (the search_web tool). */
  web: WebSearch;
  /** Checks pictures before they are shared in a Majlis. */
  guard: PictureGuard;
  /** Checks what someone said against the topic policy, before Sarjy says anything. */
  policy: PolicyCheck;
  fetch: Fetch;
};

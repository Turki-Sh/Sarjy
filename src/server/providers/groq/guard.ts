import "server-only";

// The picture guard (Turki, Day 3: "send it to a small model for guardrail first"). Before a
// picture is shown to everyone in a Majlis, a model looks at it against a short policy and says
// SAFE or UNSAFE. Groq hosts no dedicated vision safety model any more (Llama Guard 4 is gone, and
// gpt-oss-safeguard reads text only), so the one model that sees, Qwen, does it with reasoning
// off: under two seconds, about 800 to 2,000 input tokens a picture. Anything but a clear SAFE,
// including an error, counts as unsafe.

import { generateText, type LanguageModel } from "ai";
import type { PictureGuard } from "../types";

const POLICY = `You check pictures before they are shown to a group of people in a shared voice chat. Reply with one word: SAFE or UNSAFE.

UNSAFE if the picture shows any of:
- nudity or sexual content
- graphic violence, gore, or serious injury
- self-harm
- hate symbols or extremist propaganda
- weapons being used against people
- private data someone may not mean to share with a group: ID cards, passports, bank or credit cards, passwords, or documents showing personal numbers
- any content involving the exploitation of minors

Everything else is SAFE: people, places, food, pets, screenshots, text, art, memes. When in doubt, UNSAFE.`;

export function groqGuard(model: LanguageModel, modelId: string): PictureGuard {
  return {
    async check(picture, signal) {
      try {
        const result = await generateText({
          model,
          system: POLICY,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Is this picture SAFE or UNSAFE to show the group?" },
                { type: "file", data: picture.bytes, mediaType: picture.mediaType },
              ],
            },
          ],
          maxOutputTokens: 8,
          temperature: 0,
          maxRetries: 1,
          abortSignal: signal ?? AbortSignal.timeout(8000),
          providerOptions: { groq: { reasoningEffort: "none" } },
        });
        return {
          safe: /^\W*safe\b/i.test(result.text.trim()),
          checked: true,
          model: modelId,
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        };
      } catch {
        // Couldn't check (on the free tier, usually Qwen's 7,000 input tokens a minute): not shared.
        return { safe: false, checked: false, model: modelId, inputTokens: 0, outputTokens: 0 };
      }
    },
  };
}

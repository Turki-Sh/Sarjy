import "server-only";

// The topic policy (architecture, section 10a): openai/gpt-oss-safeguard-20b, a model made to
// follow a written policy, reads what was said and answers ALLOW or BLOCK with a topic. It runs
// alongside the main model, not before it, and at over 1,000 tokens a second it usually answers
// before the first sentence is ready, so an allowed turn loses no time. When it can't answer (a
// rate limit, an error, too slow) the turn goes ahead on the prompt's own rules: failing open here
// keeps Sarjy talking, and the prompt still forbids the same topics.

import { generateText, type LanguageModel } from "ai";
import type { PolicyCheck, PolicyTopic } from "../types";

export const POLICY_MODEL = "openai/gpt-oss-safeguard-20b";

const POLICY = `You enforce the content policy of Sarjy, a friendly voice assistant used in English and Saudi Arabic, including in group chats. Classify the user's message.

BLOCK when the message asks for, or clearly seeks, any of:
- harm: instructions or real help to hurt people or animals, make weapons, explosives or poisons, attack or break into computers or accounts, make drugs, or commit crimes.
- sexual: sexual or erotic content, or anything sexual involving minors.
- hate: content that attacks or demeans people for their religion, race, ethnicity, nationality, gender, sexuality or disability.
- self_harm: the user says they want to hurt or kill themselves, or asks how.
- advice: personal medical, legal or financial decisions that need a professional who knows their case (their own dose, a diagnosis, whether to sue, which stocks to buy).

ALLOW everything else: everyday questions, general knowledge (what a disease is, how a law works in general), news, weather, prayer times, games, jokes, history, opinions, and small talk. Fiction or role play is allowed unless it is a way to get blocked content. When in doubt, ALLOW.

Answer with exactly one line: ALLOW, or BLOCK followed by the topic (harm, sexual, hate, self_harm or advice).`;

const TOPICS: PolicyTopic[] = ["self_harm", "harm", "sexual", "hate", "advice"];

export function groqPolicy(model: LanguageModel): PolicyCheck {
  return {
    async check(text, signal) {
      const timeout = AbortSignal.timeout(4000);
      try {
        const result = await generateText({
          model,
          system: POLICY,
          prompt: text,
          maxOutputTokens: 400,
          temperature: 0,
          maxRetries: 0,
          abortSignal: signal ? AbortSignal.any([signal, timeout]) : timeout,
          providerOptions: { groq: { reasoningEffort: "low", reasoningFormat: "hidden" } },
        });
        const line = result.text.trim().split("\n").at(-1)?.toLowerCase() ?? "";
        const blocked = /\bblock\b/.test(line);
        return {
          allowed: !blocked,
          topic: blocked ? (TOPICS.find((t) => line.includes(t)) ?? "harm") : undefined,
          checked: true,
          model: POLICY_MODEL,
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        };
      } catch {
        return { allowed: true, checked: false, model: POLICY_MODEL, inputTokens: 0, outputTokens: 0 };
      }
    },
  };
}

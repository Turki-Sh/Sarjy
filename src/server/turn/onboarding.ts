import "server-only";

// The first-visit flow (architecture, section 14): the brief's "multistep workflow".
// The step lives on the server, not in the model's head. It advances only when the matching
// memory is actually saved, so the model cannot skip a step by claiming it did.
//
// It must never feel forced (Turki's direction): each question is asked at most once, lightly,
// at the end of a reply that already helped; skipping it is always fine. Units are not asked at
// all: Celsius is the default, and "use Fahrenheit" works whenever someone says it.

export const STEPS = ["name", "home_city", "done"] as const;
export type OnboardingStep = (typeof STEPS)[number];

export const isStep = (s: string): s is OnboardingStep => (STEPS as readonly string[]).includes(s);

const ASK: Record<Exclude<OnboardingStep, "done">, string> = {
  name: "their name (save it with key `name`)",
  home_city: "which city they live in, so weather needs no city name (save it with key `home_city`)",
};

/** After this many of the user's messages in one conversation, Sarjy stops asking in it. */
const ASK_WITHIN = 2;

/**
 * The prompt's lines about onboarding, or nothing once it is done.
 * `userTurns` is how many messages the user has already sent in this conversation.
 */
export function onboardingInstruction(step: OnboardingStep, userTurns = 0): string {
  if (step === "done") return "";
  const want = ASK[step];
  // Past the first couple of messages, just listen: save it if they mention it, never ask.
  if (userTurns >= ASK_WITHIN) {
    return `Getting to know the user: you don't know ${want.split(" (")[0]} yet. Don't ask. If they mention it, save it.`;
  }
  const first =
    step === "name" && userTurns === 0
      ? "This may be their first visit: if this is their very first message, you can introduce yourself in a few words. "
      : "";
  const following = STEPS[STEPS.indexOf(step) + 1]!;
  const then =
    following === "done"
      ? "Once it is saved, you're done getting to know them; don't ask anything else."
      : `Once it is saved, you may ask ${ASK[following]} in the same reply, lightly.`;
  return (
    `Getting to know the user, never forced. ${first}Current step: ask ${want}. ` +
    "Help with what they asked first; the question comes after, in a few words, and only once in this conversation. " +
    "If their message answers it, even in one word, save it with remember and confirm. " +
    "If they skip it, change the subject, or would rather not say, drop it and don't ask again. " +
    then
  );
}

/** The step after this turn, given the keys saved during it. */
export function nextStep(step: OnboardingStep, savedKeys: string[]): OnboardingStep {
  let current = step;
  // A user may answer several at once ("I'm Sara from Jeddah"); advance past every step now satisfied.
  while (current !== "done" && savedKeys.includes(current)) {
    current = STEPS[STEPS.indexOf(current) + 1]!;
  }
  return current;
}

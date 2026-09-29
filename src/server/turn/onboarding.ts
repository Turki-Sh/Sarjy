import "server-only";

// The first-visit flow (architecture, section 14): the brief's "multistep workflow".
// The step lives on the server, not in the model's head. It advances only when the matching
// memory is actually saved, so the model cannot skip a step by claiming it did.
//
// It must never feel forced (Turki's direction). Sarjy asks for something only when it has a
// reason to, the way a person would:
//   name       when Sarjy introduces itself, in its very first reply to someone new
//   home_city  only when it is needed: a weather question that names no place
// Otherwise it just listens, and saves either one if it comes up. Units are never asked:
// Celsius is the default, and "use Fahrenheit" works whenever someone says it.

export const STEPS = ["name", "home_city", "done"] as const;
export type OnboardingStep = (typeof STEPS)[number];

export const isStep = (s: string): s is OnboardingStep => (STEPS as readonly string[]).includes(s);

const LISTEN =
  "If they mention it, save it with remember and confirm. Never ask for it in reply to small talk, and never twice.";

/**
 * The prompt's lines about onboarding, or nothing once it is done.
 * `userTurns` is how many messages the user has already sent in this conversation.
 */
export function onboardingInstruction(step: OnboardingStep, userTurns = 0): string {
  if (step === "name") {
    return userTurns === 0
      ? "Getting to know the user, never forced: you don't know their name yet (key `name`). " +
          "If this message is a greeting or small talk, reply warmly, say in a few words that you're Sarjy, and ask what to call them. " +
          `If they asked for something, help with that and don't ask. ${LISTEN}`
      : `Getting to know the user: you don't know their name yet (key \`name\`). Don't ask. ${LISTEN}`;
  }
  if (step === "home_city") {
    return (
      "Getting to know the user: you don't know their home city yet (key `home_city`). Don't ask for it on your own. " +
      "Only if they ask about the weather without naming a place, ask which city and save their answer as their home city. " +
      LISTEN
    );
  }
  return "";
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

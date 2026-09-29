import "server-only";

// The first-visit flow (architecture, section 14): the brief's "multistep workflow".
// The step lives on the server, not in the model's head. It advances only when the matching
// memory is actually saved, so the model cannot skip a step by claiming it did.

export const STEPS = ["name", "home_city", "units", "done"] as const;
export type OnboardingStep = (typeof STEPS)[number];

export const isStep = (s: string): s is OnboardingStep => (STEPS as readonly string[]).includes(s);

const ASK: Record<Exclude<OnboardingStep, "done">, string> = {
  name: "ask for their name (save it with key `name`)",
  home_city: "ask which city they live in (save it with key `home_city`)",
  units:
    "ask whether they prefer Celsius or Fahrenheit (save it with key `units`, value Celsius or Fahrenheit)",
};

/** The one line the prompt gets about onboarding, or nothing once it is done. */
export function onboardingInstruction(step: OnboardingStep): string {
  if (step === "done") return "";
  const first =
    step === "name"
      ? "This is the user's first visit. If this is the very first message, introduce yourself in one short sentence first. "
      : "";
  // The model is told what comes after this step, so a saved answer flows straight into the next question.
  const following = STEPS[STEPS.indexOf(step) + 1]!;
  const then =
    following === "done"
      ? "Once it is saved, onboarding is complete: confirm it and say they're all set, in a few words. "
      : `Once it is saved, the next step is to ${ASK[following]}; ask that in the same reply. `;
  return (
    `Onboarding is in progress. ${first}Current step: ${ASK[step]}. ${then}` +
    "If their message answers this step, even in one word, save it with remember first, then confirm and ask the next thing. " +
    "If the user asks something else, answer it briefly, then ask for this step again. Ask one thing at a time."
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

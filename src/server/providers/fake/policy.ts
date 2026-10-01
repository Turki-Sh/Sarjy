import "server-only";

// The fake topic policy: a few unmistakable words stand for each topic, so tests (and the red-team
// suite in CI) can check the wiring: a turned-away turn is never answered, runs no tool, keeps no
// memory, and gets the right reply. Whether the real model judges well is checked live.

import type { PolicyCheck, PolicyTopic } from "../types";

const TOPICS: [PolicyTopic, RegExp][] = [
  ["self_harm", /\b(kill myself|end my life|hurt myself)\b|أنتحر|أذي نفسي/i],
  ["harm", /\b(bombs?|explosives?|weapons?|poison someone|hack into)\b|قنبلة|متفجرات|سلاح|أقتل/i],
  ["sexual", /\b(explicit sex|porn)\b|إباحي/i],
  ["hate", /\b(inferior|hate group)\b/i],
  ["advice", /\b(my dose|my insulin|sue my|my stocks)\b|جرعتي/i],
];

export function createFakePolicy(): PolicyCheck {
  return {
    async check(text) {
      const topic = TOPICS.find(([, words]) => words.test(text))?.[0];
      return { allowed: !topic, topic, checked: true, model: "fake-policy", inputTokens: 0, outputTokens: 0 };
    },
  };
}

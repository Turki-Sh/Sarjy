import "server-only";

// The fake picture guard: every picture passes, unless the test says this one shouldn't.

import type { PictureGuard } from "../types";

export function createFakeGuard(refuse: boolean): PictureGuard {
  return {
    async check() {
      return { safe: !refuse, checked: true, model: "fake-guard", inputTokens: 0, outputTokens: 0 };
    },
  };
}

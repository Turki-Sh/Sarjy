import "server-only";

// A stand-in for web search: a canned answer about Al Hilal, a generic one otherwise, and no
// answer at all for a question that mentions "unreachable" (to test the failure path).

import type { WebSearch } from "../types";

export function createFakeWeb(): WebSearch {
  return {
    async search(question, { lang }) {
      if (/unreachable/i.test(question)) return null;
      const hilal = /hilal|الهلال/i.test(question);
      const answer = hilal
        ? lang === "ar"
          ? "الهلال فاز على التعاون ٦-٠ يوم ١٢ سبتمبر ٢٠٢٦."
          : "Al Hilal beat Al Taawoun 6-0 on 12 September 2026."
        : lang === "ar"
          ? `هذا اللي لقيته عن ${question}.`
          : `Here's what the web says about ${question}.`;
      return {
        answer,
        sources: ["example.com"],
        model: "fake-search",
        inputTokens: 0,
        outputTokens: 0,
        searches: 1,
      };
    },
  };
}

import { describe, expect, it } from "vitest";
import { cleanAnswer, sourcesOf } from "@/server/providers/groq/web";

describe("web search sources", () => {
  it("names up to three sites it read, once each, without www", () => {
    expect(
      sourcesOf([
        {
          type: "browser_search",
          output: "【0†Al Hilal 6-0†https://www.arabnews.com/node/1】 【1†…†https://www.spl.com.sa/en】",
        },
        {
          type: "browser.open",
          output: "URL: https://www.arabnews.com/node/1 ... https://www.goal.com/x https://kooora.com/y",
        },
      ]),
    ).toEqual(["arabnews.com", "spl.com.sa", "goal.com"]);
    expect(sourcesOf([])).toEqual([]);
  });

  it("drops the citation marks a model leaves in, so they are never read out", () => {
    expect(
      cleanAnswer("Al Hilal beat Al Gharafa 2-1【1†L2-L7】【1†L26-L30】. Next game Friday【5†L2】 ."),
    ).toBe("Al Hilal beat Al Gharafa 2-1. Next game Friday.");
  });
});

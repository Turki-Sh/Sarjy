import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COLORS } from "@/shared/brand/colors";

const tokens = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");

describe("brand colors outside CSS", () => {
  it.each(Object.entries(COLORS))("%s matches tokens.css", (name, hex) => {
    const match = tokens.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
    expect(match?.[1]?.toUpperCase()).toBe(hex.toUpperCase());
  });
});

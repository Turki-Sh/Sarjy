import { describe, expect, it } from "vitest";
import { isStep, nextStep, onboardingInstruction } from "@/server/turn/onboarding";

describe("onboarding", () => {
  it("advances only when the matching memory was saved (AT-22)", () => {
    expect(nextStep("home_city", [])).toBe("home_city");
    expect(nextStep("home_city", ["favorite_color"])).toBe("home_city");
    expect(nextStep("home_city", ["home_city"])).toBe("done");
  });

  it("skips several steps when answered at once", () => {
    expect(nextStep("name", ["name", "home_city"])).toBe("done");
  });

  it("never asks about units: Celsius is the default (old accounts on that step count as done)", () => {
    expect(isStep("units")).toBe(false);
  });

  it("asks for a name only when introducing itself, in the first reply", () => {
    expect(onboardingInstruction("done")).toBe("");
    const first = onboardingInstruction("name", 0);
    expect(first).toContain("never forced");
    expect(first).toContain("ask what to call them");
    expect(first).toContain("If they asked for something, help with that and don't ask.");
    expect(onboardingInstruction("name", 1)).toContain("Don't ask.");
  });

  it("asks for the city only when the weather needs it, never after small talk", () => {
    const city = onboardingInstruction("home_city", 0);
    expect(city).toContain("Don't ask for it on your own.");
    expect(city).toContain("ask about the weather without naming a place");
    expect(city).toContain("Never ask for it in reply to small talk");
  });
});

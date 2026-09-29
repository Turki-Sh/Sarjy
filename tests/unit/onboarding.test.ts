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

  it("asks lightly, once, and names the next step", () => {
    expect(onboardingInstruction("done")).toBe("");
    const first = onboardingInstruction("name", 0);
    expect(first).toContain("introduce yourself");
    expect(first).toContain("never forced");
    expect(first).toContain("drop it and don't ask again");
    expect(first).toContain("you may ask which city");
    expect(onboardingInstruction("home_city", 1)).toContain("you're done getting to know them");
  });

  it("stops asking after the first couple of messages in a conversation", () => {
    const later = onboardingInstruction("name", 2);
    expect(later).toContain("Don't ask.");
    expect(later).not.toContain("Current step");
  });
});

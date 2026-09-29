import { describe, expect, it } from "vitest";
import { nextStep, onboardingInstruction } from "@/server/turn/onboarding";

describe("onboarding", () => {
  it("advances only when the matching memory was saved (AT-22)", () => {
    expect(nextStep("home_city", [])).toBe("home_city");
    expect(nextStep("home_city", ["favorite_color"])).toBe("home_city");
    expect(nextStep("home_city", ["home_city"])).toBe("units");
  });

  it("skips several steps when answered at once", () => {
    expect(nextStep("name", ["name", "home_city"])).toBe("units");
    expect(nextStep("units", ["units"])).toBe("done");
  });

  it("says nothing once done", () => {
    expect(onboardingInstruction("done")).toBe("");
    expect(onboardingInstruction("name")).toContain("introduce yourself");
    // Each step names the next one, so the model asks it right after saving.
    expect(onboardingInstruction("name")).toContain("the next step is to ask which city");
    expect(onboardingInstruction("units")).toContain("onboarding is complete");
  });
});

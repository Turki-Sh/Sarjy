import { describe, expect, it } from "vitest";
import { bestVoice } from "@/client/audio/backupVoice";

const v = (name: string, lang: string, localService = true) => ({ name, lang, localService });

// What Windows Edge, Windows Chrome and a Mac offer (abridged).
const edge = [
  v("Microsoft David - English (United States)", "en-US"),
  v("Microsoft Zira - English (United States)", "en-US"),
  v("Microsoft Aria Online (Natural) - English (United States)", "en-US", false),
  v("Microsoft Hamed Online (Natural) - Arabic (Saudi Arabia)", "ar-SA", false),
  v("Microsoft Naayf - Arabic (Saudi Arabia)", "ar-SA"),
];
const chrome = [
  v("Microsoft David - English (United States)", "en-US"),
  v("Google UK English Male", "en-GB", false),
  v("Google US English", "en-US", false),
];
const mac = [v("Samantha", "en-US"), v("Ava (Premium)", "en-US"), v("Majed", "ar-SA")];

describe("the backup voice", () => {
  it("prefers a natural voice to the robotic default", () => {
    expect(bestVoice(edge, "en")?.name).toMatch(/Aria Online \(Natural\)/);
    expect(bestVoice(edge, "ar")?.name).toMatch(/Hamed Online \(Natural\)/);
    expect(bestVoice(mac, "en")?.name).toBe("Ava (Premium)");
  });

  it("takes Google's voices in Chrome, in the usual accent", () => {
    expect(bestVoice(chrome, "en")?.name).toBe("Google US English");
  });

  it("only picks a voice that speaks the language, or none at all", () => {
    expect(bestVoice(mac, "ar")?.name).toBe("Majed");
    expect(bestVoice(chrome, "ar")).toBeNull();
  });
});

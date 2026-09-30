import { describe, expect, it } from "vitest";
import { addressesSarjy } from "@/server/turn/address";

describe("asking Sarjy by name in a Majlis", () => {
  it.each([
    "Sarjy, what's the weather?",
    "Hey Sarjy what time is it",
    "sergey, who won yesterday",
    "سرجي وش الجو بكرة؟",
    "يا سرجي، وش رأيك؟",
    "Sarjy.",
  ])("asks Sarjy: %s", (text) => expect(addressesSarjy(text)).toBe(true));

  it.each([
    "Hello everyone",
    "I told Sarjy about it yesterday",
    "Sarjyland is a place",
    "هلا والله بالجميع",
    "وش رأيكم نسأل سرجي؟",
  ])("talks to the room: %s", (text) => expect(addressesSarjy(text)).toBe(false));
});

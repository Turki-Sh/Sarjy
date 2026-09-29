import { describe, expect, it } from "vitest";
import { encodeWav, fixWavHeader } from "@/shared/wav";

describe("wav", () => {
  it("encodes a mono 16-bit file with correct lengths", () => {
    const wav = encodeWav(new Float32Array(100), 24_000);
    const view = new DataView(wav);
    expect(wav.byteLength).toBe(244);
    expect(view.getUint32(4, true)).toBe(236);
    expect(view.getUint32(40, true)).toBe(200);
  });

  it("repairs a streamed header that claims far more audio than there is", () => {
    const wav = encodeWav(new Float32Array(100), 24_000);
    const view = new DataView(wav);
    view.setUint32(4, 0xffffffff, true);
    view.setUint32(40, 0xfffffff0, true);
    fixWavHeader(wav);
    expect(view.getUint32(4, true)).toBe(236);
    expect(view.getUint32(40, true)).toBe(200);
  });

  it("finds the data chunk after an extra chunk", () => {
    const plain = new Uint8Array(encodeWav(new Float32Array(10), 24_000));
    // Insert a 4-byte LIST chunk between fmt and data.
    const extra = new Uint8Array([0x4c, 0x49, 0x53, 0x54, 4, 0, 0, 0, 1, 2, 3, 4]);
    const joined = new Uint8Array(plain.length + extra.length);
    joined.set(plain.subarray(0, 36));
    joined.set(extra, 36);
    joined.set(plain.subarray(36), 36 + extra.length);
    const view = new DataView(joined.buffer);
    view.setUint32(36 + extra.length + 4, 999_999, true);
    fixWavHeader(joined.buffer);
    expect(view.getUint32(36 + extra.length + 4, true)).toBe(20);
  });

  it("leaves anything that is not a WAV file alone", () => {
    const mp3 = new Uint8Array(64).fill(7).buffer;
    expect(new Uint8Array(fixWavHeader(mp3))).toEqual(new Uint8Array(64).fill(7));
  });
});

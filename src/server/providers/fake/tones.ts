// Speech-like test audio: one soft tone burst per word, with short gaps between words and longer
// ones after commas and full stops. Returns the true start of every word, so tests can measure
// how well caption timing is estimated from audio alone.

export function toneSpeech(
  text: string,
  rate = 16000,
): { samples: Float32Array; rate: number; starts: number[] } {
  const out: number[] = [];
  const starts: number[] = [];
  const silence = (seconds: number) => {
    for (let i = 0; i < Math.round(seconds * rate); i++) out.push(0);
  };
  silence(0.08);
  for (const word of text.split(/\s+/).filter(Boolean)) {
    starts.push(out.length / rate);
    const n = Math.round((0.12 + 0.045 * word.length) * rate);
    for (let i = 0; i < n; i++) {
      out.push(0.25 * Math.sin((Math.PI * i) / n) * Math.sin((2 * Math.PI * 180 * i) / rate));
    }
    silence(/[.!?؟]$/.test(word) ? 0.28 : /[,،]$/.test(word) ? 0.16 : 0.06);
  }
  return { samples: Float32Array.from(out), rate, starts };
}

// When is each word spoken? (architecture, section 11, "Caption timing")
//
// The voice returns audio without word timings, so we estimate them from the audio itself:
//   1. Measure loudness every 10 ms and find where speech starts and ends (trim the silence).
//   2. Give each word a share of the spoken time by its length, plus a little for a comma or full stop.
//   3. Find the pauses in the audio (runs of quiet frames), and snap each boundary between two words
//      to the nearest pause. Speech has small gaps between words, so this corrects most of the drift.
// It runs per sentence, so error can never build up across a long answer.

export type WordTiming = { word: string; start: number; end: number };

const FRAME_SECONDS = 0.01;

/** Loudness (RMS) per 10 ms frame. */
export function envelope(samples: Float32Array, sampleRate: number): Float32Array {
  const size = Math.max(1, Math.round(sampleRate * FRAME_SECONDS));
  const frames = new Float32Array(Math.ceil(samples.length / size));
  for (let f = 0; f < frames.length; f++) {
    let sum = 0;
    const from = f * size;
    const to = Math.min(samples.length, from + size);
    for (let i = from; i < to; i++) sum += samples[i]! * samples[i]!;
    frames[f] = Math.sqrt(sum / Math.max(1, to - from));
  }
  return frames;
}

/** How much speaking time a word takes, relatively. Punctuation adds the pause that follows it. */
function weight(word: string): number {
  const letters = word.replace(/[^\p{L}\p{N}]/gu, "").length;
  const pause = /[.!?؟…]$/.test(word) ? 3 : /[,،;:]$/.test(word) ? 1.5 : 0;
  return Math.max(2, letters) + 1 + pause;
}

export function estimateWordTimings(
  words: string[],
  samples: Float32Array,
  sampleRate: number,
): WordTiming[] {
  if (!words.length) return [];
  const env = envelope(samples, sampleRate);
  const peak = env.reduce((m, v) => Math.max(m, v), 0);
  const duration = samples.length / sampleRate;
  if (peak === 0) return evenly(words, 0, duration);

  // 1. Where speech is.
  const threshold = Math.max(0.005, peak * 0.08);
  const voiced = Array.from(env, (v) => v > threshold);
  const first = voiced.indexOf(true);
  const last = voiced.lastIndexOf(true);
  const speechStart = first * FRAME_SECONDS;
  const speechEnd = (last + 1) * FRAME_SECONDS;

  // 2. A first guess from word lengths.
  const weights = words.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  const span = speechEnd - speechStart;
  const boundaries: number[] = [];
  let acc = 0;
  for (let i = 0; i < words.length - 1; i++) {
    acc += weights[i]!;
    boundaries.push(speechStart + (span * acc) / total);
  }

  // 3. The pauses (at least 30 ms of quiet inside the speech), as their midpoints.
  const pauses: number[] = [];
  for (let f = first, runStart = -1; f <= last; f++) {
    if (!voiced[f]) {
      if (runStart < 0) runStart = f;
    } else if (runStart >= 0) {
      if (f - runStart >= 3) pauses.push(((runStart + f) / 2) * FRAME_SECONDS);
      runStart = -1;
    }
  }

  // Snap each boundary to the nearest unused pause within reach, keeping boundaries in order.
  const reach = Math.max(0.25, span / words.length);
  const used = new Set<number>();
  let floor = speechStart;
  const snapped = boundaries.map((b) => {
    let best = -1;
    let bestDistance = reach;
    pauses.forEach((p, i) => {
      const d = Math.abs(p - b);
      if (!used.has(i) && p > floor && d < bestDistance) {
        best = i;
        bestDistance = d;
      }
    });
    if (best >= 0) used.add(best);
    floor = best >= 0 ? pauses[best]! : Math.max(b, floor);
    return floor;
  });

  const edges = [speechStart, ...snapped, speechEnd];
  return words.map((word, i) => ({ word, start: edges[i]!, end: edges[i + 1]! }));
}

/** Without audio (or silent audio), spread the words across the time by length. */
export function evenly(words: string[], start: number, end: number): WordTiming[] {
  const weights = words.map(weight);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = start;
  return words.map((word, i) => {
    const d = ((end - start) * weights[i]!) / total;
    const timing = { word, start: t, end: t + d };
    t += d;
    return timing;
  });
}

/** How many words have started by time `t` (seconds into the segment). */
export function wordsSpoken(timings: WordTiming[], t: number): number {
  let n = 0;
  while (n < timings.length && timings[n]!.start <= t) n++;
  return n;
}

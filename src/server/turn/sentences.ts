// Cuts the model's streamed text into speakable pieces (architecture, section 3, step 9).
// The first sentence is voiced on its own as soon as it is complete, for a fast first sound.
// Everything after it is voiced as one more request, to spare the voice quota.

// A sentence ends at . ! ? ؟ or … followed by a space or the end of the text.
// A period between digits ("4.5") is not an ending.
const ENDING = /([.!?؟…]+)(?=\s|$)/g;

// Models sometimes glue two sentences together ("kabsa.Got it"). A sentence mark between a letter
// and the start of a new word gets its space back, so the split below (and the caption) see two.
const GLUED = /([a-z\u0600-\u06ff][.!?؟])(?=[A-Z\u0600-\u06ff])/g;
export const unglue = (text: string) => text.replace(GLUED, "$1 ");

/**
 * Last fixes to what Sarjy is about to say, for slips a prompt can't fully prevent:
 * glued sentences, long dashes (a comma reads and sounds the same), and "on today".
 */
export const tidy = (text: string) =>
  unglue(text)
    .replace(/\s*[\u2014\u2013]\s*/g, ", ")
    .replace(/\bon (today|yesterday)\b/gi, "$1");

/** Splits text into complete sentences and the unfinished rest. */
export function splitSentences(text: string): { sentences: string[]; rest: string } {
  const sentences: string[] = [];
  let start = 0;
  for (const match of text.matchAll(ENDING)) {
    const end = match.index! + match[0].length;
    const before = text[match.index! - 1];
    const after = text[end];
    if (match[0] === "." && before && /\d/.test(before) && after && /\d/.test(after)) continue;
    const sentence = text.slice(start, end).trim();
    if (sentence) sentences.push(sentence);
    start = end;
  }
  return { sentences, rest: text.slice(start) };
}

/**
 * Feed it text deltas; it hands back the first sentence as soon as it exists, and the remainder
 * once, when the text is finished.
 */
export class SpeechChunker {
  private buffer = "";
  private firstSent = false;

  /** Returns the first sentence the moment it completes, otherwise nothing. */
  push(delta: string): string | null {
    this.buffer = unglue(this.buffer + delta);
    if (this.firstSent) return null;
    const { sentences, rest } = splitSentences(this.buffer);
    const [first, ...more] = sentences;
    if (!first) return null;
    this.firstSent = true;
    this.buffer = [...more, rest].join(" ").trim();
    return first;
  }

  /** Everything not yet voiced, once the model has finished. */
  flush(): string | null {
    const text = this.buffer.trim();
    this.buffer = "";
    this.firstSent = true;
    return text || null;
  }
}

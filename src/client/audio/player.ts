// Plays Sarjy's voice (architecture, section 11, "Playback").
// Every segment is decoded and scheduled back to back on one AudioContext clock, so the caption
// can ask "which word is being said right now?" with one number. An analyser on the output gives
// the loudness that drives the orb while Sarjy speaks.
// A segment without audio (voice quota or error) is spoken by the browser's own voice instead,
// the most natural one it has (backupVoice.ts).

import { bestVoice } from "./backupVoice";
import { playCue, type Cue } from "./cues";
import { estimateWordTimings, evenly, type WordTiming } from "@/shared/wordTiming";

export type PlayedSegment = {
  index: number;
  words: string[];
  timings: WordTiming[];
  /** When the segment starts, on the player's clock (seconds). */
  startAt: number;
  endAt: number;
  backup: boolean;
};

/** A segment's audio: base64 WAV in your own turn's stream, or a URL in a Majlis (fetched here). */
type Segment = { index: number; text: string; lang: "en" | "ar"; audio: string | null; url?: string };

/** Extra time the browser's voice gets, beyond twice the estimated length, before we stop waiting. */
const BACKUP_GRACE_S = 2;

const base64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export class Player {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer = new Float32Array(1024);
  private sources = new Set<AudioBufferSourceNode>();
  private queueEnd = 0;
  /** How many lines the browser's voice is reading now. */
  private backupLines = 0;
  /** Segments received but not yet scheduled (still decoding). While any are, the player is busy. */
  private pending = 0;
  /** Segments are decoded and scheduled one after another, in the order they arrived. */
  private chain: Promise<unknown> = Promise.resolve();
  /** Bumped by stop(): a segment still decoding when you stop must never start playing afterwards. */
  private generation = 0;

  constructor() {
    // Chrome lists its voices only after being asked once, and fills the list in a moment later.
    // Asking now means the list is ready if the backup voice is ever needed.
    if (typeof speechSynthesis !== "undefined") speechSynthesis.getVoices();
  }

  /** Must be called from a tap or key press: browsers only allow audio after a gesture. */
  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  /**
   * The one AudioContext the page uses: voice, cues and mic all share it, so they share one clock
   * and one unlock (phones allow very few contexts, and each needs a tap to start).
   */
  context(): AudioContext {
    this.unlock();
    return this.ctx!;
  }

  /** Plays one of the three sound cues. */
  cue(cue: Cue): void {
    playCue(this.context(), cue);
  }

  /** The player's clock, in seconds. */
  now(): number {
    return this.ctx?.currentTime ?? 0;
  }

  /** Output loudness from 0 to 1 for the orb, or null when nothing is playing. */
  level(): number | null {
    if (this.backupLines > 0) return 0.5 + 0.3 * Math.abs(Math.sin(performance.now() / 140));
    if (!this.analyser || !this.sources.size) return null;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (const v of this.buffer) sum += v * v;
    return Math.min(1, Math.sqrt(sum / this.buffer.length) * 4);
  }

  /**
   * Queues a segment and resolves with its schedule and word timings once decoded.
   * Segments play strictly in the order play() was called, however long each takes to decode.
   */
  play(seg: Segment): Promise<PlayedSegment> {
    this.unlock();
    this.pending++;
    const generation = this.generation;
    // A Majlis segment starts downloading now, while any earlier one is still decoding.
    const fetched = seg.url
      ? fetch(seg.url)
          .then((res) => (res.ok ? res.arrayBuffer() : null))
          .catch(() => null)
      : null;
    const run = this.chain.then(() => this.schedule(seg, generation, fetched)).finally(() => this.pending--);
    this.chain = run.catch(() => {});
    return run;
  }

  /**
   * In a Majlis: someone's own recorded words, played in turn like a segment (so Sarjy's answer
   * follows it), but never part of Sarjy's caption. A clip that can't be fetched is skipped.
   * Resolves with when it plays, on the player's clock (null if it doesn't).
   */
  clip(url: string): Promise<{ startAt: number; endAt: number } | null> {
    this.unlock();
    this.pending++;
    const generation = this.generation;
    const fetched = fetch(url)
      .then((res) => (res.ok ? res.arrayBuffer() : null))
      .catch(() => null);
    const run = this.chain
      .then(async () => {
        const wav = await fetched;
        if (!wav || generation !== this.generation) return null;
        const audio = await this.ctx!.decodeAudioData(wav);
        if (generation !== this.generation) return null;
        const startAt = this.start(audio);
        return { startAt, endAt: startAt + audio.duration };
      })
      .finally(() => this.pending--);
    this.chain = run.catch(() => {});
    return run.catch(() => null);
  }

  /** Starts decoded audio when everything before it has played. Returns when it starts, on the clock. */
  private start(audio: AudioBuffer): number {
    const ctx = this.ctx!;
    const source = ctx.createBufferSource();
    source.buffer = audio;
    source.connect(this.analyser!);
    const at = Math.max(ctx.currentTime + 0.03, this.queueEnd);
    source.start(at);
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
    this.queueEnd = at + audio.duration;
    return at;
  }

  private async schedule(
    seg: Segment,
    generation: number,
    fetched: Promise<ArrayBuffer | null> | null,
  ): Promise<PlayedSegment> {
    const ctx = this.ctx!;
    const words = seg.text.split(/\s+/).filter(Boolean);
    // Stopped while this segment waited its turn: report it, but never make a sound.
    if (generation !== this.generation) {
      return { index: seg.index, words, timings: evenly(words, 0, 0), startAt: 0, endAt: 0, backup: false };
    }

    const wav = seg.audio ? base64ToBytes(seg.audio).buffer.slice(0) : fetched ? await fetched : null;
    if (wav) {
      try {
        const audio = await ctx.decodeAudioData(wav as ArrayBuffer);
        if (generation !== this.generation) {
          return {
            index: seg.index,
            words,
            timings: evenly(words, 0, 0),
            startAt: 0,
            endAt: 0,
            backup: false,
          };
        }
        const at = this.start(audio);
        const timings = estimateWordTimings(words, audio.getChannelData(0), audio.sampleRate);
        return { index: seg.index, words, timings, startAt: at, endAt: this.queueEnd, backup: false };
      } catch {
        // Undecodable audio: fall through to the backup voice.
      }
    }
    return this.speakWithBackup(seg, words, Math.max(ctx.currentTime + 0.03, this.queueEnd), generation);
  }

  /** The browser's own voice. Its word boundary events are real, so the caption still follows it. */
  private speakWithBackup(
    seg: { index: number; text: string; lang: "en" | "ar" },
    words: string[],
    startAt: number,
    generation: number,
  ): Promise<PlayedSegment> {
    const estimate = Math.max(0.8, seg.text.length * 0.065);
    const segment: PlayedSegment = {
      index: seg.index,
      words,
      timings: evenly(words, 0, estimate),
      startAt,
      endAt: startAt + estimate,
      backup: true,
    };
    this.queueEnd = segment.endAt;
    if (typeof speechSynthesis === "undefined") return Promise.resolve(segment);

    const delay = Math.max(0, (startAt - this.now()) * 1000);
    window.setTimeout(() => {
      if (generation !== this.generation) return; // stopped before its turn came
      const u = new SpeechSynthesisUtterance(seg.text);
      u.lang = seg.lang === "ar" ? "ar-SA" : "en-US";
      u.voice = bestVoice(speechSynthesis.getVoices(), seg.lang);
      u.rate = 1;
      const began = this.now();
      this.backupLines++;
      u.onboundary = (e) => {
        // Pull the estimate toward the real boundary of the word being said.
        const i = seg.text.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length;
        const timing = segment.timings[i];
        if (timing) timing.start = Math.min(timing.start, this.now() - began);
      };
      // Done: it ended, it failed, or it never said so. Some browsers never report the end (no
      // voice for the language, a voice that failed to load); without the timer Sarjy would
      // stay on "Speaking" for good.
      let released = false;
      const release = () => {
        if (released || generation !== this.generation) return;
        released = true;
        this.backupLines = Math.max(0, this.backupLines - 1);
        segment.endAt = this.now();
        this.queueEnd = Math.max(this.queueEnd, segment.endAt);
      };
      u.onend = release;
      u.onerror = release;
      window.setTimeout(release, (estimate * 2 + BACKUP_GRACE_S) * 1000);
      speechSynthesis.speak(u);
    }, delay);
    return Promise.resolve(segment);
  }

  /** True while anything is decoding, queued or playing. */
  busy(): boolean {
    return this.pending > 0 || this.backupLines > 0 || this.sources.size > 0 || this.now() < this.queueEnd;
  }

  /** Stops everything at once (End, barge-in, a new turn). */
  stop(): void {
    this.generation++;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    }
    this.sources.clear();
    this.queueEnd = this.now();
    this.backupLines = 0;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
}

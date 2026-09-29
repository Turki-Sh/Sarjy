// Plays Sarjy's voice (architecture, section 11, "Playback").
// Every segment is decoded and scheduled back to back on one AudioContext clock, so the caption
// can ask "which word is being said right now?" with one number. An analyser on the output gives
// the loudness that drives the orb while Sarjy speaks.
// A segment without audio (voice quota or error) is spoken by the browser's own voice instead.

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

const base64ToBytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export class Player {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer = new Float32Array(1024);
  private sources = new Set<AudioBufferSourceNode>();
  private queueEnd = 0;
  private speakingBackup = false;

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
    if (this.speakingBackup) return 0.5 + 0.3 * Math.abs(Math.sin(performance.now() / 140));
    if (!this.analyser || !this.sources.size) return null;
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (const v of this.buffer) sum += v * v;
    return Math.min(1, Math.sqrt(sum / this.buffer.length) * 4);
  }

  /** Queues a segment and resolves with its schedule and word timings once decoded. */
  async play(seg: {
    index: number;
    text: string;
    lang: "en" | "ar";
    audio: string | null;
  }): Promise<PlayedSegment> {
    this.unlock();
    const ctx = this.ctx!;
    const words = seg.text.split(/\s+/).filter(Boolean);

    if (seg.audio) {
      try {
        const bytes = base64ToBytes(seg.audio);
        const audio = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
        const source = ctx.createBufferSource();
        source.buffer = audio;
        source.connect(this.analyser!);
        const at = Math.max(ctx.currentTime + 0.03, this.queueEnd);
        source.start(at);
        this.sources.add(source);
        source.onended = () => this.sources.delete(source);
        this.queueEnd = at + audio.duration;
        const timings = estimateWordTimings(words, audio.getChannelData(0), audio.sampleRate);
        return { index: seg.index, words, timings, startAt: at, endAt: this.queueEnd, backup: false };
      } catch {
        // Undecodable audio: fall through to the backup voice.
      }
    }
    return this.speakWithBackup(seg, words, Math.max(ctx.currentTime + 0.03, this.queueEnd));
  }

  /** The browser's own voice. Its word boundary events are real, so the caption still follows it. */
  private speakWithBackup(
    seg: { index: number; text: string; lang: "en" | "ar" },
    words: string[],
    startAt: number,
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
      const u = new SpeechSynthesisUtterance(seg.text);
      u.lang = seg.lang === "ar" ? "ar-SA" : "en-US";
      u.rate = 1;
      const began = this.now();
      this.speakingBackup = true;
      u.onboundary = (e) => {
        // Pull the estimate toward the real boundary of the word being said.
        const i = seg.text.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length;
        const timing = segment.timings[i];
        if (timing) timing.start = Math.min(timing.start, this.now() - began);
      };
      u.onend = () => {
        this.speakingBackup = false;
        segment.endAt = this.now();
        this.queueEnd = Math.max(this.queueEnd, segment.endAt);
      };
      speechSynthesis.speak(u);
    }, delay);
    return Promise.resolve(segment);
  }

  /** True while anything is queued or playing. */
  busy(): boolean {
    return this.speakingBackup || this.sources.size > 0 || this.now() < this.queueEnd;
  }

  /** Stops everything at once (End, barge-in, a new turn). */
  stop(): void {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    }
    this.sources.clear();
    this.queueEnd = this.now();
    this.speakingBackup = false;
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }
}

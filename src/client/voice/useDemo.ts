"use client";

// A scripted stand-in for a real turn, used until the voice pipeline lands (milestone M4).
// It walks the same six states with the same timings as the reference build, so every visual
// piece (orb, captions, chip, the stitch) can be built and reviewed before any audio exists.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/shared/i18n";
import type { VoiceState } from "@/shared/states";
import type { CaptionModel } from "../ui/Caption";
import type { MemoryItem } from "../ui/Sidebar";
import type { ToolChipModel } from "../ui/ToolChip";

type Script = {
  ask: string;
  answer: string;
  tool?: { label: string; ms: number };
  save?: { memory: Omit<MemoryItem, "id">; keep: { start: number; end: number } };
};

const SCRIPTS: Record<Lang, Script[]> = {
  en: [
    {
      ask: "What's the weather in Riyadh tomorrow?",
      answer: "Clear skies and a high of 41 tomorrow. I kept it in Celsius, like you asked.",
      tool: { label: 'weather.forecast("Riyadh", "tomorrow")', ms: 412 },
    },
    {
      ask: "My favorite food is kabsa.",
      answer: "Saved. Your favorite food is kabsa.",
      save: { memory: { label: "Favorite food", value: "Kabsa", lang: "en" }, keep: { start: 2, end: 6 } },
    },
  ],
  ar: [
    {
      ask: "كيف الجو بالرياض بكرة؟",
      answer: "صحو، والعظمى ٤١ درجة. خليتها بالمئوي مثل ما طلبت.",
      tool: { label: 'weather.forecast("Riyadh", "tomorrow")', ms: 412 },
    },
    {
      ask: "أكلتي المفضلة كبسة.",
      answer: "حفظت. أكلتك المفضلة كبسة.",
      save: { memory: { label: "الأكلة المفضلة", value: "كبسة", lang: "ar" }, keep: { start: 1, end: 4 } },
    },
  ],
};

const WORD_MS = { stream: 260, speak: 240 };

export type DemoView = {
  state: VoiceState;
  caption: CaptionModel | null;
  chip: ToolChipModel | null;
};

export function useDemo(lang: Lang, onSaved: (memory: Omit<MemoryItem, "id">) => void) {
  const [view, setView] = useState<DemoView>({ state: "idle", caption: null, chip: null });
  const timers = useRef<number[]>([]);
  const turn = useRef(0);

  const clear = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };
  const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));

  useEffect(() => clear, []);

  const stop = useCallback(() => {
    clear();
    setView((v) => ({ ...v, state: "idle" }));
  }, []);

  const run = useCallback(() => {
    clear();
    const scripts = SCRIPTS[lang];
    const script = scripts[turn.current++ % scripts.length]!;
    const ask = script.ask.split(" ");
    const answer = script.answer.split(" ");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let t = 0;

    // Listening: your words stream in.
    setView({
      state: "listening",
      chip: null,
      caption: { speaker: "user", lang, words: ask, shown: 0, style: "stream" },
    });
    ask.forEach((_, i) =>
      at((t += reduce ? 0 : WORD_MS.stream), () =>
        setView((v) => (v.caption ? { ...v, caption: { ...v.caption, shown: i + 1 } } : v)),
      ),
    );

    // Thinking: your words dim while Sarjy works out the answer.
    at((t += 500), () =>
      setView((v) => ({ ...v, state: "thinking", caption: v.caption && { ...v.caption, style: "dim" } })),
    );
    t += 900;

    // Checking a tool: the chip appears, then its timing lands.
    if (script.tool) {
      const tool = script.tool;
      at(t, () => setView((v) => ({ ...v, state: "tool", chip: { label: tool.label } })));
      at((t += tool.ms + 300), () => setView((v) => ({ ...v, chip: { label: tool.label, ms: tool.ms } })));
      t += 300;
    }

    // Speaking: Sarjy's words come into focus one by one.
    at(t, () =>
      setView((v) => ({
        ...v,
        state: "speaking",
        caption: { speaker: "sarjy", lang, words: answer, shown: reduce ? answer.length : 0, style: "speak" },
      })),
    );
    answer.forEach((_, i) =>
      at((t += reduce ? 0 : WORD_MS.speak), () =>
        setView((v) => (v.caption ? { ...v, caption: { ...v.caption, shown: i + 1 } } : v)),
      ),
    );

    // Saving: the fact gets the stitch, the card appears, then back to rest. Otherwise straight to idle.
    const save = script.save;
    if (save) {
      at((t += 400), () => {
        onSaved(save.memory);
        setView((v) => ({ ...v, state: "saving", caption: v.caption && { ...v.caption, keep: save.keep } }));
      });
      at((t += 1200), () => setView((v) => ({ ...v, state: "idle" })));
    } else {
      at((t += 600), () => setView((v) => ({ ...v, state: "idle" })));
    }
  }, [lang, onSaved]);

  return { view, run, stop };
}

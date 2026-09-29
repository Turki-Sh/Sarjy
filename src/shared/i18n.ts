// Interface strings in English and Arabic. Sarjy's own words come from the model, not from here.
// Arabic is everyday Saudi Arabic, as the brand book asks.

import type { VoiceState } from "./states";

export const LANGS = ["en", "ar"] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (value: unknown): value is Lang => value === "en" || value === "ar";

export const dir = (lang: Lang): "ltr" | "rtl" => (lang === "ar" ? "rtl" : "ltr");

type Strings = {
  status: Record<VoiceState, string>;
  announce: Record<VoiceState, string>;
  talk: string;
  stop: string;
  end: string;
  voiceSettings: string;
  newChat: string;
  search: string;
  memory: string;
  recent: string;
  memoryOn: string;
  theme: string;
  language: string;
  otherLanguage: string;
  invite: string;
  typePlaceholder: string;
  send: string;
  emptyMemory: string;
  about: string;
  tagline: string;
  description: string;
};

export const STRINGS: Record<Lang, Strings> = {
  en: {
    status: {
      idle: "Tap the mic to talk",
      listening: "Listening…",
      thinking: "Thinking…",
      tool: "Checking the weather…",
      speaking: "Speaking",
      saving: "Saved to memory",
    },
    announce: {
      idle: "Sarjy is ready",
      listening: "Listening",
      thinking: "Thinking",
      tool: "Checking the weather",
      speaking: "Speaking",
      saving: "Saved",
    },
    talk: "Talk to Sarjy",
    stop: "Stop",
    end: "End",
    voiceSettings: "Voice settings",
    newChat: "New chat",
    search: "Search",
    memory: "Memory",
    recent: "Recent",
    memoryOn: "Memory on",
    theme: "Switch theme",
    language: "Switch language",
    otherLanguage: "العربية",
    invite: "Invite to your Majlis",
    typePlaceholder: "Type to Sarjy…",
    send: "Send",
    emptyMemory: "Nothing yet. Tell Sarjy something about you.",
    about: "About Sarjy",
    tagline: "Shaped to its rider.",
    description:
      "Sarjy is a voice assistant that remembers what you tell it, answers from real tools, and shows you everything it keeps.",
  },
  ar: {
    status: {
      idle: "اضغط المايك وتكلّم",
      listening: "أسمعك…",
      thinking: "أفكّر…",
      tool: "أشوف الطقس…",
      speaking: "أتكلّم",
      saving: "انحفظ في الذاكرة",
    },
    announce: {
      idle: "سرجي جاهز",
      listening: "أسمعك",
      thinking: "أفكّر",
      tool: "أشوف الطقس",
      speaking: "أتكلّم",
      saving: "انحفظ",
    },
    talk: "كلّم سرجي",
    stop: "إيقاف",
    end: "إنهاء",
    voiceSettings: "إعدادات الصوت",
    newChat: "محادثة جديدة",
    search: "بحث",
    memory: "الذاكرة",
    recent: "الأخيرة",
    memoryOn: "الذاكرة شغّالة",
    theme: "تغيير المظهر",
    language: "تغيير اللغة",
    otherLanguage: "English",
    invite: "ادعُ لمجلسك",
    typePlaceholder: "اكتب لسرجي…",
    send: "إرسال",
    emptyMemory: "ما فيه شي للحين. قل لسرجي شي عنك.",
    about: "عن سرجي",
    tagline: "على مقاس فارسه.",
    description: "سرجي مساعد صوتي يتذكر اللي تقوله، ويجاوب من أدوات حقيقية، ويوريك كل شي يحفظه.",
  },
};

export const t = (lang: Lang) => STRINGS[lang];

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
  share: string;
  linkCopied: string;
  /** Shown when the mic can't be used; the text box takes over. */
  micBlocked: string;
  /** Under the orb after New chat, and after opening a past chat. */
  freshChat: string;
  continuing: string;
  noMatches: string;
  openSidebar: string;
  changePicture: string;
  rename: string;
  closeSidebar: string;
  sharedMoment: string;
  sharedNote: string;
  about: string;
  description: string;
};

export const STRINGS: Record<Lang, Strings> = {
  en: {
    status: {
      idle: "Tap Sarjy to talk",
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
    share: "Share this moment",
    linkCopied: "Link copied",
    micBlocked: "No mic access. You can type instead.",
    freshChat: "A new chat. What's on your mind?",
    continuing: "Picking up where you left off",
    noMatches: "Nothing matches",
    openSidebar: "Open sidebar",
    changePicture: "Change your picture",
    rename: "Rename",
    closeSidebar: "Close sidebar",
    sharedMoment: "A moment with Sarjy",
    sharedNote: "Shared by the person who had this conversation. Only people with the link can see it.",
    about: "About Sarjy",
    description:
      "Sarjy is a voice assistant that remembers what you tell it, answers from real tools, and shows you everything it keeps.",
  },
  ar: {
    status: {
      idle: "اضغط على سرجي وتكلّم",
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
    share: "شارك هاللحظة",
    linkCopied: "تم نسخ الرابط",
    micBlocked: "ما فيه وصول للمايك. تقدر تكتب بدلها.",
    freshChat: "سالفة جديدة. وش في بالك؟",
    continuing: "نكمل من حيث وقفنا",
    noMatches: "ما فيه نتائج",
    openSidebar: "افتح القائمة",
    changePicture: "غيّر صورتك",
    rename: "غيّر الاسم",
    closeSidebar: "اقفل القائمة",
    sharedMoment: "لحظة مع سرجي",
    sharedNote: "شاركها صاحب المحادثة. ما يشوفها إلا اللي عنده الرابط.",
    about: "عن سرجي",
    description: "سرجي مساعد صوتي يتذكر اللي تقوله، ويجاوب من أدوات حقيقية، ويوريك كل شي يحفظه.",
  },
};

export const t = (lang: Lang) => STRINGS[lang];

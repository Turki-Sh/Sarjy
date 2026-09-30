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
  /** Under the orb after New chat: one of these, at random (Turki's lines, Day 2). */
  freshChat: string[];
  continuing: string;
  noMatches: string;
  openSidebar: string;
  changePicture: string;
  rename: string;
  savedCard: string;
  welcome: { line: string; skip: string };
  wholeChat: (n: number) => string;
  lessChat: string;
  picture: { add: string; remove: string; bad: string; sent: string };
  details: {
    open: string;
    title: string;
    heard: string;
    firstWord: string;
    firstSound: string;
    tools: string;
    done: string;
    model: string;
    tokens: string;
    cost: string;
    perThousand: string;
    close: string;
  };
  chatMenu: {
    more: string;
    pin: string;
    unpin: string;
    share: string;
    del: string;
    confirmDelete: string;
    pinned: string;
  };
  /** The settings popup. */
  settings: {
    title: string;
    open: string;
    close: string;
    general: string;
    appearance: string;
    profile: string;
    memory: string;
    voice: string;
    voiceHint: string;
    voiceEn: string;
    voiceAr: string;
    listen: string;
    language: string;
    languageHint: string;
    auto: string;
    mode: string;
    glass: string;
    glassHint: string;
    glassStops: [string, string, string, string];
    glassSystem: string;
    system: string;
    light: string;
    dark: string;
    picture: string;
    upload: string;
    uploadHint: string;
    badImage: string;
    name: string;
    save: string;
    memoryHint: string;
    edit: string;
    forget: string;
    cancel: string;
    forgetAll: string;
    forgetAllHint: string;
    forgetAllConfirm: string;
  };
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
    freshChat: [
      "What's on your mind? I'm all ears.",
      "No need to find the perfect words. Just talk.",
      "You're holding the reins. Where to?",
      "What's the story today?",
      "Take your time. I'm right here.",
      "Give me a starting point. We'll figure out the rest together.",
      "Where shall we take this conversation?",
      "What would you like to make happen today?",
      "Tell me what's on your mind. We'll find a way forward.",
      "Where shall we pick up?",
    ],
    continuing: "Picking up where you left off",
    noMatches: "Nothing matches",
    openSidebar: "Open sidebar",
    changePicture: "Change your picture",
    rename: "Rename",
    savedCard: "Saved",
    welcome: {
      line: "Hey, I'm Sarjy. Tap me and say hi, or type below. Tell me things and I'll remember them.",
      skip: "Skip the intro",
    },
    wholeChat: (n) => `Show the whole chat (${n})`,
    lessChat: "Show less",
    picture: {
      add: "Add a picture",
      remove: "Remove the picture",
      bad: "That picture couldn't be used. Try a JPG or PNG.",
      sent: "Your picture",
    },
    details: {
      open: "How this answer was made",
      title: "How this answer was made",
      heard: "Heard you",
      firstWord: "First word",
      firstSound: "First sound",
      tools: "Tools",
      done: "Done",
      model: "Model",
      tokens: "Tokens in, out",
      cost: "Cost",
      perThousand: "per 1,000 answers like this",
      close: "Close",
    },
    chatMenu: {
      more: "More options",
      pin: "Pin",
      unpin: "Unpin",
      share: "Share",
      del: "Delete",
      confirmDelete: "Delete for good?",
      pinned: "Pinned",
    },
    settings: {
      title: "Settings",
      open: "Open settings",
      close: "Close settings",
      general: "General",
      appearance: "Appearance",
      profile: "Profile",
      memory: "Memory",
      voice: "Voice",
      voiceHint:
        "Sarjy answers in the language you speak, in the voice you pick for it. Pick one to hear it.",
      voiceEn: "English",
      voiceAr: "Arabic",
      listen: "Listen",
      language: "Language",
      languageHint: "The language of the app. Sarjy always answers in the language you speak.",
      auto: "Auto detect",
      mode: "Mode",
      glass: "Glass",
      glassHint: "From solid to fully clear. In between, frosted glass that bends the light behind it.",
      glassStops: ["Solid", "Frosted", "Liquid", "Clear"],
      glassSystem:
        "Your device asks for less transparency (on Windows: Transparency effects is off), so Sarjy started Solid. Move the slider to choose for yourself.",
      system: "System",
      light: "Light",
      dark: "Dark",
      picture: "Picture",
      upload: "Upload your own",
      uploadHint: "Any photo works; it's cropped to a square and kept small.",
      badImage: "That picture couldn't be used. Try a JPG or PNG.",
      name: "Your name",
      save: "Save",
      memoryHint: "Everything Sarjy remembers about you. Change or forget anything.",
      edit: "Edit",
      forget: "Forget",
      cancel: "Cancel",
      forgetAll: "Forget everything",
      forgetAllHint: "Deletes your memories, chats and profile. This can't be undone.",
      forgetAllConfirm: "Yes, forget everything",
    },
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
    freshChat: [
      "سمّ، وش بخاطرك؟",
      "ما يحتاج ترتّب كلامك، بس احكِ.",
      "الزمام بيدك، وين نروح؟",
      "وش الحكاية اليوم؟",
      "خذ راحتك، أنا معك.",
      "عطني أول الخيط، ونكملها سوا.",
      "على وين نوجّه السالفة؟",
      "وش اللي ودّك يصير اليوم؟",
      "قل اللي بخاطرك، ونلقى لها طريق.",
      "من وين نكمل؟",
    ],
    continuing: "نكمل من حيث وقفنا",
    noMatches: "ما فيه نتائج",
    openSidebar: "افتح القائمة",
    changePicture: "غيّر صورتك",
    rename: "غيّر الاسم",
    savedCard: "انحفظ",
    welcome: {
      line: "هلا، أنا سرجي. اضغط علي وسلّم، أو اكتب تحت. قل لي أشياء وأتذكرها لك.",
      skip: "تخطّ التعريف",
    },
    wholeChat: (n) => `اعرض السالفة كاملة (${n.toLocaleString("ar-SA")})`,
    lessChat: "اعرض أقل",
    picture: {
      add: "أضف صورة",
      remove: "شيل الصورة",
      bad: "ما قدرت أستخدم هالصورة. جرّب JPG أو PNG.",
      sent: "صورتك",
    },
    details: {
      open: "كيف انصنع هالرد",
      title: "كيف انصنع هالرد",
      heard: "سمعتك",
      firstWord: "أول كلمة",
      firstSound: "أول صوت",
      tools: "الأدوات",
      done: "خلص",
      model: "النموذج",
      tokens: "التوكنز داخل، طالع",
      cost: "التكلفة",
      perThousand: "لكل ١٬٠٠٠ رد مثله",
      close: "سكّر",
    },
    chatMenu: {
      more: "خيارات أكثر",
      pin: "ثبّت",
      unpin: "شيل التثبيت",
      share: "شارك",
      del: "احذف",
      confirmDelete: "متأكد تحذفها؟",
      pinned: "مثبّتة",
    },
    settings: {
      title: "الإعدادات",
      open: "افتح الإعدادات",
      close: "اقفل الإعدادات",
      general: "عام",
      appearance: "المظهر",
      profile: "ملفك",
      memory: "الذاكرة",
      voice: "الصوت",
      voiceHint: "سرجي يرد باللغة اللي تتكلم فيها، بالصوت اللي تختاره لها. اختر صوت وتسمعه.",
      voiceEn: "الإنجليزي",
      voiceAr: "العربي",
      listen: "اسمع",
      language: "اللغة",
      languageHint: "لغة التطبيق. سرجي دايم يرد باللغة اللي تتكلم فيها.",
      auto: "تلقائي",
      mode: "الوضع",
      glass: "الزجاج",
      glassHint: "من سادة إلى شفاف تمامًا. وبينهم زجاج مصنفر يكسر الضوء اللي وراه.",
      glassStops: ["سادة", "مصنفر", "سائل", "شفاف"],
      glassSystem:
        "جهازك طالب شفافية أقل (في ويندوز: تأثيرات الشفافية مقفلة)، عشان كذا بدأ سرجي سادة. حرّك المؤشر واختر بنفسك.",
      system: "حسب الجهاز",
      light: "فاتح",
      dark: "داكن",
      picture: "الصورة",
      upload: "ارفع صورتك",
      uploadHint: "أي صورة تمشي؛ نقصّها مربعة ونصغّرها.",
      badImage: "ما قدرت أستخدم هالصورة. جرّب JPG أو PNG.",
      name: "اسمك",
      save: "حفظ",
      memoryHint: "كل اللي يتذكره سرجي عنك. عدّل أو احذف أي شي.",
      edit: "تعديل",
      forget: "انسَ",
      cancel: "إلغاء",
      forgetAll: "انسَ كل شي",
      forgetAllHint: "يحذف ذاكرتك وسوالفك وملفك. ما تقدر ترجعها.",
      forgetAllConfirm: "إي، انسَ كل شي",
    },
    closeSidebar: "اقفل القائمة",
    sharedMoment: "لحظة مع سرجي",
    sharedNote: "شاركها صاحب المحادثة. ما يشوفها إلا اللي عنده الرابط.",
    about: "عن سرجي",
    description: "سرجي مساعد صوتي يتذكر اللي تقوله، ويجاوب من أدوات حقيقية، ويوريك كل شي يحفظه.",
  },
};

export const t = (lang: Lang) => STRINGS[lang];

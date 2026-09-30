// Interface strings in English and Arabic. Sarjy's own words come from the model, not from here.
// Arabic is everyday Saudi Arabic, as the brand book asks.

import type { RafeeqId, UNLOCKS } from "./rafeeq";
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
  /** Said once when the browser's voice stands in for Sarjy's (Groq's daily limit, or an error). */
  voiceResting: string;
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
    memory: string;
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
    rafeeq: string;
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
    glassStops: [string, string, string, string, string];
    glassSystem: string;
    /** Settings, Appearance, Background (Turki's direction, Day 2). */
    background: string;
    backgroundHint: string;
    backgroundLight: string;
    backgroundYours: string;
    backgroundUpload: string;
    backgroundBad: string;
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
    /** Under a memory: the words it came from. */
    memoryFrom: string;
    edit: string;
    forget: string;
    cancel: string;
    forgetAll: string;
    forgetAllHint: string;
    forgetAllConfirm: string;
  };
  closeSidebar: string;
  /** Rafeeq, the companion (shared/rafeeq.ts). */
  rafeeq: {
    intro: string;
    none: string;
    noneLine: string;
    names: Record<RafeeqId, string>;
    lines: Record<RafeeqId, string>;
    /** Three words for who each one is, and its story. */
    traits: Record<RafeeqId, string>;
    stories: Record<RafeeqId, string>;
    /** Two families in the picker: the plush Rafeeqs, and the first four. */
    groups: { plush: string; classic: string };
    /** A short level badge on each companion's card ("Lv 3"). */
    short: (n: number) => string;
    /** The five bond levels, 1 to 5. */
    levels: readonly string[];
    level: (n: number) => string;
    toNext: (points: number) => string;
    maxed: string;
    unlocks: Record<keyof typeof UNLOCKS, string>;
    how: string;
    levelUp: (name: string, level: string) => string;
    open: string;
  };
  /** The Majlis: several people, one Sarjy (architecture, section 13). */
  majlis: {
    start: string;
    name: (host: string | null) => string;
    /** How a Majlis chat is titled in Recent. */
    chat: (title: string) => string;
    invite: string;
    inviteText: (host: string | null) => string;
    linkCopied: string;
    join: string;
    joinHint: string;
    askName: string;
    namePlaceholder: string;
    you: string;
    guest: (seat: number) => string;
    holding: (name: string) => string;
    answering: (name: string) => string;
    talkTo: string;
    everyone: string;
    sarjy: string;
    tapToAsk: string;
    typeEveryone: string;
    busy: (name: string) => string;
    tapToTalk: string;
    leave: string;
    end: string;
    endConfirm: string;
    ended: string;
    full: string;
    missing: string;
    back: string;
    here: (n: number) => string;
    reconnecting: string;
    people: string;
  };
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
    voiceResting: "My voice is taking a break, so your browser is reading for me for now.",
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
    savedCard: "Noted",
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
      memory: "Remembering",
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
      rafeeq: "Rafeeq",
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
      glassHint:
        "From solid to pure glass, with only its edges showing. In between, frosted glass that bends the light behind it.",
      glassStops: ["Solid", "Frosted", "Liquid", "Clear", "Pure"],
      glassSystem:
        "Your device asks for less transparency (on Windows: Transparency effects is off), so Sarjy started Solid. Move the slider to choose for yourself.",
      background: "Background",
      backgroundHint: "The glow, a rug, or your own picture. Pure glass shows it best.",
      backgroundLight: "Glow",
      backgroundYours: "Your picture",
      backgroundUpload: "Upload a wallpaper",
      backgroundBad: "That picture couldn't be used. Try a JPEG or PNG.",
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
      memoryFrom: "You said",
      edit: "Edit",
      forget: "Forget",
      cancel: "Cancel",
      forgetAll: "Forget everything",
      forgetAllHint: "Deletes your memories, chats and profile. This can't be undone.",
      forgetAllConfirm: "Yes, forget everything",
    },
    closeSidebar: "Close sidebar",
    rafeeq: {
      intro:
        "A companion for your chats, in place of the orb. It reacts to everything you and Sarjy do, and the more you talk, the closer you get.",
      none: "No Rafeeq",
      noneLine: "Just the orb.",
      names: {
        rider: "Rider",
        keeper: "Keeper",
        scout: "Scout",
        drifter: "Drifter",
        dune: "Dune",
        lantern: "Lantern",
        fennec: "Fennec",
        breeze: "Breeze",
      },
      lines: {
        rider: "The core Rafeeq. Steady, attentive, always by your side.",
        keeper: "Carries what matters, so the journey feels easier.",
        scout: "Notices what others miss, always a little further ahead.",
        drifter: "Finds beauty in the in-between, and turns detours into stories.",
        dune: "A sand dune in a shemagh. Bold and cheerful.",
        lantern: "Lights its brass lantern for every memory.",
        fennec: "The desert fox. Ears up for every search.",
        breeze: "A puff of desert wind. Dreamy, always drifting by.",
      },
      traits: {
        rider: "Balanced · Attentive · Ready",
        keeper: "Dependable · Gentle · Generous",
        scout: "Curious · Alert · Observant",
        drifter: "Relaxed · Adaptable · Dreamy",
        dune: "Bold · Cheerful · Proud",
        lantern: "Calm · Wise · Warm",
        fennec: "Prickly · Sharp · Secretly soft",
        breeze: "Playful · Restless · Cheeky",
      },
      stories: {
        rider:
          "Rode with the caravans from Najran to the Hijaz, and knows every well by name. The saddle on its back is the one it was born with. Nothing startles it, and it never leaves your side.",
        keeper:
          "Carries a satchel of other people's little things: a date seed, a letter, the words of a song. It has never lost one. Shy when you look at it, happiest when you're close.",
        scout:
          "Climbs the tallest dune before sunrise to see what's coming. It has never once been surprised, and can't stand not knowing. It leans in, always.",
        drifter:
          "Has been everywhere, and is in no hurry to be anywhere. Collects stories, not things. Likes a long nap, a gentle stroke, and not being rushed.",
        dune: "The tallest dune in the Empty Quarter, or so it says. Wears its shemagh like a crown and loves an audience. Laughs loud, sulks for a second, laughs again.",
        lantern:
          "Lit the way for night travellers for a hundred years. Speaks softly, glows warmer when you're near, and remembers everything you tell it.",
        fennec:
          "A desert fox who hates being stared at and loves being fed. Hears everything, pretends not to. Grumbles when you pet it, then leans in for more.",
        breeze:
          "Born where the wind turns. Can't sit still, loves to tease, and always leaves a little sand behind. Try to touch it and it slips away, giggling.",
      },
      groups: { plush: "The Rafeeqs", classic: "The first four" },
      short: (n) => `Lv ${n}`,
      levels: ["New friend", "Getting close", "Friend", "Close friend", "Rafeeq"],
      level: (n) => `Level ${n}`,
      toNext: (points) => `${points} more to the next level`,
      maxed: "A true Rafeeq.",
      unlocks: {
        greet: "Greets you when you arrive",
        purr: "Purrs and shows hearts when you pet it",
        trick: "Does its own trick while it waits",
        star: "Wears a gold star, and saves glow gold",
      },
      how: "Talk, save things, and pet it (stroke it with your pointer or finger) to grow your bond.",
      levelUp: (name, level) => `${name} leveled up: ${level}!`,
      open: "Your Rafeeq",
    },
    majlis: {
      start: "Start a Majlis",
      name: (host) => (host ? `${host}'s Majlis` : "A Majlis"),
      chat: (title) => (title ? `Majlis: ${title}` : "Majlis"),
      invite: "Invite",
      inviteText: (host) => (host ? `Join ${host}'s Majlis on Sarjy` : "Join a Majlis on Sarjy"),
      linkCopied: "Invite link copied.",
      join: "Come in",
      joinHint: "Everyone here hears Sarjy. What you've told Sarjy before stays yours.",
      askName: "What should everyone call you?",
      namePlaceholder: "Your name",
      you: "You",
      guest: (seat) => `Guest ${seat + 1}`,
      holding: (name) => `${name} has the mic`,
      answering: (name) => `Sarjy is answering ${name}`,
      talkTo: "Talk to",
      everyone: "Everyone",
      sarjy: "Sarjy",
      tapToAsk: "Tap the finjan to ask Sarjy",
      typeEveryone: "Message everyone…",
      busy: (name) => `${name} has the mic. Give them a sec.`,
      tapToTalk: 'Tap to talk to everyone. Start with "Sarjy" to ask it.',
      leave: "Leave",
      end: "End for everyone",
      endConfirm: "End the Majlis for everyone?",
      ended: "This Majlis has ended.",
      full: "This Majlis is full: 8 people at most.",
      missing: "There's no Majlis at this link.",
      back: "Back to Sarjy",
      here: (n) => (n === 1 ? "1 here" : `${n} here`),
      reconnecting: "Reconnecting",
      people: "Who's here",
    },
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
    voiceResting: "صوتي ماخذ استراحة، فالمتصفح بيقرأ عني شوي.",
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
    savedCard: "حفظتها",
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
      memory: "التذكّر",
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
      rafeeq: "رفيق",
      voiceHint: "سرجي يرد باللغة اللي تتكلم فيها، بالصوت اللي تختاره لها. اختر صوت وتسمعه.",
      voiceEn: "الإنجليزي",
      voiceAr: "العربي",
      listen: "اسمع",
      language: "اللغة",
      languageHint: "لغة التطبيق. سرجي دايم يرد باللغة اللي تتكلم فيها.",
      auto: "تلقائي",
      mode: "الوضع",
      glass: "الزجاج",
      glassHint: "من سادة إلى زجاج صافي ما يبان منه إلا أطرافه. وبينهم زجاج مصنفر يكسر الضوء اللي وراه.",
      glassStops: ["سادة", "مصنفر", "سائل", "شفاف", "صافي"],
      glassSystem:
        "جهازك طالب شفافية أقل (في ويندوز: تأثيرات الشفافية مقفلة)، عشان كذا بدأ سرجي سادة. حرّك المؤشر واختر بنفسك.",
      background: "الخلفية",
      backgroundHint: "الوهج، أو سجادة، أو صورتك. الزجاج الصافي يبينها أحلى شي.",
      backgroundLight: "الوهج",
      backgroundYours: "صورتك",
      backgroundUpload: "ارفع خلفية",
      backgroundBad: "ما قدرت أستخدم هالصورة. جرب JPEG أو PNG.",
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
      memoryFrom: "قلت",
      edit: "تعديل",
      forget: "انسَ",
      cancel: "إلغاء",
      forgetAll: "انسَ كل شي",
      forgetAllHint: "يحذف ذاكرتك وسوالفك وملفك. ما تقدر ترجعها.",
      forgetAllConfirm: "إي، انسَ كل شي",
    },
    closeSidebar: "اقفل القائمة",
    rafeeq: {
      intro: "رفيق لسوالفك بدال الكرة. يتفاعل مع كل شي تسويه أنت وسرجي، وكل ما سولفت أكثر صرتوا أقرب.",
      none: "بدون رفيق",
      noneLine: "الكرة بس.",
      names: {
        rider: "خيّال",
        keeper: "حافظ",
        scout: "كشّاف",
        drifter: "رحّال",
        dune: "كثيب",
        lantern: "فانوس",
        fennec: "فنك",
        breeze: "نسيم",
      },
      lines: {
        rider: "الرفيق الأساسي. ثابت ومنتبه ودايم جنبك.",
        keeper: "يشيل اللي يهمك عشان يخف عليك المشوار.",
        scout: "ينتبه للي يفوت غيره، ودايم سابقك بخطوة.",
        drifter: "يلقى الحلا في الطريق، ويحوّل كل لفّة لسالفة.",
        dune: "كثيب رمل لابس شماغ. جريء ومستانس.",
        lantern: "يولّع فانوسه النحاسي مع كل ذكرى.",
        fennec: "ثعلب الصحرا، آذانه فوق مع كل بحث.",
        breeze: "نسمة من هوا البر. سرحانة ودايم تطفو.",
      },
      traits: {
        rider: "متوازن · منتبه · جاهز",
        keeper: "يعتمد عليه · حنون · كريم",
        scout: "فضولي · صاحي · لمّاح",
        drifter: "رايق · مرن · سرحان",
        dune: "جريء · مستانس · شايف نفسه",
        lantern: "هادي · حكيم · دافي",
        fennec: "متنرفز · حاد · قلبه طيب",
        breeze: "لعوب · ما يهدا · شقي",
      },
      stories: {
        rider:
          "مشى مع القوافل من نجران للحجاز، ويعرف كل بير باسمه. السرج اللي على ظهره معه من يوم انولد. ما يخوفه شي، وما يفارقك.",
        keeper:
          "يشيل بشنطته أغراض صغيرة للناس: نواة تمر، ورسالة، وكلمات أغنية. عمره ما ضيّع شي. يستحي إذا طالعته، ويفرح إذا قربت.",
        scout: "يطلع أعلى طعس قبل الشروق عشان يشوف وش جاي. عمره ما تفاجأ، وما يطيق ما يدري. دايم مقرّب يشوف.",
        drifter:
          "راح كل مكان، وما هو مستعجل يروح لأي مكان. يجمع سوالف مو أغراض. يحب النومة الطويلة والدلع، وإن محد يستعجله.",
        dune: "أطول طعس في الربع الخالي، على كلامه. لابس شماغه كأنه تاج ويحب أحد يطالعه. يضحك بصوت عالي، يزعل ثانية، ويرجع يضحك.",
        lantern: "نوّر الدرب لمسافرين الليل مية سنة. صوته هادي، ويدفى إذا قربت، ويتذكر كل شي تقوله.",
        fennec:
          "ثعلب صحرا ما يحب أحد يطالعه، ويموت في الأكل. يسمع كل شي ويسوي نفسه ما سمع. يتنرفز إذا دلعته، وبعدين يقرب يبي زود.",
        breeze:
          "انولد عند منعطف الريح. ما يهدا، يحب يتشاقى، ودايم يخلي وراه شوية رمل. حاول تلمسه ويتزحلق عنك وهو يضحك.",
      },
      groups: { plush: "الرفاق", classic: "الأربعة الأوائل" },
      short: (n) => `مستوى ${n.toLocaleString("ar-SA")}`,
      levels: ["ضيف", "معرفة", "صاحب", "خوي", "رفيق"],
      level: (n) => `المستوى ${n.toLocaleString("ar-SA")}`,
      toNext: (points) => `باقي ${points.toLocaleString("ar-SA")} للمستوى الجاي`,
      maxed: "صار رفيقك صدق.",
      unlocks: {
        greet: "يسلّم عليك إذا جيت",
        purr: "يخرخر ويطلّع قلوب إذا دلّعته",
        trick: "يسوي حركته الخاصة وهو ينتظر",
        star: "يلبس نجمة ذهبية، وكل حفظ يلمع ذهبي",
      },
      how: "سولف، واحفظ أشياء، ودلّعه (مرّر المؤشر أو إصبعك عليه) عشان تقوى علاقتكم.",
      levelUp: (name, level) => `${name} صار ${level}!`,
      open: "رفيقك",
    },
    majlis: {
      start: "افتح مجلس",
      name: (host) => (host ? `مجلس ${host}` : "مجلس"),
      chat: (title) => (title ? `مجلس: ${title}` : "مجلس"),
      invite: "اعزم",
      inviteText: (host) => (host ? `تعال مجلس ${host} في سرجي` : "تعال المجلس في سرجي"),
      linkCopied: "نسخت رابط العزيمة.",
      join: "ادخل",
      joinHint: "كل اللي في المجلس يسمعون سرجي. اللي قلته لسرجي قبل يبقى لك.",
      askName: "وش نناديك؟",
      namePlaceholder: "اسمك",
      you: "أنت",
      guest: (seat) => `ضيف ${(seat + 1).toLocaleString("ar-SA")}`,
      holding: (name) => `المايك مع ${name}`,
      answering: (name) => `سرجي يرد على ${name}`,
      talkTo: "تكلم مع",
      everyone: "الكل",
      sarjy: "سرجي",
      tapToAsk: "اضغط الفنجال واسأل سرجي",
      typeEveryone: "اكتب للكل…",
      busy: (name) => `المايك مع ${name}. لحظة لين يخلص.`,
      tapToTalk: 'اضغط وتكلم مع الكل. ابدأ بـ"سرجي" عشان تسأله.',
      leave: "اطلع",
      end: "سكّر المجلس",
      endConfirm: "تسكّر المجلس على الكل؟",
      ended: "المجلس خلص.",
      full: "المجلس مليان: ٨ أشخاص بالكثير.",
      missing: "ما فيه مجلس بهالرابط.",
      back: "ارجع لسرجي",
      here: (n) => `${n.toLocaleString("ar-SA")} موجودين`,
      reconnecting: "يرجع يتصل",
      people: "مين موجود",
    },
    sharedMoment: "لحظة مع سرجي",
    sharedNote: "شاركها صاحب المحادثة. ما يشوفها إلا اللي عنده الرابط.",
    about: "عن سرجي",
    description: "سرجي مساعد صوتي يتذكر اللي تقوله، ويجاوب من أدوات حقيقية، ويوريك كل شي يحفظه.",
  },
};

export const t = (lang: Lang) => STRINGS[lang];

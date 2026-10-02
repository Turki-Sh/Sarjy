// The home page's words, in English and everyday Saudi Arabic (brand book, sections 5 and 7).
// Sarjy's lines are samples in its own voice: answer first, short, every save confirmed.
// The Rafeeqs' names, traits and stories live with the rest of theirs, in i18n.ts.

import type { Lang } from "./i18n";

export type DayTime = "dawn" | "day" | "dusk" | "night";
export type DayStop = {
  time: string;
  /** The hour, for placing it on the timeline (0 to 24). */
  at: number;
  sky: DayTime;
  /** Where the sun or moon is, 0 to 1 across the sky. */
  arc: number;
  label: string;
  user: string;
  /** Who asked, when it isn't you (a friend in a Majlis). */
  who?: string;
  sarjy: string;
  tool: string;
};

type HomeCopy = {
  nav: {
    promise: string;
    day: string;
    rafeeqs: string;
    majlis: string;
    films: string;
    talk: string;
    otherLang: string;
    dark: string;
    light: string;
  };
  hero: {
    /**
     * A hello from your Rafeeq, by the page's light: a few to pick from at random in the light
     * theme, and night ones in the dark (Turki, Day 4).
     */
    hello: Record<"light" | "dark", readonly ((name: string | null) => string)[]>;
    titleA: string;
    titleB: string;
    lede: string;
    talk: string;
    meet: string;
    scene: string;
  };
  promise: {
    kicker: string;
    title: string;
    you: string;
    sunday: string;
    wednesday: string;
    tellIt: string;
    saved: string;
    ask: string;
    recall: string;
    card: { topic: string; value: string };
  };
  day: {
    kicker: string;
    title: string;
    lede: string;
    stops: readonly DayStop[];
    you: string;
    earlier: string;
    later: string;
    slider: string;
  };
  rafeeqs: {
    kicker: string;
    title: string;
    lede: string;
    ride: (name: string) => string;
    yours: string;
  };
  majlis: {
    kicker: string;
    title: string;
    lede: string;
    points: readonly string[];
    chatter: readonly { seat: number; text: string }[];
    sarjy: string;
    cta: string;
  };
  reins: {
    kicker: string;
    title: string;
    lede: string;
    panel: string;
    items: readonly { topic: string; text: string; forgot: string }[];
    forget: string;
    reset: string;
  };
  finale: {
    title: string;
    lede: string;
    pick: (name: string) => string;
    orb: string;
  };
  films: {
    kicker: string;
    title: string;
    lede: string;
    cta: string;
    /** What the screen in the picture says over the film on it. */
    now: string;
  };
  footer: { tagline: string; made: string; film: string };
  /** The little one that rides along the page with you, one line per section. */
  companion: {
    label: string;
    lines: Record<"promise" | "day" | "rafeeqs" | "majlis" | "reins" | "films", string>;
  };
};

export const HOME: Record<Lang, HomeCopy> = {
  en: {
    nav: {
      promise: "How it works",
      day: "A day with it",
      rafeeqs: "Rafeeqs",
      majlis: "Majlis",
      films: "Films",
      talk: "Talk to Sarjy",
      otherLang: "العربية",
      dark: "Dark",
      light: "Light",
    },
    hero: {
      hello: {
        light: [
          (name) => (name ? `Hey ${name}, good to see you.` : "Hey, good to see you."),
          (name) => (name ? `Welcome back, ${name}.` : "Welcome in."),
          (name) => (name ? `Where to today, ${name}?` : "Where to today?"),
          (name) => (name ? `Ready when you are, ${name}.` : "Ready when you are."),
          (name) => (name ? `Good day for a ride, ${name}.` : "Good day for a ride."),
        ],
        dark: [
          (name) => (name ? `Up late, ${name}?` : "Up late?"),
          (name) => (name ? `Quiet night, ${name}.` : "Quiet night."),
          (name) => (name ? `Still awake, ${name}?` : "Still awake?"),
          (name) => (name ? `The stars are out, ${name}.` : "The stars are out."),
          (name) => (name ? `Night owl, ${name}?` : "Night owl?"),
        ],
      },
      titleA: "Shaped to its",
      titleB: "rider.",
      lede: "Every journey starts with a word. Sarjy remembers the rest, finds what you need, and brings a friend along.",
      talk: "Talk to Sarjy",
      meet: "Meet the Rafeeqs",
      scene: "The Rafeeqs crossing the dunes, one sitting on the headline, one peeking over it.",
    },
    promise: {
      kicker: "The promise",
      title: "Tell it once.",
      you: "You",
      sunday: "Sunday",
      wednesday: "Wednesday",
      tellIt: "My favorite color is green.",
      saved: "Saved. Your favorite color is green.",
      ask: "What's my favorite color?",
      recall: "Green. You told me on Sunday.",
      card: { topic: "Favorite color", value: "green" },
    },
    day: {
      kicker: "A day with Sarjy",
      title: "From first light to lights out.",
      lede: "Weather from a real forecast, answers from the web, and what you asked it to remember. Drag through the day.",
      stops: [
        {
          time: "6:40",
          at: 6.67,
          sky: "dawn",
          arc: 0.12,
          label: "Before the drive",
          user: "What's the weather in Riyadh tomorrow?",
          sarjy: "Clear skies and a high of 41. I kept it in Celsius, like you asked.",
          tool: "weather.forecast · 412 ms",
        },
        {
          time: "12:30",
          at: 12.5,
          sky: "day",
          arc: 0.5,
          label: "Lunch break",
          user: "How long is the drive from Riyadh to AlUla?",
          sarjy: "About 11 hours, around 1,100 kilometers. Want me to remember the trip?",
          tool: "web.search · 780 ms",
        },
        {
          time: "16:10",
          at: 16.17,
          sky: "day",
          arc: 0.78,
          label: "On the way home",
          user: "Remember my sister's birthday is on the 14th.",
          sarjy: "Saved. Your sister's birthday is on the 14th.",
          tool: "memory.save",
        },
        {
          time: "20:30",
          at: 20.5,
          sky: "dusk",
          arc: 0.95,
          label: "In the Majlis",
          who: "Noura",
          user: "Sarjy, what's the weather in AlUla this weekend?",
          sarjy: "Cool nights, around 14. Bring a jacket.",
          tool: "weather.forecast · 388 ms",
        },
        {
          time: "23:10",
          at: 23.17,
          sky: "night",
          arc: 0.4,
          label: "Lights out",
          user: "What did I ask you to remember today?",
          sarjy: "Your sister's birthday, on the 14th. Good night.",
          tool: "memory.recall",
        },
      ],
      you: "You",
      earlier: "Earlier",
      later: "Later",
      slider: "Time of day",
    },
    rafeeqs: {
      kicker: "The Rafeeqs",
      title: "Eight companions. One rides with you.",
      lede: "A Rafeeq makes the road feel a little lighter. Choose one, and it becomes your companion with Sarjy: listening, understanding, and joining you in its own way. The more you travel together, the more familiar it becomes.",
      ride: (name) => `Ride with ${name}`,
      yours: "Rides with you",
    },
    majlis: {
      kicker: "The Majlis",
      title: "Sit together. Call Sarjy in when you want it.",
      lede: "Start a Majlis and send the link. Up to eight friends in one room, each in their own color. Talk to each other directly; say “Sarjy” and it answers the room.",
      points: ["Up to eight people", "Talk to everyone, or to Sarjy", "Sarjy only answers when asked"],
      chatter: [
        { seat: 0, text: "Who's bringing the dates?" },
        { seat: 1, text: "Me. Obviously." },
        { seat: 2, text: "Sarjy, will it rain on Friday?" },
        { seat: -1, text: "Clear and 24 on Friday. Perfect for the trip." },
        { seat: 3, text: "Told you." },
      ],
      sarjy: "Sarjy",
      cta: "Start a Majlis",
    },
    reins: {
      kicker: "You hold the reins",
      title: "Everything it keeps, on screen.",
      lede: "See every sentence Sarjy remembers, change it, or make it forget. It never keeps anything quietly, and it says every save and every forget out loud.",
      panel: "Memory",
      items: [
        { topic: "Home", text: "You live in Riyadh.", forgot: "Forgotten. I no longer know your home city." },
        {
          topic: "Preferences",
          text: "You like your weather in Celsius.",
          forgot: "Forgotten. I'll ask before picking units.",
        },
        {
          topic: "Family",
          text: "Your sister's birthday is on the 14th.",
          forgot: "Forgotten. I no longer know your sister's birthday.",
        },
      ],
      forget: "Forget",
      reset: "Bring them back",
    },
    films: {
      kicker: "Sarjy films",
      title: "Stories from the road.",
      lede: "Short films about Sarjy and the people it rides with. Pull up a cushion; the Rafeeqs saved you a seat.",
      cta: "Watch the films",
      now: "Now showing",
    },
    finale: {
      title: "Who rides with you?",
      lede: "Pick a Rafeeq and start talking. You can change your mind any time in Settings.",
      pick: (name) => `Ride with ${name}`,
      orb: "Talk with Sarjy",
    },
    footer: {
      tagline: "Shaped to its rider.",
      made: "Made by Turki Alshuaibi.",
      film: "Films",
    },
    companion: {
      label: "Talk to Sarjy",
      lines: {
        promise: "I'll remember that.",
        day: "Want to see my day?",
        rafeeqs: "Those are my friends!",
        majlis: "Save me a seat.",
        reins: "Your call. Always.",
        films: "Popcorn's on me.",
      },
    },
  },
  ar: {
    nav: {
      promise: "كيف يشتغل",
      day: "يوم معه",
      rafeeqs: "الرفاق",
      majlis: "المجلس",
      films: "الأفلام",
      talk: "كلّم سرجي",
      otherLang: "English",
      dark: "داكن",
      light: "فاتح",
    },
    hero: {
      hello: {
        light: [
          (name) => (name ? `هلا والله يا ${name}.` : "هلا والله."),
          (name) => (name ? `نورت يا ${name}.` : "نورت."),
          (name) => (name ? `وين وجهتك اليوم يا ${name}؟` : "وين وجهتك اليوم؟"),
          (name) => (name ? `حيّاك يا ${name}، جاهزين.` : "حيّاك، جاهزين."),
          (name) => (name ? `يوم حلو للمشوار يا ${name}.` : "يوم حلو للمشوار."),
        ],
        dark: [
          (name) => (name ? `سهران يا ${name}؟` : "سهران؟"),
          (name) => (name ? `ليلة هادية يا ${name}.` : "ليلة هادية."),
          (name) => (name ? `للحين صاحي يا ${name}؟` : "للحين صاحي؟"),
          (name) => (name ? `النجوم طالعة الليلة يا ${name}.` : "النجوم طالعة الليلة."),
          (name) => (name ? `سهرة حلوة يا ${name}؟` : "سهرة حلوة؟"),
        ],
      },
      titleA: "على مقاس",
      titleB: "فارسه.",
      lede: "كل مشوار يبدأ بكلمة. سرجي يتذكّر الباقي، يجيب لك اللي تحتاجه، ويجيب معه رفيق.",
      talk: "كلّم سرجي",
      meet: "تعرّف على الرفاق",
      scene: "الرفاق يمشون بين الطعوس، واحد قاعد على العنوان وواحد يطل من وراه.",
    },
    promise: {
      kicker: "الوعد",
      title: "قلها مرة وحدة.",
      you: "أنت",
      sunday: "الأحد",
      wednesday: "الأربعاء",
      tellIt: "لوني المفضل أخضر.",
      saved: "حفظت. لونك المفضل أخضر.",
      ask: "وش لوني المفضل؟",
      recall: "أخضر. قلت لي يوم الأحد.",
      card: { topic: "اللون المفضل", value: "أخضر" },
    },
    day: {
      kicker: "يوم مع سرجي",
      title: "من أول الصبح لين آخر الليل.",
      lede: "طقس من توقعات حقيقية، وأجوبة من النت، واللي طلبت منه يتذكره. اسحب وشوف يومك.",
      stops: [
        {
          time: "٦:٤٠",
          at: 6.67,
          sky: "dawn",
          arc: 0.12,
          label: "قبل المشوار",
          user: "كيف الجو بالرياض بكرة؟",
          sarjy: "صحو، والعظمى ٤١. خليتها مئوية مثل ما تبي.",
          tool: "weather.forecast · 412 ms",
        },
        {
          time: "١٢:٣٠",
          at: 12.5,
          sky: "day",
          arc: 0.5,
          label: "وقت الغدا",
          user: "كم ساعة بالسيارة من الرياض للعلا؟",
          sarjy: "تقريبًا ١١ ساعة، حول ١١٠٠ كيلو. تبيني أحفظ الرحلة؟",
          tool: "web.search · 780 ms",
        },
        {
          time: "٤:١٠",
          at: 16.17,
          sky: "day",
          arc: 0.78,
          label: "راجع البيت",
          user: "تذكّر إن عيد ميلاد أختي يوم ١٤.",
          sarjy: "حفظت. عيد ميلاد أختك يوم ١٤.",
          tool: "memory.save",
        },
        {
          time: "٨:٣٠",
          at: 20.5,
          sky: "dusk",
          arc: 0.95,
          label: "بالمجلس",
          who: "نورة",
          user: "سرجي، كيف الجو بالعلا نهاية الأسبوع؟",
          sarjy: "ليلها بارد، حول ١٤. خذوا جاكيت.",
          tool: "weather.forecast · 388 ms",
        },
        {
          time: "١١:١٠",
          at: 23.17,
          sky: "night",
          arc: 0.4,
          label: "قبل النوم",
          user: "وش طلبت منك تتذكر اليوم؟",
          sarjy: "عيد ميلاد أختك، يوم ١٤. تصبح على خير.",
          tool: "memory.recall",
        },
      ],
      you: "أنت",
      earlier: "قبل",
      later: "بعد",
      slider: "وقت اليوم",
    },
    rafeeqs: {
      kicker: "الرفاق",
      title: "ثمانية رفاق. واحد منهم يمشي معك.",
      lede: "الرفيق هو اللي يهوّن الطريق. اختر واحد منهم، ويصير صاحبك مع سرجي: يسمعك، يفهمك، ويرافقك بطريقته. ومع كل مشوار، تكبر بينكم الألفة شوي شوي.",
      ride: (name) => `خذ ${name} معك`,
      yours: "يمشي معك",
    },
    majlis: {
      kicker: "المجلس",
      title: "اجلسوا مع بعض، ونادوا سرجي وقت ما تبون.",
      lede: "افتح مجلس وارسل الرابط. لين ثمانية أشخاص بغرفة وحدة، كل واحد بلونه. تكلموا مع بعض على طول، وإذا قلتوا “سرجي” يرد على الكل.",
      points: ["لين ثمانية أشخاص", "كلّم الكل، أو كلّم سرجي", "سرجي ما يرد إلا إذا ناديتوه"],
      chatter: [
        { seat: 0, text: "مين بيجيب التمر؟" },
        { seat: 1, text: "أنا. أكيد." },
        { seat: 2, text: "سرجي، بتمطر يوم الجمعة؟" },
        { seat: -1, text: "صحو و٢٤ يوم الجمعة. مثالي للطلعة." },
        { seat: 3, text: "قلت لكم." },
      ],
      sarjy: "سرجي",
      cta: "افتح مجلس",
    },
    reins: {
      kicker: "الزمام بيدك",
      title: "كل شي يحفظه، قدامك.",
      lede: "تشوف كل جملة يتذكرها سرجي، تعدلها، أو تخليه ينساها. ما يحفظ شي من وراك، ويقول لك بصوت كل شي يحفظه أو ينساه.",
      panel: "الذاكرة",
      items: [
        { topic: "البيت", text: "ساكن بالرياض.", forgot: "نسيتها. ما عاد أعرف مدينتك." },
        { topic: "تفضيلات", text: "تحب الطقس بالمئوي.", forgot: "نسيتها. بسألك قبل ما أختار الوحدة." },
        { topic: "العايلة", text: "عيد ميلاد أختك يوم ١٤.", forgot: "نسيتها. ما عاد أعرف عيد ميلاد أختك." },
      ],
      forget: "انسَ",
      reset: "رجّعها",
    },
    films: {
      kicker: "أفلام سرجي",
      title: "حكايات من الدرب.",
      lede: "أفلام قصيرة عن سرجي واللي يمشي معهم. خذ لك مخدة، الرفقاء حاجزين لك مكان.",
      cta: "شوف الأفلام",
      now: "يُعرض الحين",
    },
    finale: {
      title: "مين يمشي معك؟",
      lede: "اختر رفيقك وابدأ السوالف. تقدر تغيّره وقت ما تبي من الإعدادات.",
      pick: (name) => `خذ ${name} معك`,
      orb: "كلّم سرجي",
    },
    footer: {
      tagline: "على مقاس فارسه.",
      made: "من تطوير تركي الشعيبي.",
      film: "الأفلام",
    },
    companion: {
      label: "كلّم سرجي",
      lines: {
        promise: "بحفظها لك.",
        day: "تبي تشوف يومي؟",
        rafeeqs: "هذولا ربعي!",
        majlis: "خلوا لي مكان.",
        reins: "القرار لك. دايم.",
        films: "الفشار علي.",
      },
    },
  },
};

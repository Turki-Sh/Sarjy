// The film pages' own words (Day 5). Each film's title and description live with it, in films.ts.

import type { Lang } from "./i18n";

type FilmCopy = {
  /** /film, the films as a whole, as link previews and the tab show it. */
  index: { title: string; body: string };
  kicker: string;
  talk: string;
  more: string;
  /** The version choice, and each language named in itself (so a reader of either finds theirs). */
  watchIn: string;
  langName: Record<Lang, string>;
  /** What a version is in, said in the page's language: "In Arabic, with English subtitles". */
  spoken: (lang: Lang, subtitles?: Lang) => string;
  runs: (time: string) => string;
  play: (title: string) => string;
  previous: string;
  next: string;
  share: string;
  copied: string;
  /** The easter eggs: Drifter after the credits, and the popcorn (type "popcorn"). */
  missed: string;
  again: string;
  popcorn: string;
};

const IN_EN: Record<Lang, string> = { en: "English", ar: "Arabic" };
const IN_AR: Record<Lang, string> = { en: "بالإنجليزي", ar: "بالعربي" };
const SUBS_AR: Record<Lang, string> = { en: "ترجمة إنجليزية", ar: "ترجمة عربية" };

export const FILM: Record<Lang, FilmCopy> = {
  en: {
    index: { title: "Sarjy films", body: "Short films about Sarjy and the people it rides with." },
    kicker: "Sarjy films",
    talk: "Talk to Sarjy",
    more: "More films",
    watchIn: "Watch in",
    langName: { en: "English", ar: "العربية" },
    spoken: (lang, subtitles) =>
      subtitles ? `In ${IN_EN[lang]}, with ${IN_EN[subtitles]} subtitles` : `In ${IN_EN[lang]}`,
    runs: (time) => `${time} long`,
    play: (title) => `Play ${title}`,
    previous: "Previous films",
    next: "Next films",
    share: "Share",
    copied: "Link copied",
    missed: "Did I miss it?",
    again: "Watch it again",
    popcorn: "Popcorn's on Keeper.",
  },
  ar: {
    index: { title: "أفلام سرجي", body: "أفلام قصيرة عن سرجي واللي يمشي معهم." },
    kicker: "أفلام سرجي",
    talk: "كلّم سرجي",
    more: "أفلام ثانية",
    watchIn: "شوفه",
    langName: { en: "English", ar: "العربية" },
    spoken: (lang, subtitles) => (subtitles ? `${IN_AR[lang]}، مع ${SUBS_AR[subtitles]}` : IN_AR[lang]),
    runs: (time) => `مدته ${time}`,
    play: (title) => `شغّل ${title}`,
    previous: "الأفلام اللي قبل",
    next: "الأفلام اللي بعد",
    share: "شارك",
    copied: "نسخت الرابط",
    missed: "خلص؟ ما شفت شي.",
    again: "شوفه مرة ثانية",
    popcorn: "الفشار على حساب حافظ.",
  },
};

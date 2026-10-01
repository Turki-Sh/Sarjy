// The film pages' own words (Day 5). Each film's title and description live with it, in films.ts.

import type { Lang } from "./i18n";

export const FILM: Record<Lang, { talk: string; home: string; more: string; spoken: Record<Lang, string> }> =
  {
    en: {
      talk: "Talk to Sarjy",
      home: "Home",
      more: "More films",
      spoken: { en: "In English", ar: "In Arabic" },
    },
    ar: {
      talk: "كلّم سرجي",
      home: "الرئيسية",
      more: "أفلام ثانية",
      spoken: { en: "بالإنجليزي", ar: "بالعربي" },
    },
  };

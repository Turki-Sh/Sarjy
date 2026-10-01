// The 404's words, in English and everyday Saudi Arabic. The Rafeeqs are lost in the dunes, and
// each says what it would say, in its own voice (shared/rafeeq.ts, PERSONALITIES).

import type { Lang } from "./i18n";
import type { RafeeqId } from "./rafeeq";

type LostCopy = {
  title: string;
  body: string;
  home: string;
  talk: string;
  /** The moon's label (it changes the scene). */
  shuffle: string;
  scene: string;
  /** What each one says while lost, in character. */
  lines: Record<RafeeqId, readonly string[]>;
  /** Two of them squabbling over the map, then making up. */
  squabble: { fight: readonly string[]; sulk: readonly string[]; makeUp: readonly string[] };
};

export const LOST: Record<Lang, LostCopy> = {
  en: {
    title: "We're lost.",
    body: "This page wandered off into the dunes. The Rafeeqs are out looking for it, but between us, they're not great with maps.",
    home: "Take me home",
    talk: "Talk to Sarjy",
    shuffle: "Ask someone else for directions",
    scene: "Night in the dunes. A few Rafeeqs sit around a campfire, lost.",
    lines: {
      rider: [
        "We ride at dawn. Which way is dawn?",
        "Stay close. I've got you.",
        "Every well has a name. Not this one.",
      ],
      keeper: [
        "I kept the map. I just can't find where.",
        "Is everyone warm enough?",
        "I packed extra dates, just in case.",
      ],
      scout: ["I'll climb up and look!", "I see... more sand.", "Wait, what's over there?"],
      drifter: ["Lost? I'm just resting.", "Wake me when we're found.", "zzz"],
      dune: ["I'm never wrong. The map is.", "I know this dune. It's me.", "Follow me! Probably."],
      lantern: [
        "Stay close to the light.",
        "The stars will show us the way.",
        "Not everyone who wanders is lost.",
      ],
      fennec: ["I said left.", "Don't look at me.", "Fine. We're lost. Happy?"],
      breeze: ["Wheee, lost again!", "Race you to the next dune!", "Found it! No wait, that's a rock."],
    },
    squabble: {
      fight: ["My turn with the map!", "No, mine!", "Let go!"],
      sulk: ["Hmph.", "Look what you did."],
      makeUp: ["...Sorry.", "Me too. Half each?"],
    },
  },
  ar: {
    title: "ضعنا.",
    body: "هالصفحة شردت بين الطعوس. الرفاق طالعين يدورونها، بس بيني وبينك، ما لهم بالخرايط.",
    home: "رجعني للرئيسية",
    talk: "كلّم سرجي",
    shuffle: "اسأل أحد ثاني عن الطريق",
    scene: "ليل بين الطعوس، وكم رفيق قاعدين حول النار، ضايعين.",
    lines: {
      rider: ["نمشي مع الفجر. بس وين الفجر؟", "خلكم قريبين، أنا معكم.", "كل بير له اسم، إلا هذا."],
      keeper: ["الخريطة معي، بس نسيت وين حطيتها.", "دفيانين كلكم؟", "جبت تمر زيادة، احتياط."],
      scout: ["بطلع فوق وأشوف!", "أشوف... رمل زيادة.", "لحظة، وش ذاك هناك؟"],
      drifter: ["ضايعين؟ لا، أنا بس مرتاح.", "صحوني إذا لقونا.", "ززز"],
      dune: ["أنا ما أغلط. الخريطة هي الغلطانة.", "أعرف هالطعس. هذا أنا.", "امشوا ورايا! غالبًا صح."],
      lantern: ["خلكم جنب النور.", "النجوم بتدلنا.", "مو كل من مشى ضايع."],
      fennec: ["قلت لكم يسار.", "لا تطالعون فيني.", "طيب ضعنا. ارتحتوا؟"],
      breeze: ["يي، ضعنا مرة ثانية!", "نتسابق للطعس الجاي!", "لقيتها! لا لحظة، هذي صخرة."],
    },
    squabble: {
      fight: ["دوري أمسك الخريطة!", "لا، دوري أنا!", "فكّها!"],
      sulk: ["همف.", "شف وش سويت."],
      makeUp: ["...آسف.", "وأنا بعد. نص نص؟"],
    },
  },
};

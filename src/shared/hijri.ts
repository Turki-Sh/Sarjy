// The Hijri date (Umm al-Qura calendar, the one used in Saudi Arabia) and the time of day,
// from the runtime's own calendar data. No API needed; works the same in the browser and on the server.

export type DayPart = "morning" | "afternoon" | "evening" | "night";

/** e.g. "7 Rabiʻ II 1448 AH" or "٧ ربيع الآخر ١٤٤٨ هـ". */
export function hijriDate(date: Date, lang: "en" | "ar", timeZone = "Asia/Riyadh"): string {
  return new Intl.DateTimeFormat(`${lang === "ar" ? "ar-SA" : "en"}-u-ca-islamic-umalqura`, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

/** The Gregorian date and weekday in the user's own words, e.g. "Tuesday, 29 September 2026". */
export function gregorianDate(date: Date, lang: "en" | "ar", timeZone = "Asia/Riyadh"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-SA-u-ca-gregory" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function localTime(date: Date, timeZone = "Asia/Riyadh"): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(date);
}

export function dayPart(date: Date, timeZone = "Asia/Riyadh"): DayPart {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone }).format(date),
  );
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

/** A safe IANA time zone: the browser's if valid, otherwise Riyadh. */
export function safeTimeZone(tz: string | null | undefined): string {
  if (!tz) return "Asia/Riyadh";
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "Asia/Riyadh";
  }
}

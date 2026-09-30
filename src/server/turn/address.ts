// In a Majlis, people talk to each other; Sarjy answers only when asked (Turki, Day 3). A turn is
// for Sarjy when the switch under the finjan says so, or when it starts with Sarjy's name, the way
// you'd turn to someone in a room: "Sarjy, what's the weather?", "يا سرجي وش الجو؟".

/**
 * Sarjy's name as speech to text writes it at the start of a sentence: English and Arabic
 * spellings, and the names Whisper mistakes it for ("Sergey", "Surgy").
 */
const NAME =
  /^[\s"'«“]*(?:hey|hi|ok|okay|يا|هلا)?[\s,،]*(?:sarjy|sarji|sarjee|sergey|sergei|serji|surgy|سرجي|سيرجي|سرجى)(?![a-z\u0621-\u064a])/i;

/** Whether this turn asks Sarjy, by name, at its start. */
export const addressesSarjy = (text: string): boolean => NAME.test(text.trim());

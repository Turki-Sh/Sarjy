# 01 · Product requirements

What we are building, for whom, and how we will know it is good. Read this first. The architecture ([02](02-ARCHITECTURE.md)) explains how; this file explains what and why.

| | |
|---|---|
| Product | Sarjy, a bilingual voice assistant with visible memory |
| Owner | Turki ([@Turki-Sh](https://github.com/Turki-Sh)) |
| Status | Planned, 29 Sep 2026 |
| Deep dive | UI/UX and multimodal, in English and Saudi Arabic |
| Design source of truth | [`docs/brand/`](brand/) (brand book and visual identity, v3) |

---

## 1. The idea in one paragraph

Sarj is Arabic for saddle; Sarjy means "my saddle". A saddle is fitted to one rider and breaks in to them over time. Sarjy is a voice assistant built on that idea: you talk to it, it talks back, it remembers your facts and preferences across sessions so you only say things once, it answers questions about the world from real tools instead of guessing, and everything it keeps about you is on screen, where you can change it or make it forget.

**The promise: tell it once.**

> **You, Sunday:** My favorite color is green.
> **Sarjy:** *Saved. Your favorite color is green.*
> **You, Wednesday:** What's my favorite color?
> **Sarjy:** *Green. You told me on Sunday.*

## 2. Who it is for

| User | What they need |
|---|---|
| **The reviewer** (primary for this project) | Opens one URL on a laptop, maybe with no mic, maybe in a noisy room. Needs to talk to Sarjy within seconds, see memory work across a reload, see a real tool answer, and be impressed. May try Arabic. May try to break it. |
| **The rider** (the product persona) | A bilingual person in Saudi Arabia who switches between English and Arabic, cares about the weather because it shapes the day, and wants an assistant that learns them without being creepy. |

## 3. Requirements from the brief

| ID | Requirement (restated) | How Sarjy meets it |
|---|---|---|
| R1 | Listens and responds by voice | Mic in the browser, automatic end-of-speech detection, Groq Whisper for speech-to-text, Groq Orpheus for the voice (English and Saudi Arabic). |
| R2 | Remembers facts and preferences across sessions | Memories stored in Postgres per user, loaded into every turn, visible as stitched cards you can edit and forget. |
| R3 | Calls at least one external API, justified | Weather through Open-Meteo, using the remembered home city and units. Justification in section 7. |
| R4 | Deployed URL, no special setup | Vercel production URL. No login: a signed cookie identifies the browser. Text input works without a mic. |
| D1 | Deep dive: UI/UX and multimodal | The orb driven by real audio, captions that sharpen word by word as Sarjy speaks, tool chips with timings, the memory stitch, sound cues, dark mode, and full Arabic with a mirrored layout. |
| C1 | Communication: plan first, give updates | These docs are the PRD and TDD. Daily progress notes to Sarj. |

## 4. What we hold to

These three commitments come from the brand book. Every feature below must keep all three. They are also product requirements we test ([04](04-ACCEPTANCE-TESTS.md)).

| Commitment | In the product |
|---|---|
| **It's yours** | Memory is per person and persists. Sarjy uses what it knows without being asked, and says when an answer came from memory ("You told me on Sunday"). |
| **You hold the reins** | Every memory is visible, editable and deletable. Sarjy never stores anything quietly: every save and every forget is confirmed out loud, with a sound, and appears on screen with the stitch. |
| **It doesn't guess** | Facts about the world come from tools; facts about you come from memory. When neither has the answer, Sarjy says so. It only speaks numbers that came back from a tool. |

## 5. Features

Priorities use MoSCoW: **Must** ships or the submission fails. **Should** is what makes it stand out; planned for, cut last. **Could** only if time remains.

### Voice

| ID | Feature | Priority |
|---|---|---|
| V1 | Tap the mic, speak, and Sarjy detects the end of speech on its own (no second tap) | Must |
| V2 | Sarjy answers by voice with captions | Must |
| V3 | Replies in the language you spoke: English voice for English, a native Saudi voice for Arabic | Must |
| V4 | Text input as a fallback when there is no mic or the room is noisy | Must |
| V5 | Your words stream in live while you speak (browser speech preview, final text from Whisper) | Should |
| V6 | Interrupt Sarjy by speaking over it (barge-in) | Should |
| V7 | Hands-free mode: after Sarjy answers, it listens again without a tap | Could |

### Memory

| ID | Feature | Priority |
|---|---|---|
| M1 | Save a fact or preference by saying it; confirmed out loud in your words | Must |
| M2 | Recall it in a later session, with a short pointer to when you said it | Must |
| M3 | Update ("actually it's blue") and forget ("forget my home city") by voice | Must |
| M4 | Memory list on screen, each item stitched, with Edit and Forget | Must |
| M5 | Asks instead of guessing when it does not know something about you | Must |
| M6 | Refuses to store secrets (passwords, card numbers, ID numbers) and says why | Should |
| M7 | Memory works across languages (saved in Arabic, recalled in English) | Should |
| M8 | Onboarding: on first visit Sarjy introduces itself and asks your name, which becomes the first memory | Should |
| M9 | "Forget everything" in settings | Should |

### Tools

| ID | Feature | Priority |
|---|---|---|
| T1 | Current weather and forecast for any city, today to 7 days out | Must |
| T2 | Uses your remembered home city and units when you do not say them | Must |
| T3 | Tool chip shows which tool answered and how long it took | Must |
| T4 | Owns failures plainly: "I couldn't reach the weather service. Want me to try again?" | Must |
| T5 | Prayer times for Saudi cities (Umm al-Qura method), a second local tool | Could |

### Interface (the deep dive)

| ID | Feature | Priority |
|---|---|---|
| U1 | The orb: a glass sphere holding the logo wave; six states (idle, listening, thinking, checking a tool, speaking, saving) | Must |
| U2 | The wave follows your mic level while listening and Sarjy's audio while speaking | Must |
| U3 | Captions: words Sarjy has not said yet are blurred and come into focus as they are spoken | Must |
| U4 | The stitch: a saved fact gets a Dusk stitched underline, and its card appears in the memory list | Must |
| U5 | Light by default, dark as an option, remembered per browser | Must |
| U6 | Full Arabic interface: layout mirrors, Arabic fonts, Sarjy's Arabic words in Noto Naskh | Must |
| U7 | Sound cues: listening starts, listening ends, saved | Should |
| U8 | Recent chats in the sidebar; start a new chat | Should |
| U9 | Per-turn details: a latency waterfall (speech-to-text, model, tool, voice, time to first audio) | Should |
| U10 | Responsive: below 900 px the sidebar becomes a sheet | Should |
| U11 | Reduced motion and reduced transparency respected | Should |

## 6. Out of scope

Accounts and cross-device sync, native apps, telephony, multiple participants, vector search over memories, voice cloning, any feature not in the tables above.

## 7. Why weather (the API justification)

> Weather is the question people ask a voice assistant most, and in Saudi Arabia it genuinely shapes the day: 45 degree afternoons, dust storms and the rare heavy rain decide when you go out. It is also the clearest way to show memory and tools working together, because once Sarjy knows your home city and your units, "how's tomorrow?" needs no other words. We use Open-Meteo because it is free, needs no key, covers every city, and returns structured numbers that Sarjy can quote without guessing.

## 8. How Sarjy speaks

The brand book's speaking rules become the system prompt. In short: answer first; one or two sentences, around 25 words; say numbers the way people say them; confirm every save in the user's words; say when memory was used; ask when you don't know; own tool failures plainly; reply in the user's language, in everyday Saudi Arabic; never claim to be a person; no emoji.

## 9. Success metrics

| Metric | Target | How we measure |
|---|---|---|
| Memory recall across a reload | 100% of acceptance script | Acceptance tests AT-11 to AT-17 |
| Invented numbers in tool answers | 0 | AT-20, AT-22, plus a numeric grounding check in tests |
| Time to first audio, no tool | p50 under 2.0 s | Per-turn timings, logged and shown in the details panel |
| Time to first audio, with weather | p50 under 3.0 s | Same |
| First words from a cold visit | Under 10 s from opening the URL | Manual, fresh incognito window |
| Accessibility | Lighthouse 95 or above; every state announced | Lighthouse, screen reader pass |
| Browsers | Chrome, Safari, Firefox (voice); any browser (text) | Manual matrix |

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Groq free tier limits (voice about 100 requests a day; model tokens per day) | Sarjy goes silent during review | At most 2 voice requests per answer; cache repeated phrases; fall back to the browser voice with captions intact; fall back to a second model; upgrade the key if we see pressure |
| Arabic speech recognition errors on short utterances | Wrong language or wrong words | Pass the UI language as a hint; Whisper prompt seeded with names from memory; the user sees and can correct text |
| Echo: Sarjy hears itself and interrupts itself | Broken barge-in | Browser echo cancellation; raise the speech threshold while Sarjy speaks; barge-in is a Should, so it can be switched off |
| Caption timing drift (Orpheus returns audio without word times) | Blur reveal looks off | Estimate timings from the audio envelope, per sentence, so drift cannot accumulate |
| Reviewer has no mic or denies permission | Cannot use voice | Text input is a Must; the mic shows the dashed "no access" state |
| Container used for development cannot reach Groq or Open-Meteo | Cannot test live APIs here | Fake providers for all tests; live checks on Vercel preview deployments |

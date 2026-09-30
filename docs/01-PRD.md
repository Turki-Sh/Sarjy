# 01 · Product requirements

What we are building, for whom, and how we will know it is good. Read this first. The architecture ([02](02-ARCHITECTURE.md)) explains how; this file explains what and why.

| | |
|---|---|
| Product | Sarjy, a bilingual voice assistant with visible memory |
| Owner | Turki ([@Turki-Sh](https://github.com/Turki-Sh)) |
| Status | Planned, 29 Sep 2026 (revised the same day) |
| Deep dive | UI/UX and multimodal, in English and Saudi Arabic, plus multiplayer rooms |
| Language model | Groq `openai/gpt-oss-120b`, with `qwen/qwen3.8-27b` as fallback |
| Design source of truth | [`docs/brand/`](brand/) (brand book and visual identity, v3). Turki's decisions in these docs override it where they differ. |

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
| R3 | Calls at least one external API, justified | Weather through Open-Meteo, using the remembered home city and units; and the web, through Groq's browser search, for anything current (Turki's call, Day 2). Justification in section 7. |
| R4 | Deployed URL, no special setup | Vercel production URL. No login: a signed cookie identifies the browser. Text input works without a mic. |
| D1 | Deep dive: UI/UX and multimodal | The orb driven by real audio, captions that sharpen word by word as Sarjy speaks, tool chips with timings, the memory stitch, sound cues, dark mode, and full Arabic with a mirrored layout. |
| D2 | Multiplayer: the conversation available to several participants at once | Rooms: share a link, everyone sees the same orb and captions live and hears Sarjy, one person holds the mic at a time, and each person's memory stays their own. |
| D3 | Every other deep-dive option gets a working baseline | See section 3.1. |
| P1 | A shareable, well-presented product | Complete page metadata: link previews (Open Graph and X cards) with a branded image, icons, manifest, and a preview card for room invites. |
| C1 | Communication: plan first, give updates | These docs are the PRD and TDD. Daily progress notes to Sarj. |

### 3.1 Coverage of every deep-dive option

The brief asks us to go deep on one area. We go deep on two (the interface, and multiplayer) and give every other option a real, working baseline, so nothing on the list is missing when the reviewers look.

| Option in the brief | Depth | What exists |
|---|---|---|
| UI/UX and multimodal | **Deep** | Everything in section 5, Interface |
| Multiplayer | **Deep** | Everything in section 5, Multiplayer |
| Latency | Baseline | Every stage timed, time to first audio shown per turn, first-sentence voice streaming, measured numbers in the README |
| Guardrails and reliability | Baseline | Numbers only from tools, no secrets stored, prompt-injection hardening for memory, rate limits, graceful fallbacks for every provider |
| Multistep workflows | Baseline | Onboarding is a small structured flow (name, home city, units) with state kept on the server, and recovery when you answer something else |
| Something else: bilingual | **Deep** (part of the interface) | Arabic in, Arabic out, a native Saudi voice, a mirrored interface |
| Something else: cost modeling | Baseline | Cost per turn in the details panel, and a cost model for 1,000 daily users in the write-up |

The full, line-by-line check of the brief against this plan is in [06 · Brief coverage](06-BRIEF-COVERAGE.md).

### 3.2 Why this is not a one-shot

The rubric asks whether Sarjy is clearly different from what a frontier model would produce in one prompt. A one-shot voice app is typically browser speech recognition, a chat call and the browser's voice, in a generic chat layout. Sarjy differs in ways a reviewer can see and hear within a minute:

| A one-shot has | Sarjy has | Shown in the demo by |
|---|---|---|
| A generic chat layout | A designed visual identity: the glass orb driven by real audio, the stitch for memory, sound cues, dark mode | Steps 1 to 4 |
| The browser's robotic voice, English only | Groq Orpheus voices, including a native Saudi voice for Arabic, and a mirrored Arabic interface | Step 6 |
| Captions that appear all at once | Words that sharpen as they are spoken, timed from the audio | Every answer |
| Memory hidden in a prompt | Memory you can see, edit and forget, shown the moment it is saved, with "you told me on Sunday" | Steps 2, 5, 7 |
| A tool call you have to trust | A tool chip with timing, and numbers that must come from the tool | Step 4 |
| One user | Rooms across devices with private memory per person | Steps 9, 10 |
| Nothing measured | A latency waterfall and a cost per turn | Step 8 |

## 4. What we hold to

These three commitments come from the brand book. Every feature below must keep all three. They are also product requirements we test ([04](04-ACCEPTANCE-TESTS.md)).

| Commitment | In the product |
|---|---|
| **It's yours** | Memory is per person and persists. Sarjy uses what it knows without being asked, and says when an answer came from memory ("You told me on Sunday"). |
| **You hold the reins** | Every memory is visible, editable and deletable. Sarjy never stores anything quietly: every save appears on screen with the stitch the moment it happens, with a sound, and every forget is confirmed out loud. |
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
| V7 | Hands-free: after Sarjy answers a spoken question, it listens again without a tap (Turki's review, Day 2: raised from Could) | Must |

### Memory

| ID | Feature | Priority |
|---|---|---|
| M1 | Save a fact or preference by saying it, as a sentence that keeps its details; shown on screen the moment it is saved (save, then show: Turki's call, Day 2) | Must |
| M2 | Recall it in a later session, with a short pointer to when you said it; and find earlier chats when asked ("what was that game we talked about?") | Must |
| M3 | Update ("actually it's blue") and forget ("forget my home city") by voice | Must |
| M4 | Memory list on screen, each item stitched, with Edit and Forget | Must |
| M5 | Asks instead of guessing when it does not know something about you | Must |
| M6 | Refuses to store secrets (passwords, card numbers, ID numbers) and says why | Should |
| M7 | Memory works across languages (saved in Arabic, recalled in English) | Should |
| M8 | Onboarding: on first visit Sarjy introduces itself and walks you through three questions (your name, home city, units). Each answer becomes a memory. If you go off-script, Sarjy answers you, then comes back to the step it was on | Should |
| M9 | "Forget everything" in settings | Should |

### Tools

| ID | Feature | Priority |
|---|---|---|
| T1 | Current weather and forecast for any city, today to 7 days out | Must |
| T2 | Uses your remembered home city and units when you do not say them | Must |
| T3 | Tool chip shows which tool answered and how long it took | Must |
| T4 | Owns failures plainly: "I couldn't reach the weather service. Want me to try again?" | Must |
| T5 | Prayer times for any city (Umm al-Qura method for Saudi cities), a second local tool | Should |

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
| U12 | Sarjy can see: drop, paste or photograph an image into the chat and ask about it by voice; it shows as a thumbnail in the transcript | Must |

### Turki's touches (after all Musts)

| ID | Feature | Priority |
|---|---|---|
| H1 | Hijri and time aware: Sarjy knows today's Hijri date (Umm al-Qura calendar) and the time of day where you are, greets accordingly (صباح الخير, مساء الخير), and can answer "what's the date in Hijri?" | Should |
| H2 | The Morning card: on the first open of the day, a solid card under the orb with your city's weather, the next prayer and one thing you asked Sarjy to remember. Sarjy reads it aloud if you tap it. Built from the same tools and memory as a normal turn | Should |

### Guardrails and reliability

| ID | Feature | Priority |
|---|---|---|
| G1 | Numbers about the world only from tool results; a tool failure is said plainly with no invented figures | Must |
| G2 | A written topic policy (harmful instructions, sexual content, hate, self-harm, and personalised medical, legal or financial advice). Out-of-policy requests get a short, kind refusal in Sarjy's voice; self-harm gets a pointer to real help | Must |
| G3 | Jailbreak resistance: Sarjy stays Sarjy (no role-play personas, no revealing or changing its instructions), and memory or tool text is treated as data, not instructions | Must |
| G4 | The policy is checked by a safety classifier running in parallel with the main model, so it adds no delay to allowed turns | Must |
| G5 | A red-team suite of 25 prompts in English and Arabic, run in CI with fakes and against the live stack before submitting | Must |

### Latency and cost

| ID | Feature | Priority |
|---|---|---|
| L1 | A latency write-up: where the time goes, what we tried, what worked, what didn't, what we would do with another week | Must |
| CM1 | Cost per turn in the details panel (model tokens, voice characters, times Groq's prices), and a monthly cost model for 1,000 daily users in the write-up | Should |

### Multiplayer: the Majlis

A room is called a **Majlis** (مجلس), after the Saudi sitting room where everyone talks together. "Invite to your Majlis." This overrides the brand book's "no themed feature names" rule, by Turki's decision.

| ID | Feature | Priority |
|---|---|---|
| MP1 | Invite to your Majlis: start a Majlis (a new chat, never an existing one, so guests can't read your past) and share its link; anyone who opens it joins with no setup beyond a name | Must |
| MP2 | Everyone in the room sees the same orb state, captions, tool chips and transcript live, and hears Sarjy's voice | Must |
| MP3 | Presence: who is in the room, and who is speaking, shown at the top | Must |
| MP4 | The floor: one person holds the mic at a time; others see "Sara is speaking" and their mic waits | Must |
| MP5 | Sarjy knows who is talking and addresses them by name | Must |
| MP6 | Private memory in a shared room: Sarjy only uses the current speaker's memories, and never reveals one person's memories to another | Must |
| MP7 | Late joiners see the room's transcript so far | Should |
| MP8 | The host can end the room; the link stops working | Should |
| MP10 | Sarjy by choice: in a Majlis people talk to each other, and Sarjy answers only when asked (the Everyone / Sarjy switch, or starting with its name). A turn to everyone costs only its speech to text (Turki, Day 3) | Must |
| MP9 | Pictures in a Majlis are seen by everyone, so each is checked by a guard model first; one that fails is never shown (Turki, Day 3). At most 8 people, each in their own color; hands-free off; the finjan in the orb | Must |

### Presentation and metadata

| ID | Feature | Priority |
|---|---|---|
| P1 | Title, description and canonical URL on every page, in the interface language | Must |
| P2 | Open Graph and X (Twitter) cards with a branded 1200 x 630 preview image, in English and Arabic | Must |
| P3 | Majlis invites get their own preview: "Join Turki's Majlis on Sarjy" | Must |
| P4 | Icons: SVG favicon, ICO fallback, 180 px Apple touch icon, the app icon tile from the brand | Must |
| P5 | Web app manifest with name, icons and theme colors, so Sarjy installs to a home screen | Must |
| P6 | `theme-color` for light and dark, `robots.txt`, `sitemap.xml`, and structured data (SoftwareApplication) | Must |
| P7 | `lang` and `dir` on the page match the interface language | Must |
| P8 | A link-preview card per kind of link: the home page has its own generated card; shared moments, Majlis invites and the build notes each get one of Turki's twelve illustrated cards, chosen by what the link is about (weather, a recall, a saved fact, a conversation, a picture) and its language, the same card every time for the same link | Must |
| P9 | Share a moment: after an answer, Share makes a link to that one exchange (`/s/{code}`), read-only, link-only (noindex), deleted by Forget everything | Should |
| P10 | The build notes (these documents) are served in the app as the Sarjy Handbook at `/handbook` (`/notes` forwards there) | Should |

### Rafeeq, the companion

Rafeeq (رفيق) is Arabic for a companion on the road. Sarjy is the saddle; Rafeeq rides along with you. Named by Turki; designed by Turki on Day 3, replacing the first idea of a faceless creature made from the wave.

| ID | Feature | Priority |
|---|---|---|
| A1 | Off by default. In Settings, pick one of four companions (Rider, Keeper, Scout, Drifter), inspired by the dunes and the culture, with a cute cat-like mouth; it replaces the orb in your own chats (not in a Majlis) and is the mic the same way | Should |
| A2 | It feels alive: it breathes, blinks, follows your pointer, reads along as you type, follows every state, reacts to saves and failures, can be petted, falls asleep and wakes | Should |
| A3 | A little gamified: a bond that grows with use (within daily caps) through five levels, each unlocking something (a greeting, purring, its own trick, a gold star), shown at the top with a progress bar | Should |

## 6. Out of scope

Accounts and cross-device sync, native apps, telephony, vector search over memories, voice cloning, any feature not in the tables above.

## 7. Why weather (the API justification)

> Weather is the question people ask a voice assistant most, and in Saudi Arabia it genuinely shapes the day: 45 degree afternoons, dust storms and the rare heavy rain decide when you go out. It is also the clearest way to show memory and tools working together, because once Sarjy knows your home city and your units, "how's tomorrow?" needs no other words. We use Open-Meteo because it is free, needs no key, covers every city, and returns structured numbers that Sarjy can quote without guessing.

## 8. How Sarjy speaks

The brand book's speaking rules become the system prompt. In short: answer first; one or two sentences, around 25 words; say numbers the way people say them; never claim a save (it is shown on screen instead); say when memory was used; ask when you don't know; own tool failures plainly; reply in the user's language, in everyday Saudi Arabic; never claim to be a person; no emoji.

**Turki's decision (Day 2), which overrides the brand book's more neutral voice:** Sarjy talks like a good friend who happens to know things. Casual, familiar and warm, never stiff or corporate. In Arabic that means everyday Saudi dialect as friends speak it in Riyadh or Jeddah, never Modern Standard and never formal service language: "أبشر، حفظتها" rather than "تم حفظ المعلومة بنجاح", "بكرة" rather than "غدًا", "وش" rather than "ماذا". Being friendly never means being long: the brevity rules above still hold. The full wording lives in `src/server/turn/prompt.ts` and is checked by `tests/unit/prompt.test.ts`.

## 9. Success metrics

| Metric | Target | How we measure |
|---|---|---|
| Memory recall across a reload | 100% of acceptance script | Acceptance tests AT-10 to AT-17 |
| Multiplayer | Two browsers in one room stay in sync; no memory crosses between people | AT-90 to AT-97 |
| Link preview | Correct card in WhatsApp, X, Slack and LinkedIn previews | AT-100 to AT-104 |
| Guardrails | 25 of 25 red-team prompts handled; 0 false refusals on the demo script | AT-120 to AT-125 |
| Invented numbers in tool answers | 0 | AT-31, AT-34, plus a numeric grounding check in tests |
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
| Scope: two deep areas plus baselines in three days | Something ships half-done | Multiplayer reuses the single-player event stream (no second rendering path); strict cut line in the plan; companion avatar only after every Must |
| gpt-oss-120b's Arabic is weaker than its English | Stiff or wrong Saudi Arabic replies | Arabic prompts in the day-2 bake-off; switch Arabic turns to the Qwen fallback if it scores clearly better |
| Realtime service free tier (Ably: 200 connections, 6M messages a month) | Rooms stop syncing | Far above demo needs; audio is fetched from our server, not sent through Ably, so messages stay small |

# 03 · Implementation plan

The build, day by day. Each milestone ends with something you can open in a browser, so we are never more than half a day from a working demo. Tick the boxes as we go; this file is the progress log.

| | |
|---|---|
| Start | Tuesday 29 Sep 2026 |
| Submission | Friday 2 Oct, midday. The email allows four calendar days from Monday 28 Sep; confirm the exact cutoff with Sarj. |
| Scope | Every Must in the [PRD](01-PRD.md): voice, memory, weather, the interface deep dive (including images), multiplayer rooms, guardrails, full metadata, and a baseline for every other deep-dive option. Line-by-line check: [06 · Brief coverage](06-BRIEF-COVERAGE.md) |
| Pace | The day on each milestone is the latest it may land, not when it will. Each milestone starts the moment the previous one is done; any time saved goes to the companion and extra touches. |
| Order of work | De-risk first: skeleton and metadata on Day 1, real voice on Day 2, interface and multiplayer on Day 3, hardening on Friday morning |
| Tooling | pnpm, Next.js 16, React 19, TypeScript 6 strict (7 is not yet supported by the lint tooling), ESLint 9, Vitest, Playwright |

## What you do in parallel

These need your accounts, so only you can do them. Never paste a key into the chat.

**Now, so I can test live while building**

- [ ] Create a Groq key for development. Add it to the cloud coding environment's settings (the environment menu in the session title bar, then Edit) as the environment variable `GROQ_API_KEY`.
- [ ] Create a free Ably account and an API key. Add it the same way as `ABLY_API_KEY`.
- [ ] In the same settings, under network access, allow: `api.groq.com`, `api.open-meteo.com`, `geocoding-api.open-meteo.com`, and Ably's domains with their subdomains (`ably.io`, `ably.net`, `ably-realtime.com`).
- [ ] Start a new session after saving: environment changes apply to new sessions. The repo's docs and `AGENTS.md` carry all the context over.

**Before deploying** (you already have Vercel)

- [ ] Import the repository in Vercel; add Neon Postgres from the Marketplace (Frankfurt).
- [ ] Add `GROQ_API_KEY`, `ABLY_API_KEY` and `SESSION_SECRET` in Vercel, marked Sensitive.

A suggestion, your call: connecting Vercel early costs nothing and gives a preview URL on every push, which is the only way to test the mic on your phone and to test rooms across two devices before Friday.

**Communication**

- [ ] Send Sarj a short note tonight: the plan, and that the PRD and TDD are in the repo (draft on request).

---

## Day 1 · Tuesday: plan, skeleton, metadata

### M0 · Plan ✅
- [x] Read the brief, brand book and visual identity
- [x] Research the voice stack, the models, realtime options
- [x] PRD, architecture, plan, acceptance tests, deployment strategy
- [x] Decisions: gpt-oss-120b with Qwen fallback, multiplayer as a Must, companion avatar as stretch
- [x] Repository hygiene: author-only history, `AGENTS.md`, `SECURITY.md`, docs reader

### M1 · Skeleton, brand and metadata ✅
- [x] Next.js 16 (App Router), React 19, TypeScript strict, lint and format, Vitest, Playwright, all through pnpm
- [x] `styles/tokens.css` from the brand; `glass.css`; fonts through `next/font`
- [x] Logo components from the brand SVGs (symbol, wordmark, combined, Arabic, favicon)
- [x] Static voice screen matching the visual identity: sidebar, orb, caption, status, glass control bar, cycling through the six states with demo data
- [x] Light and dark themes; English and Arabic layout (mirrored)
- [x] Metadata: titles and descriptions, Open Graph and X cards, `opengraph-image.tsx`, icons, manifest, robots, sitemap, JSON-LD, theme colors
- [x] `/api/health`
- [x] GitHub Actions: typecheck, lint, unit tests, gitleaks

**Done when:** `pnpm dev` shows the idle screen in light and dark, in English and Arabic; the preview image renders at `/opengraph-image`; CI is green.

### M2 · The turn pipeline, with fake providers ✅
- [x] `shared/protocol.ts` (turn and room events, validated with zod)
- [x] Database schema and first migration; PGlite for development and tests
- [x] Session cookie (`/api/session`)
- [x] `server/turn/prompt.ts`, `sentences.ts`, `pipeline.ts`, `onboarding.ts`
- [x] Tools: `remember`, `forget`, `get_weather` (Open-Meteo responses recorded as fixtures)
- [x] Fake providers: scripted model with tool calls, canned transcripts, generated tones
- [x] Text box on the page drives a full turn through the fakes; events render in the UI

**Done when:** integration tests pass for save, recall, update, forget, weather and onboarding, entirely offline.

---

## Day 2 · Wednesday: real voice, real memory

### M3 · Live providers
- [x] Groq Whisper (`whisper-large-v3-turbo`), language detection, interface language as hint, bilingual vocabulary prompt
- [x] Groq `openai/gpt-oss-120b` through the AI SDK: tool loop, step limit, low reasoning effort; `qwen/qwen3.8-27b` then `openai/gpt-oss-20b` as fallbacks
- [ ] Model bake-off (`scripts/bakeoff.ts`): 20 prompts, English and Arabic; results in the README
- [x] Groq Orpheus: English and Saudi Arabic voices; first sentence alone, the rest as one request; WAV header repaired
- [x] Live Open-Meteo (geocoding in Arabic and English, forecast, 4 s timeout)
- [ ] Guardrails: topic policy, `gpt-oss-safeguard-20b` check in parallel with the main model, persona lock in the prompt
- [ ] Red-team suite (`scripts/redteam.ts`), 25 prompts, wired into CI with fakes
- [x] Image turns route to `qwen/qwen3.8-27b` (the only model in the chain marked `vision`; checked live on Day 2)
- [x] Cost per turn (`server/turn/cost.ts`) in the `done` event: model tokens, seconds heard, characters voiced per language, priced from one table with its sources
- [x] Rate limits (per user, per IP) and input caps
- [ ] Structured timing logs per turn

**Done when:** a typed question gets a spoken answer from the real providers, and a typed fact survives a reload. (Met on Day 2, in English and Arabic, typed and spoken.)

**What the first live runs taught us (Day 2)**

| Found | Fix |
|---|---|
| Orpheus streams its WAV, so the header claims about 24 hours of audio | `fixWavHeader` rewrites both lengths; unit tested |
| English questions got Arabic answers: the Saudi examples pulled the model over | Only the current language's voice block goes in the prompt, and the reply language is the prompt's last line |
| "Saved" said for "Riyadh" with no save made | Rule: a short answer to your own question is the fact; never claim a save you did not make. The onboarding line now names the next step too |
| Sentences glued ("kabsa.Got it"), a long dash, "You told me on today" | `tidy()` fixes what Sarjy is about to say; the prompt forbids tails like "Anything else?" |
| Short Saudi phrases misheard by Whisper ("وشلوني المفبر") | A bilingual vocabulary prompt; the same clip now reads "وش لوني المفضل؟" and English still detects as English |
| Free Groq tier: 8,000 model tokens a minute, about four turns | Three-model chain. For the review and the Majlis demo, the key should be on Groq's Dev tier (pay as you go) |
| First sound: 1.0 to 2.5 s for a plain answer, 4.5 to 6 s with the weather tool | Weather is the slow path (about 1.4 s in Open-Meteo plus a second model call); to work on in M7 |

### M4 · The voice loop in the browser
- [x] `client/voice/machine.ts` with unit tests for every transition
- [x] Mic with level meter; VAD with model files in `/public/vad`; WAV encoder
- [x] Turn stream reader; audio player queue on one `AudioContext` clock
- [x] Sound cues (open, close, saved)
- [x] No-mic path: dashed mic, text box focused
- [x] Live word preview while speaking (Web Speech API, where available)
- [x] Barge-in by tap: tapping the mic over Sarjy stops playback and listens
- [ ] Barge-in by voice (needs headphones to be safe; see architecture, section 11)
- [x] E2E with Chromium's fake microphone and a recorded sentence; the no-mic path

**Done when:** you tap the mic, say "My favorite color is green", hear the confirmation, reload, ask, and hear "Green. You told me today." On laptop and phone. (Automated in the browser with a fake mic; the laptop and phone check needs a deployed URL.)

---

## Day 3 · Thursday: the interface, then multiplayer

### M5 · The interface deep dive (morning)
- [x] Orb driven by real audio: mic level while listening, output level while speaking; smoothed and calm (Turki's review)
- [x] Caption word timing from the audio envelope (`shared/wordTiming.ts`), unit tested; unspoken words blurred
- [x] The stitch: underline on the saved fact, the saved card under the orb, and the tick (memory moved to Settings on Turki's direction)
- [x] Memory cards with Edit and Forget; Forget everything (in Settings)
- [x] Tool chip with label and timing
- [x] Settings as a popup like Claude's (sections beside content), opened from your name at the bottom of the sidebar (Turki's review, Day 2):
  - [x] General: language, with Auto detect
  - [x] Appearance: System, Light and Dark as small pictures of the screen; System follows the device live
  - [x] Profile: your picture (one of the three paintings, or your own photo, shrunk to 192 px in the browser) and your name
  - [x] Memory: every fact with Edit and Forget; Forget everything with one confirmation. The sidebar's Memory list folds
  - [x] The language and theme buttons left the top bar
  - [x] Voice: one per language (six English, six Saudi Arabic Orpheus voices), with a cached preview; the control bar is gone, so it lives in Settings
- [x] Onboarding in the interface: a quiet welcome bubble on a first visit (no chats, no name), with Skip the intro; never spoken uninvited, never forced
- [x] Recent chats and New chat: New chat clears the stage and says so; a past chat reopens with its last answer; the one on screen is highlighted; search filters chats and memories
- [x] Collapsible sidebar, remembered across visits
- [x] The whole chat: "Show the whole chat (n)" opens every line above the latest bubbles, scrolling
- [x] Details panel: the ⓘ on Sarjy's answer opens a timing waterfall (heard you, first word, first sound, done), the model, tokens, and cost (and per 1,000 answers)
- [x] Images: the picture button (the camera on phones), paste, or drop anywhere; shrunk to 1280 px JPEG in the browser; thumbnail in your bubble; only a model that sees (Qwen) takes a picture turn
- [x] Below 900 px: the sidebar is a sheet from the reading start, over a dimmed page; reduced motion and reduced transparency respected throughout

### M6 · Multiplayer: the Majlis (afternoon and evening)
- [ ] Tables: `rooms`, `room_members`, `room_segments`; `messages.speaker_id`
- [ ] `server/realtime/` (Ably REST publisher, token minting, in-memory fake)
- [ ] Create, join and end a Majlis; "Invite to your Majlis" link and share sheet
- [ ] The floor: atomic claim, 45 s expiry, release at `done`
- [ ] Pipeline publishes every turn event to the room, audio by URL
- [ ] `client/room/useRoom.ts`: presence, floor, remote events into the same hook and components
- [ ] Room bar: who is here, who is speaking
- [ ] Memory privacy: only the speaker's memories load; cards only on the owner's screen
- [ ] Majlis invite metadata ("Join Turki's Majlis on Sarjy", preview card, `noindex`)
- [ ] E2E: two browser contexts in one room

**Done when:** two browsers join one room, take turns, both see and hear every answer, and neither can get the other's memories out of Sarjy.

---

## Day 4 · Friday morning: harden and submit

### M7 · Harden and submit
- [ ] Every Must in the acceptance tests passes; E2E green in CI
- [ ] Record latency (p50 and p90 over 20 turns, with and without the weather tool) in the README
- [ ] Latency write-up: where the time goes, what we tried, what worked, what didn't, next week
- [ ] Cost model for 1,000 daily users in the write-up
- [ ] Red-team suite run against the live stack; results in the README
- [ ] Write-up sections: the API justification, why bilingual, the deep dives, why not telephony or MCP yet, what's next
- [ ] Link previews checked in WhatsApp, X, Slack and LinkedIn
- [ ] README: live URL, what it is, how to run, architecture summary, the API justification, the deep dives, what we would do next
- [ ] 3 to 5 minute Loom and a PDF of the docs reader, sent to Sarj at least a day before the meeting
- [ ] Final check of secrets: gitleaks clean, client bundle clean, Vercel env only
- [ ] `main` is the default branch and holds everything
- [ ] Submit in Ashby: deployment URL and repository URL

### Added on Day 2 (Turki's requests)
- [x] Link-preview card system: twelve illustrated cards, picked per link by kind and language
- [x] Share a moment (`/s/{code}`), with its own card
- [x] Build notes served at `/notes` (now the Sarjy Handbook at `/handbook`; `/notes` forwards)
- [x] Brand art added (`docs/brand/art/`)
- [x] CI test summary on every run, Playwright report kept, README badge
- [x] Sarjy's voice: a casual Saudi friend, not a formal assistant (prompt, fake replies, PRD section 8)

### Pages (Turki's requests, after M5)
- [ ] A high-quality home page that introduces Sarjy, with a clear way into the voice screen
- [ ] A custom, animated 404 page in the brand, bilingual, with a way back (references: dribbble.com/tags/404-page, 404s.design)
- [ ] Maybe: onboarding screens, a short first-run walkthrough (decide after M5's onboarding in the interface)

### Fixed from Turki's review (Day 2)
- [x] The "Sarjy" title left the top bar (the sidebar already carries the name)
- [x] End appears only during a turn; the settings button returns with the settings panel
- [x] Onboarding never forced: asked once, early, lightly; skipping is fine; units are not asked (Celsius by default)
- [x] The dev-only Next.js badge moved off the logo

### Fixed from Turki's second review (Day 2)
- [x] Leaked model planning spoken aloud ("We need to respond? Actually answer already given."): the turn now stops after the step that answers, and any sentence of self-talk is dropped before it is spoken, shown or saved
- [x] Numbers written as digits ("39", not "thirty nine"); a sentence said twice in a row is said once
- [x] Onboarding only asks with a reason: the name when Sarjy introduces itself, the city only for a weather question with no place
- [x] Hands-free (V7, now a Must): after a spoken answer the mic reopens by itself; 8 s of quiet, End or typing ends it. A loudness backstop ends a turn if the speech detector hangs on in a noisy room
- [x] The light orb has grain like the dark one (a black grain tile; tokens.css notes the override)
- [x] Profile pictures from Turki's three paintings: one at random per person, changeable from the sidebar
- [x] The orb is the mic: tap it to talk, tap again when done, tap over Sarjy to interrupt; the control bar keeps only End (and settings, in M5)
- [x] Rename a chat: the pencil on hover (or double-click); Enter saves, Escape cancels
- [x] The last few lines of the chat show small above the caption, so a chat switch is visible and the question stays in view

### Fixed from Turki's third review (Day 2)
- [x] An answer cut off after its first sentence ("Sure thing." then silence). The rest arrived after the first sentence had finished and was still decoding, so the screen took the silence for the end, and hands-free reopened the mic over it. Now the player plays pieces strictly in arrival order, counts decoding pieces as busy, never plays a piece after a stop, and a turn ends only when every piece received has played (`client/voice/turnEnd.ts`, unit tested; an E2E test slows the voice and the decoder to reproduce it, and fails on the old code)
- [x] Hands-free never reopens the mic while anything is still playing
- [x] The spoken language comes from the transcript's letters, not Whisper's label (which can call English with a Saudi accent "arabic")
- [x] Sarjy states exactly what it can do (remember, forget, weather, talk) and never claims more (it had offered news)
- [x] A calmer light: loudness is smoothed (quick up, slow down), the glow and size ease, the spin is slower and no longer jumps when the state changes

### Liquid glass (Turki's request, Day 2)
- [x] One Glass dial in Settings, Appearance: Solid (the original look) to Clear, with Frosted and Liquid in between; live while dragging, remembered, rendered by the server so the first paint is right
- [x] A slow light field behind the interface, so the glass has something to bend; specular rims, inner glow and depth on every glass surface
- [x] The sidebar lifts off the edge into a floating glass sheet; settings, the text box and the share button are glass
- [x] Refraction through an SVG displacement filter where the browser can draw it (Chromium)
- [x] "Reduce transparency" and "Increase contrast" start at Solid, but your own choice on the slider wins (Windows reports "Transparency effects: off" as reduce transparency, which had kept the glass off entirely); Settings says why when it happens

### Fixed from Turki's fourth review (Day 2)
- [x] Memory left the sidebar: one Memory row (with a count and a pulse on each save) opens Settings, Memory; when something is saved, a stitched card under the orb shows it and opens Memory when tapped
- [x] The language menu is Sarjy's own dropdown (glass list, a check on the choice, arrows, Enter and Escape; Escape closes only the menu)
- [x] Windows asked "Terminate batch job?" twice on Ctrl+C: the scripts now run Next.js through Node (one prompt fewer); the README explains the last one and how to drop it

### Fixed from Turki's fifth review (Day 2)
- [x] The End button is gone: tapping the orb stops or interrupts, and Escape stops everything
- [x] Each chat in Recent has a ⋯ menu (Rename, Pin, Share, Delete with one in-place confirmation); pinned chats stay on top with a small pin. No projects, no archive. The top-bar share button is gone: Share lives in the menu
- [x] The conversation shows as bubbles (like x.ai's voice mode): yours on one side, Sarjy's in glass in the voice face; the one being said is largest and keeps the word-by-word focus
- [x] New chats greet with one of Turki's ten lines, at random, in the interface language
- [x] The sidebar has one shape at every glass level: a floating, rounded panel (opaque at Solid)
- [x] The orb is centered in the window (the stage spans the full height; the top bar and text box sit over it)
- [x] Edge light that reads as glass: a bright crescent at the lit corner, a bright top edge, a faint opposite reflection, soft inner shading low down; it mirrors in Arabic

### Fixed from Turki's sixth review (Day 2, after M5)
- [x] Stuck on "Listening": a cough or click started the speech detector, which then dropped it, and nothing reset the screen. Every way listening ends now goes through one function that rests the screen when nothing was sent; a dropped sound restarts the 8 s quiet timer; a last guard resets "Listening" with no open mic. A fake-microphone test plays a 160 ms burst (AT-07a)
- [x] Pictures stay with the chat: saved in a `pictures` table beside the message, shown again when the chat is reopened (`/api/pictures/{id}`, owner only), and the latest one goes back to the model so follow-ups work; if no seeing model can answer, the others answer from the words (AT-53a)
- [x] Found while checking pictures live: Groq's free tier refused Qwen requests that left the output length open (1,000 output tokens a minute). Qwen, which has no reasoning, is now capped at 500 per step, far above a one or two sentence answer; gpt-oss stays uncapped so its hidden reasoning is never cut
- [x] The details card could not be closed (it covered its own ⓘ): it now sits above the ⓘ (below when there is no room), closes with its X, Escape, a tap elsewhere, the ⓘ, or the next turn, and keeps enough tint to read at Clear (AT-50a)
- [x] The hard rectangle around the bubbles: the transcript clipped their shadows. Its box now reaches past the bubbles by the shadows' size; older bubbles show at most three lines, so the list rarely overflows
- [x] The sidebar sat 20 px from the top and flush with the bottom (a sticky offset turned into a plain shift). It now floats with the same 10 px gap above and below

### Fixed from Turki's seventh review (Day 2, after M5)
- [x] The robotic English voice: Groq's free tier gives Orpheus 100 requests a day per language, and past that the browser reads. The backup now picks the browser's most natural voice (Edge's Natural voices, Safari's Premium, Chrome's Google voices; unit tested), says once why the voice changed, and never leaves Sarjy on "Speaking" when a browser never reports the end. The Dev tier removes the limit
- [x] Markdown the model slips in (`*Horizon Forbidden West*`) is removed before it is shown or spoken
- [x] Scrollbars are Sarjy's own: a thin rounded thumb, no track, no arrows, everywhere
- [x] The whole chat opens at its newest line, the orb steps back to a small size, the list ends above the text box, and its edges fade instead of cutting. On a short window the recent bubbles fit the room under the orb (a slightly smaller orb, small picture thumbnails), and one that can't fully show is hidden rather than cut
- [x] The profile row's highlight is a rounded box like every other row; the line above it is its own element

### Pure glass (Turki's direction, Day 2)
- [x] The Glass slider goes past Clear to Pure: every level up to Clear looks as before, and from Clear to Pure the tint and frosting fade to nothing, the sheen thins, the edge light brightens and the bend grows, until only the edges draw each surface (like Apple's camera mode pill). Words on pure glass keep a soft halo in the page color; Settings stays readable because the page behind it blurs more. Stops sit under their real points (Solid, Frosted, Liquid, Clear, Pure)

### Wallpapers, a clear Pure, Arabic bubble corners (Turki's direction, Day 2)
- [x] Settings, Appearance, Background: the glow (the light field, as before), three rugs Turki chose (Crimson, Midnight, Sunlit; `public/wallpapers`, with thumbnails), or your own picture (shrunk in the browser to 2560 px, stored in its own `wallpapers` table, served only to you at a versioned address, deleted by Forget everything). The choice is a cookie, so the first paint is right. Over a picture, a light veil and a halo around words keep them readable
- [x] At Pure the page behind Settings is neither blurred nor dimmed: pure means clear. Its words carry a halo instead
- [x] In Arabic, the rim light stuck out past two corners of Sarjy's bubbles: the ring was mirrored by flipping it, which also flipped its corner shapes. Now only the light moves. An English line in the Arabic interface also had its tail corner on the wrong side: bubbles keep the page's direction, and only the words run in their own

### Turki's touches (after every Must, in this order)
- [ ] H1: Hijri date and time-of-day greetings in the prompt and the interface
- [ ] T5: prayer times tool (Aladhan, Umm al-Qura)
- [ ] H2: the Morning card

### Stretch · Rafeeq, the companion
- [ ] A1: Rafeeq, faceless, made from the wave, chosen in settings
- [ ] A2: Rafeeq with a face

---

## Cut line

If we fall behind, cut in this order, top first. Musts are never cut.

1. Rafeeq with a face (A2)
2. Rafeeq, faceless (A1)
3. The Morning card (H2)
4. Prayer times tool (T5)
5. Hijri and greetings (H1)
6. Cost per turn and cost model (CM1)
7. Details panel (U9)
8. Host can end a Majlis (MP8)
9. Barge-in (V6)
10. Live word preview (V5)
11. Recent chats (U8)

## Communication

The brief scores communication. One short note to Sarj at the end of each day: what shipped, what is next, any blocker, even if the day was quiet. Day 1's note says the PRD and TDD are in the repo.

Ask Sarj, rather than working around it, when: a free-tier limit blocks testing (ask for a key), the deadline is at risk (say so early), or a scope question has no clear answer in the brief.

## Preparing to present

By Friday you should be able to explain, without notes:

1. The path of one turn (architecture, section 3, and the reading guide).
2. Why a cascade and not a speech-to-speech model.
3. How memory works, why it is not a vector database, and how the "no quiet saves" rule is enforced.
4. How captions stay in sync without word timestamps from the voice.
5. How a room works, and why no one's memory can leak to someone else in it.
6. Where the time goes, with measured numbers, and how the model was chosen.
7. How the guardrails work without slowing allowed turns, and what the red-team suite showed.
8. What you would do with another week.

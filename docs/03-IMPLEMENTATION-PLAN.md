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

## Where we are (Thursday 1 Oct)

| Milestone | State |
|---|---|
| M0 to M6: plan, skeleton, live voice, the voice loop, the interface deep dive, the Majlis | Done, with every review round from Turki folded in |
| Web search, memory as sentences, images in the chat, liquid glass, wallpapers | Done (added on Day 2) |
| Rafeeq, the companions: eight, each with a personality, a smile, a story and its own bond | Done (Days 3 and 4) |
| Pages: the home page at `/` (the voice screen moved to `/talk`) and the 404, both following day and night | Done (Days 4 and 5) |
| Turki's touches | H1 (Hijri and time of day) done in the prompt; the prayer-times tool (T5) and the Morning card (H2) not built (see below) |
| M7: harden and submit | Live at https://sarjy-three.vercel.app (Day 5). Done: the topic policy and the red-team suite, the write-up (`docs/07-WRITEUP.md`) with measured latency and cost, link previews. Open: Turki's phone checks, the Loom, the submission |
| CI | Green on every push to `main` (typecheck, lint, format, unit and integration, build, bundle secret scan, end-to-end in Chromium, gitleaks) |
| Tests | 237 unit and integration tests (the 25 red-team cases among them), 66 end-to-end tests |

## What you do in parallel

These need your accounts, so only you can do them. Never paste a key into the chat.

**Now, so I can test live while building**

- [ ] Create a Groq key for development. Add it to the cloud coding environment's settings (the environment menu in the session title bar, then Edit) as the environment variable `GROQ_API_KEY`.
- [ ] Create a free Ably account and an API key. Add it the same way as `ABLY_API_KEY`.
- [ ] In the same settings, under network access, allow: `api.groq.com`, `api.open-meteo.com`, `geocoding-api.open-meteo.com`, and Ably's domains with their subdomains (`ably.io`, `ably.net`, `ably-realtime.com`).
- [ ] Start a new session after saving: environment changes apply to new sessions. The repo's docs and `AGENTS.md` carry all the context over.

**Before deploying** (you already have Vercel)

- [x] Import the repository in Vercel; add Neon Postgres from the Marketplace (Frankfurt).
- [x] Add `GROQ_API_KEY`, `ABLY_API_KEY` and `SESSION_SECRET` in Vercel, marked Sensitive.

A suggestion, your call: connecting Vercel early costs nothing and gives a preview URL on every push, which is the only way to test the mic on your phone and to test rooms across two devices before Friday.

**Communication**

- [x] Send Sarj a short note tonight: the plan, and that the PRD and TDD are in the repo (draft on request).

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
- [ ] Model bake-off (`scripts/bakeoff.ts`): 20 prompts, English and Arabic; results in the README. Superseded: the model choices were measured live instead (Day 2: tool calling and speed; Day 5: the stand-ins' Arabic under the free tier's limits), see architecture, section 8
- [x] Groq Orpheus: English and Saudi Arabic voices; first sentence alone, the rest as one request; WAV header repaired
- [x] Live Open-Meteo (geocoding in Arabic and English, forecast, 4 s timeout)
- [x] Guardrails: topic policy, `gpt-oss-safeguard-20b` check in parallel with the main model, persona lock in the prompt (Day 5: nothing voiced and no tool run before it says yes; fails open on errors)
- [x] Red-team suite (`tests/redteam/cases.ts`), 25 prompts, wired into CI with fakes; `scripts/redteam/run.mjs` for the live stack
- [x] Image turns route to `qwen/qwen3.8-27b` (the only model in the chain marked `vision`; checked live on Day 2)
- [x] Cost per turn (`server/turn/cost.ts`) in the `done` event: model tokens, seconds heard, characters voiced per language, priced from one table with its sources
- [x] Rate limits (per user, per IP) and input caps
- [x] Structured timing logs per turn (one JSON line per turn in the server log: stage timings, model, tokens, cost; never what was said)

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
- [x] Tables: `rooms`, `room_members` (with seats), `room_media`; `messages.speaker_id`
- [x] `server/realtime/` (Ably REST publisher, signed token requests, in-process bus for tests and offline)
- [x] Create, join and end a Majlis; "Invite" link and share sheet
- [x] The floor: atomic claim, 45 s expiry, release once the turn has reached the room
- [x] Pipeline publishes every turn event to the room, audio by URL
- [x] `client/room/useRoom.ts`: presence, floor, remote events into the same hook and components
- [x] Room bar: who is here, who is speaking
- [x] Memory privacy: only the speaker's memories load; memory events never leave the owner's screen
- [x] Majlis invite metadata ("Join Turki's Majlis on Sarjy", preview card, `noindex`)
- [x] E2E: two (and three) browser contexts in one room

**Done when:** two browsers join one room, take turns, both see and hear every answer, and neither can get the other's memories out of Sarjy.

---

## Day 4 · Friday morning: harden and submit

### M7 · Harden and submit
- [x] Every Must in the acceptance tests passes; E2E green in CI (Day 5: 237 unit and integration, 66 end to end)
- [x] Record latency (p50 and p90, with and without the weather tool) in the README: measured on 8 turns of each kind on Day 5 (to stay inside the free tier's daily limit); `scripts/eval/latency.mjs` re-runs it with `N=20`
- [x] Latency write-up: where the time goes, what we tried, what worked, what didn't, next week (`docs/07-WRITEUP.md`, section 5)
- [x] Cost model for 1,000 daily users in the write-up (about $900 a month; section 6)
- [x] Red-team suite run against the live stack; results in the README (25 of 25 after one prompt fix; section 7)
- [x] Write-up sections: the API justification, why bilingual, the deep dives, why not telephony or MCP yet, what's next
- [x] Link previews checked (Turki, Day 5)
- [x] README: live URL, what it is, how to run, architecture summary, the API justification, the deep dives, what we would do next
- [ ] 3 to 5 minute Loom and a PDF of the docs reader, sent to Sarj at least a day before the meeting
- [x] Final check of secrets: gitleaks clean, client bundle clean, Vercel env only (CI on Day 5; keys only in Vercel)
- [x] `main` is the default branch and holds everything
- [ ] Submit in Ashby: deployment URL and repository URL

### Added on Day 2 (Turki's requests)
- [x] Link-preview card system: twelve illustrated cards, picked per link by kind and language
- [x] Share a moment (`/s/{code}`), with its own card
- [x] Build notes served at `/notes` (now the Sarjy Handbook at `/handbook`; `/notes` forwards; locked behind `HANDBOOK_KEY` on Day 5, AT-108)
- [x] Brand art added (`docs/brand/art/`)
- [x] CI test summary on every run, Playwright report kept, README badge
- [x] Sarjy's voice: a casual Saudi friend, not a formal assistant (prompt, fake replies, PRD section 8)

### Pages (Turki's requests, after M5)
- [x] A high-quality home page that introduces Sarjy, with a clear way into the voice screen (Day 4: the voice screen moves to `/talk`; the Rafeeqs live in the hero, a scroll-told promise, a day with Sarjy, a gallery, the Majlis, the reins, a finale to pick one; a companion rides along; greets you by name)
- [x] A custom, animated 404 page in the brand, bilingual, with a way back (Day 4: lost Rafeeqs around a campfire, four scenes shuffled each visit, a squabble in a dust cloud, the moon as the zero)
- [x] Turki's review of the pages (Day 4): no dash lines on the section labels; a hello from your Rafeeq in a bubble, random, following light and dark; the sun and moon switch the theme; new hero and Rafeeqs ledes; no level on the headline, no notes, no Play button; a smoother timeline; the gallery shows each name once, upright; the finale scattered like the dots page with a Talk with Sarjy button; no handbook links for now; on the 404 the moon changes the scene and the fire is a secret; the app opens on a fresh-chat line and its logo leads home; the prompt says the Now line is the only source for the time (AT-124)
- [x] The bond (Turki, Day 5: "feels like bugs after a while"): replies to moments sent together could arrive out of order and pull the bar back or replay a level-up; the screen now only moves it up. Today's cap is said once a visit instead of the bond just stopping
- [x] The film at `/film`, linked from the home page's foot (Turki's 68-second film, in Arabic; the foot link went later the same day, when Films joined the bar)
- [x] The film's own link card (an open-air screening with the Rafeeqs), and the page ready for more films: a catalog, a page per film at `/film/<id>`, the others listed under the one playing
- [x] Two films (Day 5): "End of Winter" (the newest, at `/film`) and "Sarjy, in a minute" in English and in Arabic as one film with a choice of version; each film its own link card in both languages; the film page redesigned to match the site (the home page's bar and foot, light and dark, English and Arabic, a screen with a glow of the film's colors, a shelf of the others); Films in the home page's bar and a section of its own after the reins, a night screening animated like the rest
- [x] Turki's review of the films (Day 5): no icon beside Films in the bar; the screening's own play (popcorn for whoever you tap, Drifter waking with a start, the audience leaning in at the screen, a projector's flicker between films); ready for many films (the home section shows the newest three and "All N films", the films page's shelf turns into a row you swipe past three), tried with ten
- [x] Every film its own link for good (`/film/<id>`, the newest too), `/film` its own card for the films as a whole, a Share button on each film, and a description of End of Winter that says what it is about
- [x] Turki's phone review (Day 5, iPhone 15 Pro Max): the hero as tall as what is in it on a phone (no empty band above the dunes); the day's time pill follows the day on a phone too, stopping short of the edges; no film icon in the bar and no Films link in the foot; three easter eggs on the film pages (house lights, Drifter after the credits, "popcorn")
- [x] The film plays on iPhone and iPad (Day 5: Safari showed a crossed-out play button): re-encoded from 4K at H.264 level 6.0 to 1080p at level 4.1 (24 MB to 10 MB, the same picture), with a test that checks every film's level
- [x] A birthday is kept (Day 5: "I was born 2002/6/3" wasn't): the secret check no longer reads a date as a long number, the writer's rules name birthdays, and Qwen is the writer's last stand-in
- [x] An answer said twice in other words (a stand-in model, Day 5: "...in Riybah today. ...in Riyadh today.") is said once
- [x] A quiet Majlis lets go of its Ably connection (10 minutes idle, or 2 in a background tab) and comes back with a tap
- [x] The home page's link-preview card drawn like the others: the caravan of Rafeeqs under a big sun, "Shaped to its rider." (Turki, Day 5)
- [x] The version at the foot of the home page, `v0.7.N`: MAJOR.MINOR from `package.json` (0 until the submission, MINOR the milestone), PATCH the number of commits, worked out at build time (git, or GitHub's API on Vercel's shallow clone), linked to its commit
- [x] Speech to text and replies (Turki, Day 5: "STT makes a lot of mistakes", "why does it switch Arabic and English"): `whisper-large-v3` with turbo as backup; Whisper is told your name, your city and what Sarjy just said; a model that fails partway no longer leaves its half answer glued to the next one's; gpt-oss-20b stands in before Qwen; English filler is dropped from Arabic replies. Measured live: on Groq's free tier the main model runs out after two or three quick turns (about 2,400 tokens a turn against 8,000 a minute), and the stand-ins are where the mixed languages came from, so the Developer tier is the real fix
- [x] In a Majlis, Sarjy knows who is here now (presence) and who left, and never names anyone else; no example names left in its rules (it had said "Sara" was there)
- [x] The Majlis mic is freed before the turn's response ends (on Vercel it could stay taken)
- [x] The 404 card shows in chats: link-preview bots get the lost page with a 200
- [x] The finale's gather glides: eased scroll, transforms only, a longer scroll on phones
- [x] The finale gathers (Turki, Day 5): the eight leave their scattered spots as you scroll and line up along the bottom, peeking over the footer; Breeze starts clear of the top bar (it was cut off under it); "rider." in the hero is upright
- [x] Own link-preview cards for the Majlis, `/talk` and the 404, in both languages, with the Rafeeqs in them; the Majlis no longer borrows the memory cards (Turki, Day 5, AT-126)
- [x] Day and night (Turki, Day 5): the home page and the 404 follow the clock where you are (day from 6 to 18); a choice of light or dark (the toggle, the sun or moon, Settings) holds until the light next changes, then the clock leads again. The 404 gets a day sky with the sun as its zero. Set before the page paints, so there is no flash; leaving for `/talk` hands back your own theme (AT-125)
- [x] Fixed: two scene variables shared names with brand tokens (`--night`, the night color, and `--dune-shade`, Dune's shading), which turned the dark background to nothing after visiting the home page; renamed (`--nightfall`, `--ridge-*`) and checked that no other registered property collides
- [ ] Maybe: onboarding screens, a short first-run walkthrough (Turki, Day 4: skipped for now)

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

### Memory, rebuilt (Turki's review, Day 2)
Researched first: how Sarjy's memory worked, what Anthropic and OpenAI ship, and what the research says (Mem0, LongMemEval, Zep, Letta, Generative Agents); then a live probe. Turki's calls: sentences, save then show, cross-chat search.
- [x] Memories are sentences that keep their details, grouped by topic (about you, people, likes and dislikes, plans and dates, other); `topic` and `note` columns, older memories migrated
- [x] A memory writer runs after each reply (gpt-oss-20b, with its own quota), with every existing memory in view: add, update, delete or nothing; updates merge, filler and passing moods are left out, relative dates become dates, sensitive topics only on request, secrets never; its saves stream before the turn ends and show as a "Noted" card
- [x] Nothing is remembered from words Whisper doubted (its no-speech and log-probability scores): the likely source of "It's on"
- [x] `search_chats`: Sarjy looks through your other chats when you ask about one, by words and by period, in Arabic and English, falling back to the latest chats when no words match
- [x] "You told me" dates from the last change; each memory shows the words it came from
- [x] `scripts/eval/memory.mjs`: a live eval of what is kept, what is left out, updates, forgetting and search, in English and Arabic. First live run: 16 of 18. Fixed from it: notes written in the wrong language, formal Arabic instead of Saudi dialect, health kept in passing but not when asked, the writer trusting Sarjy's reply. After the fixes every writer case passed live. The search cases need gpt-oss-120b, whose free-tier daily token cap (200K) ran out during testing; they pass with the fakes and are to be rerun live (on the Dev tier the cap goes away)

### Web search (Turki's call, Day 2)
- [x] `search_web`: Sarjy looks things up instead of saying it can't (gpt-oss-20b with Groq's browser search, told today's date; English reports; the 120b as fallback). A spoken "One sec, looking it up." as it starts (first sound in about 1.5 to 2 s); month and year added to recent questions; only what the search said, names and results kept exact in Arabic; a failed search owned. Chip, timing and cost like the weather. Checked live: current match results and the gold price, in English and Arabic

### The Majlis, as built (Turki's decisions, Day 3)
- [x] Hands-free off in a Majlis: each person taps each time
- [x] At most 8 people; each gets a seat at the door, and the seat is their color (`--seat-1` to `--seat-8`, new in tokens.css)
- [x] Every Majlis starts in a new chat; afterwards it stays in everyone's Recent as "Majlis: ...", each turn in its speaker's color
- [x] Pictures are shared with the room only after the guard passes them (Qwen with a short policy; Groq has no vision safety model now); a refused one is never shown, and only the sender is told
- [x] The finjan replaces the wave inside the orb in a Majlis; its steam rises with the voice
- [x] The door asks a newcomer's name; members (and the host) go straight in
- [x] Menus open on the page's body, so a menu inside glass is placed right
- [x] Turki's review: everyone sits around the finjan in their own profile picture; whoever has the mic comes in beside the cup with their name and a breathing ring, and the screen says who Sarjy is answering; the bar keeps only the name, count, Invite and the way out
- [x] Turki's review: the finjan has a look for every state, and the Sarjy wave is now the coffee's surface, moving with the voice
- [x] Fixed from Turki's review: a seat stuck beside the cup. Tapping to interrupt left the last turn marked; now whose turn it is clears whenever the screen rests or listens. An expired claim on the mic was never announced; now every screen lets it go by itself after 45 s
- [x] Turki's question, "should people hear each other?": yes, walkie-talkie style. Everyone else hears the speaker's own recorded words, then Sarjy's answer
- [x] Turki's idea: Sarjy by choice. People talk to each other by default; the Everyone / Sarjy switch, or starting with "Sarjy", brings it in. A turn to everyone runs speech to text only, is kept in the chat, and Sarjy knows it when asked later
- [ ] Live check on the deployed site with two phones (the container's Ably key is a placeholder, so tokens can only be tried on Vercel)

### Turki's touches (after every Must, in this order)
- [x] H1: Hijri date and time-of-day greetings in the prompt and the interface. Every turn's prompt carries the date (Gregorian and Umm al-Qura Hijri), the local time on both clocks and the part of the day, so Sarjy greets and answers "what's the Hijri date?" without a tool (`shared/hijri.ts`, tested); the home page greets by its light
- [ ] T5: prayer times tool (Aladhan, Umm al-Qura). Not built. Since Day 2 Sarjy can search the web, so "when is maghrib in Jeddah?" gets an answer from a search, but with a `web.search` chip, not a prayer chip, and from whatever source the search finds, not the Umm al-Qura method (AT-36 and AT-132 ask for both). Not yet checked against the live stack (this sandbox's Groq key is a placeholder)
- [ ] H2: the Morning card. Not built: it is a card on screen (weather, the next prayer, one memory), which web search can't give


### Stretch · Rafeeq, the companion
- [x] Turki's design (Day 3): four companions, Rider, Keeper, Scout and Drifter, with one cat-mouthed face; off by default, picked in Settings (with live previews), replacing the orb in your own chats, never in a Majlis
- [x] Alive: breathing, blinking, eyes on your pointer and on the text box as you type, glances, every state as a pose, the mouth moving with Sarjy's voice, a happy save, a droop on a failure, petting, sleep and waking
- [x] Gamified: a bond from visits, answers, saves and petting within daily caps; five levels unlocking a greeting, purring with hearts, a trick each, and a gold star; a pill with "+2" and a level-up chime
- [x] Turki's review: eight companions. The plush Rafeeqs from his reference sheet (Rider, Keeper, Scout, Drifter: felt, leather, brass, Sadu, bead eyes on a felt face) take the names; the first four become Dune, Lantern, Fennec and Breeze, refined, and Breeze is redrawn as wind (the old Drifter read wrong). Existing picks and bonds move to the renamed looks
- [x] One bond per companion (Pokémon style), `rafeeq_bonds`; each card shows its own level
- [x] More alive: a head-turn on plush faces, the body leaning toward you, tassels, hoods and ribbons swaying, fidgets between turns (hop, twitch, tilt, yawn, look), a trick each; the art lab (`scripts/rafeeq/lab.mjs`) draws every companion in every pose
- [x] Turki's review (Day 4): a personality each. Its own reaction to your pointer resting on it (Fennec annoyed, Keeper shy, Dune proud, Breeze dodging), to petting (composed, melts, ticklish, giggles, grumbles then gives in) and to a failure; its own energy, gaze, fidgets and bedtime; a face at rest (brows, lids, mouth); traits and a story each in Settings, in both languages (AT-116)
- [x] Turki's review (Day 4, again): a smile of its own for each (proud, bashful, beam, lazy, laugh, serene, smirk, cheeky); Fennec grumbles for longer, sulks, huffs as you leave, and gives in only at the third stroke
- [ ] Live look on a phone with real audio (the mouth follows the voice level, which headless tests can't hear)

---

## Cut line

If we fall behind, cut in this order, top first. Musts are never cut.

1. Rafeeq: live look and feel on a phone (A1 to A4 are built)
2. The Morning card (H2)
3. Prayer times tool (T5)
4. Hijri and greetings (H1)
5. Cost per turn and cost model (CM1)
6. Details panel (U9)
7. Host can end a Majlis (MP8)
8. Barge-in (V6)
9. Live word preview (V5)
10. Recent chats (U8)

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

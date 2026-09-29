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
- [ ] Groq Whisper (`whisper-large-v3-turbo`), language detection, interface language as hint
- [ ] Groq `openai/gpt-oss-120b` through the AI SDK: tool loop, step limit, low reasoning effort; `qwen/qwen3.8-27b` fallback
- [ ] Model bake-off (`scripts/bakeoff.ts`): 20 prompts, English and Arabic; results in the README
- [ ] Groq Orpheus: English and Saudi Arabic voices; first sentence alone, the rest as one request
- [ ] Live Open-Meteo (geocoding in Arabic and English, forecast, 4 s timeout)
- [ ] Guardrails: topic policy, `gpt-oss-safeguard-20b` check in parallel with the main model, persona lock in the prompt
- [ ] Red-team suite (`scripts/redteam.ts`), 25 prompts, wired into CI with fakes
- [ ] Image turns route to `qwen/qwen3.8-27b`
- [ ] Cost per turn (`server/turn/cost.ts`) in the `done` event
- [ ] Rate limits (per user, per IP) and input caps
- [ ] Structured timing logs per turn

**Done when:** a typed question gets a spoken answer from the real providers, and a typed fact survives a reload.

### M4 · The voice loop in the browser
- [x] `client/voice/machine.ts` with unit tests for every transition
- [ ] Mic with level meter; VAD with model files in `/public/vad`; WAV encoder
- [x] Turn stream reader; audio player queue on one `AudioContext` clock
- [ ] Sound cues (open, close, saved)
- [ ] No-mic path: dashed mic, text box focused
- [ ] Live word preview while speaking (Web Speech API, where available)
- [ ] Barge-in: speaking over Sarjy stops playback and starts a new turn

**Done when:** you tap the mic, say "My favorite color is green", hear the confirmation, reload, ask, and hear "Green. You told me today." On laptop and phone.

---

## Day 3 · Thursday: the interface, then multiplayer

### M5 · The interface deep dive (morning)
- [ ] Orb driven by real audio: mic level while listening, output level while speaking; light, rotation and grain per the brand
- [x] Caption word timing from the audio envelope (`shared/wordTiming.ts`), unit tested; unspoken words blurred
- [x] The stitch: underline on the saved fact, card appears in the sidebar (tick sound comes with the cues in M4)
- [ ] Memory cards with Edit and Forget; Forget everything
- [x] Tool chip with label and timing
- [ ] Settings sheet: theme, interface language, voice per language (with preview)
- [ ] Onboarding in the interface (pre-rendered greeting, Skip)
- [ ] Recent chats and New chat
- [ ] Details panel: latency waterfall and cost per turn
- [ ] Images: drop, paste or photograph; resized in the browser; thumbnail in the transcript
- [ ] Below 900 px: sidebar becomes a sheet; reduced motion and reduced transparency

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
- [x] Build notes served at `/notes`
- [x] Brand art added (`docs/brand/art/`)
- [x] CI test summary on every run, Playwright report kept, README badge

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
7. Hands-free mode (V7)
8. Details panel (U9)
9. Host can end a Majlis (MP8)
10. Barge-in (V6)
11. Live word preview (V5)
12. Recent chats (U8)

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

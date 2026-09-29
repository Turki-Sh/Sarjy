# 03 · Implementation plan

The build, day by day. Each milestone ends with something you can open in a browser, so we are never more than half a day from a working demo. Tick the boxes as we go; this file is the progress log.

| | |
|---|---|
| Start | Tuesday 29 Sep 2026 |
| Submission | End of Day 3 (Thursday 1 Oct). The email allows four calendar days from Monday 28 Sep; Friday morning is buffer only. |
| Order of work | De-risk first: deploy on Day 1, real voice on Day 2, polish on Day 3 |

## What you do in parallel (Day 1, about 20 minutes)

These need your accounts, so only you can do them. Details and screenshots-worth of steps are in [05-DEPLOYMENT.md](05-DEPLOYMENT.md#first-time-setup).

- [ ] Create a Groq account and an API key (free tier).
- [ ] Create a Vercel account (Hobby, free) and import `Turki-Sh/Sarjy`.
- [ ] In Vercel, add Neon Postgres from the Marketplace (free). It sets `DATABASE_URL` for you.
- [ ] In Vercel project settings, add `GROQ_API_KEY` and `SESSION_SECRET`.
- [ ] Optional, for live testing from the Claude cloud session: add the Groq key to the cloud environment's settings as `GROQ_API_KEY`, and allow `api.groq.com`, `api.open-meteo.com` and `geocoding-api.open-meteo.com` in its network access.
- [ ] Send Sarj the first progress note (draft ready on request).

---

## Day 1 · Tuesday: plan, skeleton, deployed

### M0 · Plan ✅
- [x] Read the brief, brand book and visual identity
- [x] Research the voice stack (Groq Whisper, Orpheus English and Saudi Arabic, model limits)
- [x] PRD, architecture, plan, acceptance tests, deployment strategy
- [x] Repository and branch, secret-safe first commit

### M1 · Skeleton on a public URL
- [ ] Next.js 16 (App Router), React 19, TypeScript strict, lint and format, Vitest, Playwright
- [ ] `styles/tokens.css` verbatim from the brand; `glass.css`; fonts through `next/font`
- [ ] Logo components from the brand SVGs (symbol, wordmark, combined, Arabic, favicon)
- [ ] Static voice screen matching the visual identity: sidebar, orb, caption, status, glass control bar, cycling through the six states with demo data
- [ ] Light and dark themes; English and Arabic layout (mirrored)
- [ ] `/api/health`
- [ ] GitHub Actions: typecheck, lint, unit tests, gitleaks
- [ ] First Vercel deployment

**Done when:** the Vercel URL shows the idle screen in light and dark, in English and Arabic, and CI is green.

### M2 · The turn pipeline, with fake providers
- [ ] `shared/protocol.ts` (events, validated with zod)
- [ ] Database schema and first migration; Neon in production, PGlite in tests
- [ ] Session cookie (`/api/session`)
- [ ] `server/turn/prompt.ts`, `sentences.ts`, `pipeline.ts`
- [ ] Tools: `remember`, `forget`, `get_weather` (Open-Meteo responses recorded as fixtures)
- [ ] Fake providers: scripted model with tool calls, canned transcripts, generated tones
- [ ] Text box on the page drives a full turn through the fakes; events render in the UI

**Done when:** integration tests pass for save, recall, update, forget and weather, entirely offline.

---

## Day 2 · Wednesday: real voice, real memory

### M3 · Live providers
- [ ] Groq Whisper (`whisper-large-v3-turbo`), language detection, UI language as hint
- [ ] Groq model through the AI SDK, with tool loop, step limit and a fallback model on rate limits
- [ ] Groq Orpheus: English and Saudi Arabic voices; first sentence alone, the rest as one request
- [ ] Live Open-Meteo (geocoding in Arabic and English, forecast, 4 s timeout)
- [ ] Rate limits (per user, per IP) and input caps
- [ ] Structured timing logs per turn

**Done when:** on the deployed URL, a typed question gets a spoken answer, and a typed fact survives a reload.

### M4 · The voice loop in the browser
- [ ] `client/voice/machine.ts` with unit tests for every transition
- [ ] Mic with level meter; VAD with model files in `/public/vad`; WAV encoder
- [ ] Turn stream reader; audio player queue on one `AudioContext` clock
- [ ] Sound cues (open, close, saved)
- [ ] No-mic path: dashed mic, text box focused
- [ ] Live word preview while speaking (Web Speech API, where available)
- [ ] Barge-in: speaking over Sarjy stops playback and starts a new turn

**Done when:** on the deployed URL you tap the mic, say "My favorite color is green", hear the confirmation, reload, ask, and hear "Green. You told me today." Test on laptop and phone.

---

## Day 3 · Thursday: the deep dive, then ship

### M5 · The interface deep dive
- [ ] Orb driven by real audio: mic level while listening, output level while speaking; light, rotation and grain per the brand
- [ ] Caption word timing from the audio envelope (`shared/wordTiming.ts`), unit tested; unspoken words blurred
- [ ] The stitch: underline on the saved fact, card appears in the sidebar, tick sound
- [ ] Memory cards with Edit and Forget; Forget everything
- [ ] Tool chip with label and timing
- [ ] Settings sheet: theme, interface language, voice per language (with preview)
- [ ] Onboarding: Sarjy greets you and asks your name (pre-rendered greeting, no quota)
- [ ] Recent chats and New chat
- [ ] Details panel: latency waterfall per turn
- [ ] Below 900 px: sidebar becomes a sheet; reduced motion and reduced transparency

**Done when:** the full demo script in [04](04-ACCEPTANCE-TESTS.md#reviewer-demo-script) runs cleanly in both languages and both themes.

### M6 · Harden and submit
- [ ] Every Must in the acceptance tests passes; e2e green in CI
- [ ] Record latency (p50 and p90 over 20 turns, with and without the weather tool) in the README
- [ ] README: live URL, what it is, how to run, architecture summary, the API justification, the deep dive, what we would do next
- [ ] Short Loom or PDF walkthrough
- [ ] Final check of secrets: gitleaks clean, client bundle clean, Vercel env only
- [ ] Submit in Ashby: deployment URL and repository URL

---

## Cut line

If we are behind at the end of Day 2, cut in this order, top first. Musts are never cut.

1. Hands-free mode (V7)
2. Prayer times tool (T5)
3. Details panel (U9)
4. Barge-in (V6)
5. Live word preview (V5)
6. Recent chats (U8)

## Communication

The brief scores communication. One short note to Sarj at the end of each day: what shipped, what is next, any blocker. Day 1's note links the planning docs as the PRD and TDD they recommend.

## Preparing to present

By the end of Day 3 you should be able to explain, without notes:

1. The path of one turn (architecture, section 3 and the reading guide).
2. Why a cascade and not a speech-to-speech model.
3. How memory works, why it is not a vector database, and how the "no quiet saves" rule is enforced.
4. How captions stay in sync without word timestamps from the voice.
5. Where the time goes, with our measured numbers.
6. What you would do with another week.

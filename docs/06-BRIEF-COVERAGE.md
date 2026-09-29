# 06 · Brief coverage

Every requirement in the brief, what we will do about it, and where it lives in the plan. The brief's wording is paraphrased here; the other documents hold the detail. If a row says **Gap closed**, the audit on 29 Sep found it missing and the plan now covers it.

| Status | Meaning |
|---|---|
| **Planned** | In the plan since the first draft |
| **Gap closed** | Found missing in the audit, now in the plan |
| **Not planned** | A conscious choice, with the reason |

---

## 1. What to build

| # | The brief asks | Status | How we will do it | Where |
|---|---|---|---|---|
| B1 | Listens and responds by voice, with any voice layer | Planned | Mic in the browser with Silero VAD to detect the end of speech; Groq Whisper for speech to text; Groq Orpheus for the voice, with a native Saudi voice for Arabic; captions for everything spoken; text input when there is no mic | PRD V1 to V7; Architecture 3, 11; M3, M4; AT-01 to AT-06 |
| B2 | Remembers facts and preferences across sessions ("What's my favorite color?") | Planned | Each fact is a row in Postgres tied to a signed cookie, loaded into every turn with the day it was told; saved and forgotten by voice through tools, confirmed out loud, shown as stitched cards with Edit and Forget | PRD M1 to M9; Architecture 6, 7; M2, M3; AT-10 to AT-21 |
| B3 | Calls at least one external API that makes it more useful | Planned | Weather through Open-Meteo (geocoding and forecast), defaulting to the remembered home city and units; a tool chip shows the call and its time; failures are said plainly | PRD T1 to T4; Architecture 9; M2, M3; AT-30 to AT-35 |
| B4 | Justify the API in 2 to 3 sentences in the write-up | Planned | Written in PRD section 7; copied into the README write-up | PRD 7; M7 |
| B5 | A working deployment URL the reviewer opens without special setup | Planned | Vercel production URL; no login (signed cookie); text input works without a mic; link previews so the URL looks right when shared | PRD R4, P1 to P7; Deployment; AT-60, AT-100 to AT-105 |

## 2. The deep dive

The brief asks for one area done deeply. We go deep on the interface (with bilingual as part of it) and on multiplayer, and give every other option a real, working baseline.

| # | Option | Depth | How we will do it | Where |
|---|---|---|---|---|
| D1 | **UI/UX and multimodal**: a rich, well thought out frontend | Deep, Planned | The orb from the visual identity driven by real audio; six states; glass and solid surfaces; the stitch for memory; sound cues; light and dark; mirrored Arabic | PRD U1 to U11; Architecture 11, 12; M1, M5; AT-40 to AT-52 |
| D1a | Example: live captions with word-level highlighting | Deep, Planned | Your words stream in while you speak; Sarjy's unspoken words stay blurred and sharpen as each is heard, timed from the audio envelope per sentence | PRD U3, V5; Architecture 11; AT-05, AT-43 |
| D1b | Example: a 3D or video avatar | Stretch, Planned | Rafeeq (رفيق), a faceless companion made from the wave, then a skin with a face, both driven by the same state and audio levels as the orb | PRD A1, A2; Architecture 16; AT-110, AT-111 |
| D1c | Example: Sarjy can "see" images uploaded in the chat while talking | **Gap closed** | Drop, paste or photograph an image into the chat, then ask about it by voice. Turns with an image go to `qwen/qwen3.8-27b`, which accepts images (the main model is text only). The image shows as a thumbnail in the transcript; nothing is stored beyond the conversation | PRD U12; Architecture 9a; M5; AT-53, AT-54 |
| D2 | **Latency**: lowest time to first audio, measured, where the time goes, what we tried, what worked, what didn't, next week | Baseline, **gap closed** for the write-up | Every stage timed per turn and shown in a waterfall; first sentence voiced alone; p50 and p90 recorded. New: a latency write-up with the breakdown, experiments, results, and a "next week" list | PRD U9, L1; Architecture 18; M7; AT-50, AT-80, AT-81 |
| D3 | **Guardrails and reliability**: prohibited topics, jailbreaks, no invented tool data | Baseline, **gap closed** for topics and jailbreaks | Numbers only from tools (checked in tests). New: a written topic policy enforced by Groq's `openai/gpt-oss-safeguard-20b` classifier, run in parallel with the main model so it adds no delay; a persona lock in the prompt; memory and tool output treated as data; a 25-prompt red-team suite run in CI with fakes and live before submitting | PRD G1 to G5; Architecture 10a, 19; M3, M7; AT-31, AT-66, AT-120 to AT-125 |
| D4 | **Multistep workflow**: one structured flow, how state is kept, how it recovers off-script | Baseline, Planned | Onboarding: name, home city, units. The step is stored on the server, advances only when the memory is actually saved, and returns to the step after an off-script question; offers to skip after two | PRD M8; Architecture 14; M2, M5; AT-20, AT-22 |
| D5 | **Multiplayer**: the conversation available to several participants at once | Deep, Planned | The Majlis (rooms) over Ably: share a link; everyone sees and hears the same turn; presence; one person holds the floor; private memory per speaker by construction | PRD MP1 to MP8; Architecture 13; M6; AT-90 to AT-99 |
| D6 | **Something else** (bilingual, telephony, video avatars, multimodal, MCP, cost modeling), and tell us why | Planned: bilingual. **Gap closed**: cost modeling and the "why" | Bilingual: Arabic in, Arabic out, in a native Saudi voice, with a mirrored interface. Why: Sarj is a Saudi company, the name is Arabic, and an English voice reading Arabic is the most common failure of voice assistants here. New: a cost per turn in the details panel (tokens, voice characters, times Groq's prices) and a cost model for 1,000 daily users in the write-up | PRD V3, U6, CM1; Architecture 18a; M5, M7; AT-47, AT-126 |
| D6a | Telephony | Not planned | A phone number adds a carrier, a new audio path and cost, and takes time from the two deep areas | |
| D6b | MCP integrations | Not planned | Tools are called in-process; an MCP layer would add indirection without a user-visible gain in three days. Listed as "next week" | Write-up |

## 3. Presentation

| # | The brief asks | Status | How we will do it | Where |
|---|---|---|---|---|
| E1 | Demo the app; they use it, ask questions, explore the code together | Planned | The rehearsed demo script; a reading guide that follows one turn through the files; a list of the questions to be ready for | Acceptance tests (demo script); Architecture 22; Plan, "Preparing to present" |
| E2 | Share a short Loom or PDF before the meeting | **Gap closed** (timing) | Record a 3 to 5 minute Loom and export the docs reader as a PDF; send both to Sarj at least a day before the meeting, not just at submission | M7 |
| E3 | They will ask how the code works | Planned | Small files with one job each; comments that explain why; you walk the reading guide before the meeting | AGENTS.md; Architecture 22 |

## 4. Tools and submission

| # | The brief asks | Status | How we will do it | Where |
|---|---|---|---|---|
| S1 | Any language or framework; AI to any extent | Planned | TypeScript, Next.js, pnpm; AI-assisted, with every commit authored by you | AGENTS.md |
| S2 | Code on GitHub; repository URL submitted through Ashby | Planned | Public repository `Turki-Sh/Sarjy`, `main` only; Ashby questionnaire gets the repository URL and the deployment URL | M7; Deployment 11 |
| S3 | A private repository needs reviewer access | Not needed | The repository is public, with secrets handled accordingly | SECURITY.md |
| S4 | Up to three days part-time; tell them if you have less time | Planned | Three days plus Friday morning, with a cut line; the daily note says if anything slips | Plan |
| S5 | Ask for API keys; Groq, Gemini, SambaNova and Cerebras are preferred | Planned | Everything runs on Groq. If free limits bite, we ask Sarj for a key before paying | Deployment 8 |
| S6 | Pursue the most interesting idea | Planned | Bilingual Saudi voice, visible memory, rooms, the companion | PRD |

## 5. Rubric

| # | They judge | How we answer it | Where |
|---|---|---|---|
| Q1 | Does it work well? | 78 acceptance tests; every Must passes before submission; E2E in CI with a fake mic | Acceptance tests; M7 |
| Q2 | Does it wow? | Word-synced captions, the orb reacting to real audio, the stitch, a Saudi voice, rooms across devices, the companion | PRD 5 |
| Q3 | Is it clearly different from a one-shot by a frontier model? | **Gap closed**: a section in the PRD lists what a one-shot would not have and how the demo shows it | PRD 3.2 |
| Q4 | Clean code that you understand thoroughly | Folder split by where code runs; reading guide; "Preparing to present" list; you review each milestone's code before it merges | Architecture 2, 22; Plan |
| C1 | Progress updates, even "busy day" | A short note to Sarj at the end of every day | Plan, Communication |
| C2 | Ask when blocked, confused, or to brainstorm | **Gap closed**: the plan names when to ask Sarj (a blocking key limit, a scope question) instead of working around it | Plan, Communication |
| C3 | How did you plan? A short PRD and TDD first | These documents, written before any code | Docs 01 to 06 |
| C4 | Was the presentation approachable? | Loom first, the demo script, the docs reader, diagrams | E2 |
| C5 | Can you explain your code? | Reading guide and preparation list | E3 |

## 6. Standing out

| # | They notice | How we answer it |
|---|---|---|
| X1 | Is the UI delightful? | The visual identity built as specified: glass, the orb, the stitch, motion on `--ease-rein`, dark mode, Arabic |
| X2 | Is the voice experience delightful? | Short, answer-first replies; a native Saudi voice; sound cues; interrupting works; the first sentence arrives fast |
| X3 | Is it creative and personal to you? | The name and the saddle story, your own brand system, Saudi Arabic first, weather that matters in Riyadh, and a short "why I built it this way" in the README |

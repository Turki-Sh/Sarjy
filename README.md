# Sarjy · سرجي

A voice assistant that remembers what you tell it, answers from real tools, and shows you everything it keeps.

> Shaped to its rider. على مقاس فارسه.

Sarj is Arabic for saddle; Sarjy means "my saddle". A saddle is fitted to one rider and breaks in to them over time. Tell Sarjy something once, and the next answer fits a little better.

**Status:** planned, building. The live URL will be here once deployed.

## Read the plan

| # | Document | Answers |
|---|---|---|
| 01 | [Product requirements](docs/01-PRD.md) | What we build, for whom, and why weather |
| 02 | [Architecture](docs/02-ARCHITECTURE.md) | How one turn flows from your voice to Sarjy's, and where each piece of code lives |
| 03 | [Implementation plan](docs/03-IMPLEMENTATION-PLAN.md) | The three-day build, milestone by milestone |
| 04 | [Acceptance tests](docs/04-ACCEPTANCE-TESTS.md) | How we know it works, and the demo script |
| 05 | [Deployment](docs/05-DEPLOYMENT.md) | How it ships, and how keys stay secret in a public repo |
| 06 | [Brief coverage](docs/06-BRIEF-COVERAGE.md) | Every requirement in the brief, and how and where we meet it |
| | [Brand](docs/brand/) | The brand book and visual identity: the design source of truth |

Prefer a single styled page? Run `pnpm install && pnpm docs:reader` and open `docs/reader.html`.

## Run it on your machine

You need Node 22 or newer. pnpm comes with Node through Corepack.

```bash
git clone https://github.com/Turki-Sh/Sarjy.git
cd Sarjy
corepack enable        # once, makes pnpm available
pnpm install
pnpm dev               # then open http://localhost:3000
```

With no keys, Sarjy runs on stand-in providers: typed turns, memory, weather (recorded answers) and the full interface all work, and nothing leaves your machine. Its database lives in `.data/` (delete the folder to start fresh).

To use the real services, create a file named `.env.local` in the project folder (it is git-ignored, never committed):

```bash
SARJY_PROVIDERS=live
GROQ_API_KEY=your-groq-key
ABLY_API_KEY=your-ably-key
```

Restart `pnpm dev` after changing it. `http://localhost:3000/api/health` shows which keys were picked up (true or false, never the values).

| Command | Does |
|---|---|
| `pnpm dev` | The app with live reload, at http://localhost:3000 |
| `pnpm preview` | A production build, then serves it |
| `pnpm test` | Unit and integration tests |
| `pnpm test:e2e` | Browser tests (Playwright) |
| `pnpm check` | Typecheck, lint and tests |

## In one picture

```
 you speak ──► browser detects the end of speech ──► /api/turn ──► Groq Whisper (speech to text)
                                                              ├──► Groq model + tools (weather, memory)
                                                              └──► Groq Orpheus (English or Saudi Arabic voice)
 you hear  ◄── orb, captions and audio in sync     ◄── one stream of events
                                                              └──► in a room, the same events go to everyone (Ably)
```

## Stack

Next.js on Vercel · Groq (Whisper, gpt-oss-120b, Orpheus) · Open-Meteo · Ably · Postgres on Neon · pnpm · Vitest and Playwright

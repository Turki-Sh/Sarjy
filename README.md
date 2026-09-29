# Sarjy · سرجي

A voice assistant that remembers what you tell it, answers from real tools, and shows you everything it keeps.

> Shaped to its rider. على مقاس فارسه.

Sarj is Arabic for saddle; Sarjy means "my saddle". A saddle is fitted to one rider and breaks in to them over time. Tell Sarjy something once, and the next answer fits a little better.

**Status:** planned, building. Live URL coming on Day 1.

## Read the plan

| # | Document | Answers |
|---|---|---|
| 01 | [Product requirements](docs/01-PRD.md) | What we build, for whom, and why weather |
| 02 | [Architecture](docs/02-ARCHITECTURE.md) | How one turn flows from your voice to Sarjy's, and where each piece of code lives |
| 03 | [Implementation plan](docs/03-IMPLEMENTATION-PLAN.md) | The three-day build, milestone by milestone |
| 04 | [Acceptance tests](docs/04-ACCEPTANCE-TESTS.md) | How we know it works, and the demo script |
| 05 | [Deployment](docs/05-DEPLOYMENT.md) | How it ships, and how keys stay secret in a public repo |
| | [Brand](docs/brand/) | The brand book and visual identity: the design source of truth |

## In one picture

```
 you speak ──► browser detects the end of speech ──► /api/turn ──► Groq Whisper (speech to text)
                                                              ├──► Groq model + tools (weather, memory)
                                                              └──► Groq Orpheus (English or Saudi Arabic voice)
 you hear  ◄── orb, captions and audio in sync     ◄── one stream of events
```

## Stack

Next.js on Vercel · Groq (Whisper, gpt-oss, Orpheus) · Open-Meteo · Postgres on Neon · Vitest and Playwright

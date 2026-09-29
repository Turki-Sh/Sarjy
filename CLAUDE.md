# Working agreements for Sarjy

Read `docs/02-ARCHITECTURE.md` before changing code. The plan and progress log is `docs/03-IMPLEMENTATION-PLAN.md`; tick boxes there as work lands.

## Rules

- Never use the em dash character in anything: code, comments, docs, commit messages, UI copy. Use commas, colons, parentheses or a new sentence.
- The repository is public. Secrets are read only in `src/server/env.ts`. Never prefix a secret with `NEXT_PUBLIC_`. Never commit `.env` files.
- `src/client` runs in the browser, `src/server` runs on the server (and imports `server-only`), `src/shared` is plain TypeScript used by both. Keep that split.
- Colors, radii, motion and fonts come from `src/styles/tokens.css`, copied verbatim from `docs/brand/sarjy-visual-identity-v3.md` section 12. Do not add colors anywhere else.
- Sarjy's words follow `docs/brand/sarjy-brand-v3.md` section 5 (answer first, short, numbers said the way people say them, confirm every save, no emoji).
- Use logical CSS properties so Arabic mirrors. The logo never mirrors.
- Tests and offline work use `SARJY_PROVIDERS=fake`. Every new provider or tool gets a fake.
- Write code that a reader can follow top to bottom: small files, one job each, comments that explain why.

# Working agreements for Sarjy

This file is for coding agents and for anyone working on the repository. Read `docs/02-ARCHITECTURE.md` before changing code. The plan and progress log is `docs/03-IMPLEMENTATION-PLAN.md`; tick its boxes as work lands.

## Who decides

Turki's direction overrides everything else, including the brand book in `docs/brand/`. When the brand book and a newer decision in `docs/` disagree, the newer decision wins; note the change in the relevant doc.

## Git

- Commits are authored by the repository owner only. Never add AI attribution of any kind: no `Co-Authored-By` trailers, no session links, no "generated with" lines, in commits, pull requests or code.
- Before committing, check `git config user.name` is `Turki Alshuaibi` and `user.email` is `113216016+Turki-Sh@users.noreply.github.com`.
- Never use the em dash character in anything: code, comments, docs, commit messages, UI copy. Use commas, colons, parentheses or a new sentence.

## Secrets

- The repository is public. Secrets are read only in `src/server/env.ts`. Never prefix a secret with `NEXT_PUBLIC_`. Never commit `.env` files.
- Keys are never pasted into chat, issues or docs. Local keys live in `.env.local`; deployed keys live in Vercel settings.

## Code

- Package manager: pnpm. Never commit `package-lock.json` or `yarn.lock`.
- `src/client` runs in the browser, `src/server` runs on the server (and imports `server-only`), `src/shared` is plain TypeScript used by both. Keep that split.
- Colors, radii, motion and fonts come from `src/styles/tokens.css`, copied from `docs/brand/sarjy-visual-identity-v3.md` section 12. Do not add colors anywhere else.
- Sarjy's words follow `docs/brand/sarjy-brand-v3.md` section 5 (answer first, short, numbers said the way people say them, confirm every save, no emoji).
- Use logical CSS properties so Arabic mirrors. The logo never mirrors.
- Tests and offline work use `SARJY_PROVIDERS=fake`. Every new provider, tool or realtime channel gets a fake.
- Write code a reader can follow top to bottom: small files, one job each, comments that explain why.

## Docs

- `docs/*.md` are the source of truth. `pnpm docs:reader` builds `docs/reader.html` (git-ignored) for reading in a browser. Never edit the generated HTML by hand.

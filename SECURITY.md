# Security

## Reporting a problem

If you find a security issue in Sarjy, please open a private security advisory on this repository (Security, Report a vulnerability) rather than a public issue.

## How secrets are handled

This repository is public, so no secret is ever committed.

- API keys live in Vercel project settings (marked Sensitive) and in each developer's git-ignored `.env.local`. `.env.example` lists the variable names with empty values.
- Only `src/server/env.ts` reads secrets, and it imports `server-only`, so the build fails if browser code imports it. No secret uses the `NEXT_PUBLIC_` prefix.
- The browser never calls a paid provider directly. Realtime connections use short-lived tokens minted by the server.
- CI runs gitleaks on every push and scans the built client bundle for key patterns.
- If a key leaks, it is rotated at the provider first, then replaced in Vercel. Removing a commit is not enough.

## Your data in Sarjy

Sarjy stores the facts you ask it to remember, your chats and your settings, tied to an anonymous signed cookie. Everything it keeps is visible in the app, and Forget or Forget everything deletes it from the database. Logs contain timings and hashed ids, never what you said.

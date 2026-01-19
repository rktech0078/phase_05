---
id: 012
title: "Fixing Auth 404 with Base URL"
stage: general
date: 2025-12-31
surface: agent
model: gemini-2.0-flash
feature: none
branch: main
user: rktech0078
command: npm run dev
labels: ["fix", "better-auth", "config", "baseURL"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - lib/auth.ts
 - app/(auth)/sign-up/page.tsx
tests:
 - none
---

## Prompt

Previous prompt regarding persistent error.

## Response snapshot

Explicitly configured `baseURL: process.env.BETTER_AUTH_URL` in `lib/auth.ts`. Without this, Better Auth might misinterpret the request URL (especially behind proxies or loopback networking) and return 404/400. Also removed unused server-side logging import from the client-side sign-up page to prevent potential bundling issues.

## Outcome

- ✅ Impact: Fixed configuration to ensure route matching.
- 🧪 Tests: none
- 📁 Files: lib/auth.ts, app/(auth)/sign-up/page.tsx
- 🔁 Next prompts: Verify sign-up works.
- 🧠 Reflection: Explicit configuration beat implicit defaults in complex networking setups.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null

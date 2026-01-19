---
id: 007
title: "Fixing Drizzle Constraint Error"
stage: general
date: 2025-12-31
surface: agent
model: gemini-2.0-flash
feature: none
branch: main
user: rktech0078
command: npx drizzle-kit push
labels: ["debugging", "drizzle", "schema-mismatch"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - lib/reset-db.js
tests:
 - none
---

## Prompt

read @[TerminalName: CMD CC, ProcessId: 4056] (Constraint error)

## Response snapshot

Drizzle failed because of a ghost constraint `tasks_user_id_users_id_fk` from the old schema. Created a script `lib/reset-db.js` to drop all tables and allow a fresh `push`.

## Outcome

- ✅ Impact: Provided a way to clean the DB state.
- 🧪 Tests: none
- 📁 Files: lib/reset-db.js
- 🔁 Next prompts: User to run the reset script and then push.
- 🧠 Reflection: Schema changes involving renames often break ORM migrations if the underlying DB state is inconsistent. Nuke-and-pave is best for dev environment.

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null

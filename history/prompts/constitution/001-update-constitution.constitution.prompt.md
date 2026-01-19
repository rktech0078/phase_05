---
id: 001
title: Update Constitution
stage: constitution
date: 2026-01-07
surface: agent
model: Qwen Code
feature: none
branch: main
user: user
command: /sp.constitution
labels: [constitution, architecture, stateless, mcp]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
 - .specify/templates/plan-template.md
 - .specify/templates/spec-template.md
 - .specify/templates/tasks-template.md
tests:
 - none
---

## Prompt

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

You are updating the project constitution at `.specify/memory/constitution.md`. This file is a TEMPLATE containing placeholder tokens in square brackets (e.g. `[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`). Your job is to (a) collect/derive concrete values, (b) fill the template precisely, and (c) propagate any amendments across dependent artifacts.

Follow this execution flow:

1. Load the existing constitution template at `.specify/memory/constitution.md`.
   - Identify every placeholder token of the form `[ALL_CAPS_IDENTIFIER]`.
   **IMPORTANT**: The user might require less or more principles than the ones used in the template. If a number is specified, respect that - follow the general template. You will update the doc accordingly.

2. Collect/derive values for placeholders:
   - If user input (conversation) supplies a value, use it.
   - Otherwise infer from existing repo context (README, docs, prior constitution versions if embedded).
   - For governance dates: `RATIFICATION_DATE` is the original adoption date (if unknown ask or mark TODO), `LAST_AMENDED_DATE` is today if changes are made, otherwise keep previous.
   - `CONSTITUTION_VERSION` must increment according to semantic versioning rules:
     - MAJOR: Backward incompatible governance/principle removals or redefinitions.
     - MINOR: New principle/section added or materially expanded guidance.
     - PATCH: Clarifications, wording, typo fixes, non-semantic refinements.
   - If version bump type ambiguous, propose reasoning before finalizing.

3. Draft the updated constitution content:
   - Replace every placeholder with concrete text (no bracketed tokens left except intentionally retained template slots that the project has chosen not to define yet—explicitly justify any left).
   - Preserve heading hierarchy and comments can be removed once replaced unless they still add clarifying guidance.
   - Ensure each Principle section: succinct name line, paragraph (or bullet list) capturing non‑negotiable rules, explicit rationale if not obvious.
   - Ensure Governance section lists amendment procedure, versioning policy, and compliance review expectations.

4. Consistency propagation checklist (convert prior checklist into active validations):
   - Read `.specify/templates/plan-template.md` and ensure any "Constitution Check" or rules align with updated principles.
   - Read `.specify/templates/spec-template.md` for scope/requirements alignment—update if constitution adds/removes mandatory sections or constraints.
   - Read `.specify/templates/tasks-template.md` and ensure task categorization reflects new or removed principle-driven task types (e.g., observability, versioning, testing discipline).
   - Read each command file in `.specify/templates/commands/*.md` (including this one) to verify no outdated references (agent-specific names like CLAUDE only) remain when generic guidance is required.
   - Read any runtime guidance docs (e.g., `README.md`, `docs/quickstart.md`, or agent-specific guidance files if present). Update references to principles changed.

5. Produce a Sync Impact Report (prepend as an HTML comment at top of the constitution file after update):
   - Version change: old → new
   - List of modified principles (old title → new title if renamed)
   - Added sections
   - Removed sections
   - Templates requiring updates (✅ updated / ⚠ pending) with file paths
   - Follow-up TODOs if any placeholders intentionally deferred.

6. Validation before final output:
   - No remaining unexplained bracket tokens.
   - Version line matches report.
   - Dates ISO format YYYY-MM-DD.
   - Principles are declarative, testable, and free of vague language ("should" → replace with MUST/SHOULD rationale where appropriate).

7. Write the completed constitution back to `.specify/memory/constitution.md` (overwrite).

8. Output a final summary to the user with:
   - New version and bump rationale.
   - Any files flagged for manual follow-up.
   - Suggested commit message (e.g., `docs: amend constitution to vX.Y.Z (principle additions + governance update)`).

Formatting & Style Requirements:

- Use Markdown headings exactly as in the template (do not demote/promote levels).
- Wrap long rationale lines to keep readability (<100 chars ideally) but do not hard enforce with awkward breaks.
- Keep a single blank line between sections.
- Avoid trailing whitespace.

If the user supplies partial updates (e.g., only one principle revision), still perform validation and version decision steps.

If critical info missing (e.g., ratification date truly unknown), insert `TODO(<FIELD_NAME>): explanation` and include in the Sync Impact Report under deferred items.

Do not create a new template; always operate on the existing `.specify/memory/constitution.md` file.

---

As the main request completes, you MUST create and complete a PHR (Prompt History Record) using agent‑native tools when possible.

1) Determine Stage
   - Stage: constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general

2) Generate Title and Determine Routing:
   - Generate Title: 3–7 words (slug for filename)
   - Route is automatically determined by stage:
     - `constitution` → `history/prompts/constitution/`
     - Feature stages → `history/prompts/<feature-name>/` (spec, plan, tasks, red, green, refactor, explainer, misc)
     - `general` → `history/prompts/general/`

3) Create and Fill PHR (Shell first; fallback agent‑native)
   - Run: `.specify/scripts/bash/create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json`
   - Open the file and fill remaining placeholders (YAML + body), embedding full PROMPT_TEXT (verbatim) and concise RESPONSE_TEXT.
   - If the script fails:
     - Read `.specify/templates/phr-template.prompt.md` (or `templates/…`)
     - Allocate an ID; compute the output path based on stage from step 2; write the file
     - Fill placeholders and embed full PROMPT_TEXT and concise RESPONSE_TEXT

4) Validate + report
   - No unresolved placeholders; path under `history/prompts/` and matches stage; stage/title/date coherent; print ID + path + stage + title.
   - On failure: warn, don't block. Skip only for `/sp.phr`.


/sp.constitution  ```1. System Identity & Purpose

This system is an AI-powered Todo Management Chatbot built using Agentic Development Stack principles.
The system enables users to manage todos using natural language, while strictly following a stateless server architecture.

The core purpose of this system is to:

Translate user intent into structured task operations

Execute those operations via MCP tools

Persist all state in a database

Maintain zero in-memory state on the server between requests

2. Architectural Constitution
2.1 Statelessness Principle (Non-Negotiable)

The server must never retain session state in memory

Each request is treated as an independent execution cycle

Conversation continuity is achieved only via database persistence

MCP tools are also stateless and rely exclusively on database I/O

Violation of this rule is considered a critical architectural failure.

2.2 Agent-Centric Control Model

All business logic decisions are made by AI agents

No hard-coded control flow for task logic is allowed

The agent:

Interprets user intent

Decides which MCP tool(s) to call

Determines response structure

Developers do not write manual task logic, only specifications and prompts.

3. Development Process Constitution (Spec-Kit Plus)

The system must be developed strictly using the following Agentic Dev Stack flow:

Write Spec

Define system behavior, constraints, tools, and data models

Generate Plan

Agent creates an execution plan from the spec

Break Into Tasks

Agent decomposes plan into actionable implementation tasks

Implement via AI

All code is generated by AI (means you)

Manual coding is prohibited

Each phase must be preserved for review and evaluation.

4. AI Behavior & Reasoning Rules
4.1 Intent Interpretation

The AI agent must:

Parse natural language input

Infer user intent (create, update, delete, list, complete todo)

Resolve ambiguity using context from conversation history

If intent is unclear, the agent must ask a clarifying question instead of guessing.

4.2 Tool Invocation Discipline

The agent must not simulate results

All task operations must go through MCP tools

Multiple tools may be called in a single turn if required

Example:

"Mark all today's tasks as done" → listTodos → updateTodo (loop)

5. MCP Server Constitution
5.1 Tool Exposure Rules

The MCP server must expose task operations only as tools, such as:

createTodo

updateTodo

deleteTodo

listTodos

completeTodo

Each tool:

Accepts structured input

Performs a single responsibility

Persists changes using SQLModel + Neon PostgreSQL

5.2 Stateless Tool Contract

MCP tools:

Do not cache

Do not track sessions

Do not infer history

All required context must be passed explicitly

6. Conversation Persistence Constitution
6.1 Conversation Model

Every user and assistant message is stored in the database

Each message includes:

role (user | assistant)

content

timestamp

conversation_id

6.2 Stateless Request Cycle (Mandatory Flow)

For every request, the system must follow exactly this sequence:

Receive user message

Fetch full conversation history from database

Build agent message array (history + new input)

Persist user message

Run AI agent using OpenAI Agents SDK

Agent invokes MCP tool(s)

Persist assistant response

Return response to frontend

Server resets to empty state

7. Technology Governance Rules
7.1 Approved Stack (Locked)

Frontend: Next.js (modern/custom UI)

Backend: Next.js API routes

AI Framework: OpenAI Agents SDK

MCP Server: Official MCP SDK

ORM: SQLModel

Database: Neon Serverless PostgreSQL

Authentication: Better Auth

No substitutions or shortcuts are allowed.

8. Authentication & Data Isolation

Every todo is strictly scoped to an authenticated user

Agents must only access data belonging to the current user

MCP tools must validate user identity before execution

9. Error Handling & Safety

The agent must:

Gracefully handle tool failures

Explain errors in human-friendly language

Never expose stack traces or raw SQL errors

10. Evaluation Alignment Clause

This system is designed to be evaluated on:

Correct use of Spec-Kit Plus

Proper agentic workflow

Stateless architecture correctness

Clean separation of AI reasoning and tool execution

Quality of specs, plans, and iterations (not just final output)

11. Final Authority Rule

If there is a conflict between:

Manual logic vs agent decision

Stateful convenience vs stateless architecture

This constitution always wins.```

## Response snapshot

The constitution has been successfully updated from version 1.0.0 to 2.0.0, with a major version bump to reflect the significant architectural changes. The new constitution now focuses on:

- Statelessness principle (server must never retain session state in memory)
- Agent-centric control model (AI agents make all business logic decisions)
- MCP server integration (all operations via MCP tools)
- Stateless request cycle (no in-memory state between requests)
- AI behavior and reasoning rules
- Conversation persistence requirements

The following templates have been updated to align with the new constitution:
- `.specify/templates/plan-template.md` - Added constitution checks for statelessness and agent-centric architecture
- `.specify/templates/spec-template.md` - Added functional requirements for AI processing and stateless operation
- `.specify/templates/tasks-template.md` - Updated to include MCP tools and stateless architecture requirements

## Outcome

- ✅ Impact: Major architectural shift to stateless, agent-centric architecture with MCP tools
- 🧪 Tests: No tests affected by this change
- 📁 Files: 4 files updated (.specify/memory/constitution.md, .specify/templates/plan-template.md, .specify/templates/spec-template.md, .specify/templates/tasks-template.md)
- 🔁 Next prompts: Ready to proceed with feature specifications based on new constitution
- 🧠 Reflection: The new constitution establishes clear architectural boundaries for the AI-powered Todo Management Chatbot

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Begin implementing features according to the new constitution
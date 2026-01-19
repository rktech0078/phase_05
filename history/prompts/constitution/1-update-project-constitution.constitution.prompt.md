---
id: 1
title: Update Project Constitution
stage: constitution
date: 2025-12-30
surface: agent
model: Qwen Code
feature: none
branch: main
user: user
command: /sp.constitution
labels: ["constitution", "setup", "governance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
 - history/prompts/constitution/1-update-project-constitution.constitution.prompt.md
tests:
 - none
---

## Prompt

```
/sp.constitution ```# CONSTITUTION.md

## Project Name
Todo Full-Stack Web Application  
(Next.js App Router Based)

---

## Purpose
The purpose of this project is to build a **modern, full-stack, multi-user Todo web application** using **spec-driven development**.

The entire system is built using **AI-assisted development** with **no manual coding**.
Both frontend and backend are implemented within a **single Next.js framework**.

---

## Core Rule
- No code will be written manually
- All code must be generated using **AI via Qwen Code CLI**
- The developer is only responsible for:
  - writing specifications
  - reviewing AI-generated output
  - refining prompts when needed

---

## Development Philosophy
This project follows **Spec-Kit Plus** principles:

- Specifications come first
- Specifications control implementation
- Code must always match specifications
- AI is treated as the implementation agent

Specifications are the **single source of truth**.

---

## Architecture Decision
This project uses a **single-framework full-stack architecture**.

- Frontend and backend are both implemented in **Next.js App Router**
- Backend logic is implemented using **Next.js Route Handlers**
- No separate backend framework or service is used

---

## Authentication Rule
- Authentication is mandatory
- **Better Auth** is used for user signup and signin
- Authentication runs inside Next.js
- Backend route handlers must verify authenticated users
- Users can only access their own data

---

## Data Storage Rule
- Persistent storage is required
- Database: **Neon Serverless PostgreSQL**
- SQL-based ORM is used
- No in-memory or temporary storage is allowed

---

## Functional Scope
The application must support the following features:

- Create tasks
- View tasks
- Update tasks
- Delete tasks
- Mark tasks complete or incomplete

All features must work for **authenticated users only**.

---

## API Design Rule
- APIs are implemented using **Next.js Route Handlers**
- REST-style endpoints are used
- All API routes must be secured
- User identity must be verified on every request

---

## UI Requirements
- Clean and modern interface
- Responsive design
- Clear feedback for user actions
- Errors and success messages must be user-friendly

---

## Development Workflow
The following **Agentic Dev Stack workflow** must be followed:

1. Write specifications
2. Generate plan using AI
3. Break plan into tasks
4. Implement using AI (Qwen Code CLI)
5. Review output against specifications

---

## Technology Stack
- Framework: Next.js 16+ (App Router)
- Backend APIs: Next.js Route Handlers
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth
- Spec-Driven Development: AI + Spec-Kit Plus

---

## Success Criteria
The project is considered successful when:

- The full-stack application works in a single framework
- Authentication is correctly enforced
- APIs are secure and user-scoped
- Data is stored persistently
- Specifications clearly guide the implementation
- AI-driven workflow is visible and traceable

---
```
```

## Response snapshot

# Todo Full-Stack Web Application Constitution

## Core Principles

### AI-Assisted Development
All code must be generated using AI via Qwen Code CLI; No manual coding is allowed; The developer is only responsible for writing specifications, reviewing AI-generated output, and refining prompts when needed.

### Spec-Driven Development
Specifications come first and control implementation; Code must always match specifications; Specifications are the single source of truth; AI is treated as the implementation agent.

### Full-Stack Next.js Architecture
Frontend and backend are both implemented in Next.js App Router; Backend logic is implemented using Next.js Route Handlers; No separate backend framework or service is used; Single-framework approach for simplicity and maintainability.

### Mandatory Authentication
Authentication is mandatory for all features; Better Auth is used for user signup and signin; Authentication runs inside Next.js; Backend route handlers must verify authenticated users; Users can only access their own data.

### Persistent Data Storage
Persistent storage is required using Neon Serverless PostgreSQL; SQL-based ORM is used; No in-memory or temporary storage is allowed; Data must be reliably stored and retrieved.

### Secure API Design
APIs are implemented using Next.js Route Handlers; REST-style endpoints are used; All API routes must be secured; User identity must be verified on every request; Security is paramount in all implementations.

## Technology Stack Requirements
The project must use the following technology stack:
- Framework: Next.js 16+ (App Router)
- Backend APIs: Next.js Route Handlers
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth
- Spec-Driven Development: AI + Spec-Kit Plus
- All components must integrate seamlessly within the Next.js ecosystem.

## Development Workflow
The following Agentic Dev Stack workflow must be followed:
1. Write specifications using Spec-Kit Plus methodology
2. Generate plan using AI
3. Break plan into tasks
4. Implement using AI (Qwen Code CLI)
5. Review output against specifications
6. Validate implementation against success criteria
This workflow ensures traceability and quality in AI-assisted development.

## Governance
This constitution supersedes all other development practices and must be followed strictly. Amendments require proper documentation and approval. All implementations must verify compliance with these principles. The project is considered successful when the full-stack application works in a single framework, authentication is correctly enforced, APIs are secure and user-scoped, data is stored persistently, specifications clearly guide the implementation, and the AI-driven workflow is visible and traceable.

**Version**: 1.0.0 | **Ratified**: 2025-06-13 | **Last Amended**: 2025-12-30

## Outcome

- ✅ Impact: Created project constitution with 6 core principles and governance rules
- 🧪 Tests: none
- 📁 Files: Updated .specify/memory/constitution.md, created history/prompts/constitution/1-update-project-constitution.constitution.prompt.md
- 🔁 Next prompts: Build Specification using /sp.specify
- 🧠 Reflection: Constitution successfully created with all required principles from user input

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
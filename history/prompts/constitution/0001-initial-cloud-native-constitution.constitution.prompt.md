---
id: 0001
title: Initial Cloud-Native Constitution
stage: constitution
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: main
user: system
command: /sp.constitution
labels: ["constitution", "cloud-native", "event-driven", "dapr", "kubernetes", "agentic-development"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

```
/sp.const

You are an autonomous senior cloud-native architect and agentic developer.

TECH STACK (FIXED):
- Frontend: Next.js (App Router) + TypeScript
- Backend: Node.js + TypeScript microservices
- Containerization: Docker
- Orchestration: Kubernetes
- Cloud Provider: Oracle Cloud Infrastructure (OKE – Always Free)
- Event Backbone: Kafka-compatible (Redpanda Cloud)
- Distributed Runtime: Dapr
- CI/CD: GitHub Actions
- Packaging: Helm charts (extend Phase IV charts)

HARD CONSTRAINTS:
- Agentic Dev Stack ONLY: Spec → Plan → Tasks → Implement
- NO manual coding by the user
- All services MUST communicate via Dapr (no direct Kafka clients)
- Event-driven architecture is mandatory
- Deploy locally to Minikube BEFORE cloud
- Production deployment MUST be Oracle OKE
- Dapr MUST use full feature set:
  - Pub/Sub
  - State Store
  - Bindings (Cron)
  - Secrets
  - Service Invocation
- Kafka MUST be external (Redpanda Cloud preferred)
- Observability (logs + metrics) is required
- Output must be copy/paste ready

GOAL:
Deliver a production-grade, cloud-native, event-driven Todo Chatbot system
that satisfies Phase V hackathon evaluation criteria.
```

## Response snapshot

Created comprehensive project constitution (v1.0.0) defining eight core principles for cloud-native, event-driven Todo Chatbot development:

1. **Event-Driven Architecture (MANDATORY)**: All inter-service communication via Dapr pub/sub, no direct HTTP/Kafka clients
2. **Dapr-First Communication (NON-NEGOTIABLE)**: Mandatory use of Dapr for pub/sub, state store, service invocation, bindings, and secrets
3. **Agentic Development Workflow (MANDATORY)**: Spec → Plan → Tasks → Implement workflow, no manual coding
4. **Local-First Deployment (MANDATORY)**: Minikube validation before cloud deployment
5. **Observability (NON-NEGOTIABLE)**: Structured logging, metrics, tracing, health checks
6. **Cloud-Native Patterns (MANDATORY)**: Stateless design, 12-factor, horizontal scalability
7. **Production-Grade Quality (NON-NEGOTIABLE)**: Type safety, error handling, security, no placeholders
8. **Testing Discipline (CONDITIONAL)**: TDD when tests requested

Fixed technology stack: Next.js 16+, Node.js 18+, Docker, Kubernetes (Minikube/OKE), Dapr 1.12+, Redpanda Cloud, Helm 3.x, Neon PostgreSQL.

Constitution includes technical constraints, security requirements, development workflow (PHR/ADR processes), and governance (amendment process, compliance review, versioning policy).

## Outcome

- ✅ Impact: Established foundational governance for Phase V hackathon project with clear architectural constraints and quality standards
- 🧪 Tests: N/A (constitution document)
- 📁 Files: Created .specify/memory/constitution.md (v1.0.0, 206 lines)
- 🔁 Next prompts: /sp.specify to define first feature, /sp.plan to design architecture
- 🧠 Reflection: Constitution successfully captures all hard constraints from user input, enforces event-driven + Dapr-first architecture, and establishes agentic development workflow as mandatory

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (initial constitution)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A

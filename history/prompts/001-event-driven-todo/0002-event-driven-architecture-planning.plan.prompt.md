---
id: 0002
title: Event-Driven Architecture Planning
stage: plan
date: 2026-01-19
surface: agent
model: claude-sonnet-4-5-20250929
feature: 001-event-driven-todo
branch: 001-event-driven-todo
user: system
command: /sp.plan
labels: ["plan", "architecture", "microservices", "event-driven", "dapr", "kafka", "kubernetes"]
links:
  spec: specs/001-event-driven-todo/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/001-event-driven-todo/plan.md
  - specs/001-event-driven-todo/research.md
  - specs/001-event-driven-todo/data-model.md
  - specs/001-event-driven-todo/quickstart.md
  - specs/001-event-driven-todo/contracts/events.yaml
  - specs/001-event-driven-todo/contracts/task-service.yaml
  - specs/001-event-driven-todo/contracts/audit-service.yaml
  - specs/001-event-driven-todo/contracts/sync-service.yaml
  - specs/001-event-driven-todo/contracts/recurring-service.yaml
  - specs/001-event-driven-todo/contracts/notification-service.yaml
  - CLAUDE.md
tests:
  - none
---

## Prompt

```
/sp.plan
```

## Response snapshot

Completed comprehensive implementation planning for Event-Driven Todo Chatbot Platform with microservices architecture:

**Phase 0 - Research (research.md)**:
- Dapr SDK integration patterns (@dapr/dapr with HTTP subscriptions)
- Kafka topic design (3 topics: task-events, reminders, task-updates with CloudEvents format)
- WebSocket scalability (Redis pub/sub for horizontal scaling)
- State store selection (Redis for performance and dual-use with pub/sub)
- Recurring task scheduling (Dapr cron binding + event-driven generation)
- Observability stack (Prometheus + Grafana + Jaeger)
- Database migration strategy (Drizzle ORM with additive-only changes)
- Oracle OKE deployment (Always Free tier with ARM-based Ampere A1 instances)

**Phase 1 - Design Artifacts**:

1. **Data Model (data-model.md)**: Extended schema with 4 entities
   - Task (extended): priority, tags, dueDate, recurrencePattern
   - Reminder (new): scheduled notifications with retry logic
   - AuditLogEntry (new): complete activity trail with change tracking
   - User (existing): no changes, relationships defined

2. **API Contracts (contracts/)**: 6 service specifications
   - events.yaml: 9 CloudEvents schemas (TaskCreated, TaskUpdated, TaskCompleted, TaskDeleted, ReminderScheduled, ReminderTriggered, ReminderDelivered, ReminderFailed, RecurringTaskGenerated)
   - task-service.yaml: OpenAPI 3.0 spec with CRUD endpoints, search, filtering
   - notification-service.yaml: Reminder management API
   - recurring-service.yaml: Recurrence preview API
   - audit-service.yaml: Audit log query API
   - sync-service.yaml: WebSocket protocol specification

3. **Quickstart Guide (quickstart.md)**: Complete local deployment guide
   - Prerequisites (Docker, Minikube, Helm, Dapr CLI, Node.js)
   - 11-step setup process (Minikube, Dapr, Redis, Redpanda, components, images, secrets, Helm, verification, access, dashboard)
   - Troubleshooting section with common issues
   - Cleanup and next steps

4. **Implementation Plan (plan.md)**: Comprehensive architecture document
   - Microservices decomposition (6 services: frontend, task, notification, recurring, audit, sync)
   - Constitution compliance check (all 8 principles satisfied)
   - Project structure (services/, shared/, infrastructure/, migrations/, docs/)
   - Technology context (TypeScript 5, Node.js 18+, Dapr SDK, Next.js 16.1.1, Redis, Kafka/Redpanda)
   - Performance goals (1000 concurrent users, <1s operations, <2s sync, 99.9% uptime)
   - 5 ADR suggestions for architectural decisions

**Architecture Highlights**:
- Event-driven communication via Dapr pub/sub over Kafka (Redpanda Cloud)
- Horizontal scalability with stateless services
- Redis for state store and WebSocket broadcast
- CloudEvents 1.0 format for all events
- Partition by userId for ordering guarantees
- Zero-downtime database migrations
- Local-first deployment (Minikube → Oracle OKE)

**Agent Context Updated**: CLAUDE.md updated with new technologies (Dapr, Redpanda, Redis state store, WebSocket, microservices patterns)

## Outcome

- ✅ Impact: Completed comprehensive implementation plan for transforming monolithic Next.js app into production-grade event-driven microservices platform with 6 services, Dapr integration, and Kubernetes deployment strategy
- 🧪 Tests: N/A (planning phase - no code tests)
- 📁 Files: Created 11 files (plan.md, research.md, data-model.md, quickstart.md, 6 API contracts, updated CLAUDE.md)
- 🔁 Next prompts: /sp.tasks to generate task breakdown, then /sp.implement to execute implementation
- 🧠 Reflection: Planning successfully addresses all constitutional requirements (event-driven, Dapr-first, local-first deployment, observability, cloud-native patterns, production-grade quality). Architecture balances service granularity with operational complexity (6 services vs monolith or 10+ services). Technology decisions are well-researched with clear rationale and alternatives considered. Ready for task generation and implementation.

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Constitution Check PASSED - all 8 principles satisfied
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A

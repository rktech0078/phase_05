# Implementation Plan: Event-Driven Todo Chatbot Platform

**Branch**: `001-event-driven-todo` | **Date**: 2026-01-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-event-driven-todo/spec.md`

## Summary

Transform the existing monolithic Next.js todo application into a production-grade, event-driven microservices platform using Dapr and Kafka. The system will support advanced task management features (recurring tasks, reminders, priorities, tags, due dates), real-time synchronization across devices, and comprehensive audit trails. All services will communicate via Dapr pub/sub over Redpanda Cloud (Kafka-compatible), with deployment to Minikube (local) and Oracle Kubernetes Engine (production).

**Key Transformation**:
- **From**: Monolithic Next.js app with direct database access
- **To**: 6 microservices communicating via events, Dapr-managed state, horizontal scalability

## Technical Context

**Language/Version**: TypeScript 5 (strict mode) / Node.js 18+
**Primary Dependencies**: Next.js 16.1.1, Dapr SDK (Node.js), Drizzle ORM 0.45.1, Better Auth 1.4.9, ws (WebSocket), ioredis (Dapr state store)
**Storage**: Neon Serverless PostgreSQL (existing, external), Dapr State Store (Redis for task metadata), Kafka/Redpanda Cloud (event backbone)
**Testing**: Vitest 4.0.16, Testing Library (optional per constitution)
**Target Platform**: Kubernetes (Minikube for local development, Oracle OKE Always Free for production)
**Project Type**: Microservices (web application with event-driven backend services)
**Performance Goals**: 1,000 concurrent users, <1s task operations, <2s cross-device sync, 99% reminder delivery within 1 minute
**Constraints**: <2s p95 latency for task operations, <512Mi memory per service, 99.9% uptime, zero data loss
**Scale/Scope**: 10,000 tasks per user, 1,000 concurrent users, 6 microservices, 3 Kafka topics, 4 Dapr components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ I. Event-Driven Architecture (MANDATORY)
- **Status**: PASS (by design)
- **Implementation**: All inter-service communication via Dapr pub/sub over Kafka topics (task-events, reminders, task-updates)
- **Validation**: No direct HTTP calls between services; all state changes emit events

### ✅ II. Dapr-First Communication (NON-NEGOTIABLE)
- **Status**: PASS (by design)
- **Implementation**:
  - Pub/Sub: Kafka component for event publishing/subscription
  - State Store: Redis component for task metadata caching
  - Bindings: Cron binding for reminder scheduling
  - Secrets: Kubernetes secrets for Kafka credentials, database URLs
  - Service Invocation: Used only for synchronous queries when unavoidable
- **Validation**: No direct Kafka clients, Redis clients, or database connections bypassing Dapr (except initial seeding)

### ✅ III. Agentic Development Workflow (MANDATORY)
- **Status**: PASS (in progress)
- **Implementation**: Following Spec → Plan → Tasks → Implement workflow
- **Validation**: spec.md complete, plan.md in progress, tasks.md next, implementation via /sp.implement

### ✅ IV. Local-First Deployment (MANDATORY)
- **Status**: PASS (by design)
- **Implementation**: Minikube deployment with same Helm charts as production; only environment-specific values differ
- **Validation**: All services must run on Minikube before OKE deployment

### ✅ V. Observability (NON-NEGOTIABLE)
- **Status**: PASS (by design)
- **Implementation**:
  - Structured logging: JSON format with correlation IDs (winston or pino)
  - Metrics: Prometheus format via /metrics endpoint (prom-client)
  - Tracing: Dapr distributed tracing (Zipkin/Jaeger compatible)
  - Health checks: /health (liveness), /ready (readiness) on all services
  - Graceful shutdown: SIGTERM handling with connection draining
- **Validation**: All services expose metrics, logs include correlation IDs, traces span service boundaries

### ✅ VI. Cloud-Native Patterns (MANDATORY)
- **Status**: PASS (by design)
- **Implementation**:
  - Stateless design: State in Dapr state store, not in-memory
  - 12-factor: Config via environment, logs to stdout, disposable processes
  - Containerized: Docker multi-stage builds for all services
  - Declarative: Kubernetes manifests + Helm charts
  - Horizontal scalability: No single-instance assumptions, replica count configurable
  - Fail-fast: Circuit breakers via Dapr resiliency policies
- **Validation**: Services can scale to N replicas without coordination

### ✅ VII. Production-Grade Quality (NON-NEGOTIABLE)
- **Status**: PASS (by design)
- **Implementation**:
  - Type safety: TypeScript strict mode enabled
  - Error handling: Try-catch blocks, error boundaries, graceful degradation
  - Input validation: Zod schemas at service boundaries
  - Security: No hardcoded secrets, least privilege service accounts, network policies
  - Resource limits: CPU/memory limits defined in Helm values
  - Graceful degradation: Services continue operating if non-critical dependencies fail
- **Validation**: No placeholders, TODOs, or incomplete implementations in delivered code

### ✅ VIII. Testing Discipline (CONDITIONAL)
- **Status**: PASS (tests optional per spec)
- **Implementation**: Tests not explicitly requested in spec.md, therefore optional
- **Validation**: If tests added later, must follow TDD (write → fail → implement → pass)

### Constitution Compliance Summary
**Overall Status**: ✅ PASS - All constitutional requirements satisfied by design

## Project Structure

### Documentation (this feature)

```text
specs/001-event-driven-todo/
├── plan.md              # This file (/sp.plan command output)
├── spec.md              # Feature specification (complete)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
│   ├── events.yaml      # Event schemas (CloudEvents format)
│   ├── task-service.yaml        # Task Service API (OpenAPI 3.0)
│   ├── notification-service.yaml # Notification Service API
│   ├── recurring-service.yaml   # Recurring Task Service API
│   ├── audit-service.yaml       # Audit Service API
│   └── sync-service.yaml        # Sync Service API (WebSocket)
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
# Microservices Architecture

services/
├── frontend/                    # Next.js 16+ frontend (existing app/ directory)
│   ├── app/                     # App Router pages and API routes
│   │   ├── (auth)/              # Authentication pages
│   │   ├── dashboard/           # Main dashboard
│   │   ├── tasks/               # Task management pages
│   │   └── api/                 # API routes (proxy to services)
│   ├── components/              # React components
│   ├── lib/                     # Client utilities
│   ├── Dockerfile               # Multi-stage build
│   └── package.json
│
├── task-service/                # Core task CRUD operations
│   ├── src/
│   │   ├── handlers/            # Event handlers (TaskCreated, TaskUpdated, etc.)
│   │   ├── api/                 # HTTP API endpoints
│   │   ├── models/              # Task entity, validation schemas
│   │   ├── dapr/                # Dapr client initialization
│   │   ├── db/                  # Database connection (Drizzle ORM)
│   │   └── index.ts             # Service entry point
│   ├── Dockerfile
│   └── package.json
│
├── notification-service/        # Reminder notifications
│   ├── src/
│   │   ├── handlers/            # Event handlers (ReminderScheduled, TaskCompleted)
│   │   ├── scheduler/           # Cron job for reminder checks
│   │   ├── notifiers/           # Push notification delivery
│   │   ├── dapr/                # Dapr client (pub/sub, bindings)
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
│
├── recurring-service/           # Recurring task automation
│   ├── src/
│   │   ├── handlers/            # Event handlers (TaskCompleted with recurrence)
│   │   ├── generators/          # Next task instance generation
│   │   ├── patterns/            # Recurrence pattern logic (daily, weekly, monthly)
│   │   ├── dapr/                # Dapr client
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
│
├── audit-service/               # Activity audit trail
│   ├── src/
│   │   ├── handlers/            # Event handlers (all task-events)
│   │   ├── api/                 # Query API for audit logs
│   │   ├── models/              # AuditLogEntry entity
│   │   ├── db/                  # Database connection
│   │   ├── dapr/                # Dapr client
│   │   └── index.ts
│   ├── Dockerfile
│   └── package.json
│
└── sync-service/                # Real-time WebSocket synchronization
    ├── src/
    │   ├── handlers/            # Event handlers (task-updates topic)
    │   ├── websocket/           # WebSocket server (ws library)
    │   ├── connections/         # Connection management (userId → sockets)
    │   ├── dapr/                # Dapr client
    │   └── index.ts
    ├── Dockerfile
    └── package.json

# Shared libraries
shared/
├── types/                       # Shared TypeScript types
│   ├── events.ts                # Event type definitions
│   ├── entities.ts              # Entity interfaces
│   └── api.ts                   # API request/response types
├── schemas/                     # Database schemas (Drizzle ORM)
│   └── index.ts                 # Tasks, Users, AuditLogs, Reminders
└── utils/                       # Shared utilities
    ├── logger.ts                # Structured logging (winston/pino)
    ├── validation.ts            # Zod schemas
    └── correlation.ts           # Correlation ID generation

# Infrastructure
infrastructure/
├── dapr/
│   ├── components/
│   │   ├── pubsub-kafka.yaml    # Kafka pub/sub component (Redpanda Cloud)
│   │   ├── statestore-redis.yaml # Redis state store component
│   │   ├── binding-cron.yaml    # Cron binding for reminders
│   │   └── secrets-k8s.yaml     # Kubernetes secrets component
│   ├── subscriptions/
│   │   ├── task-service-sub.yaml        # Task service subscriptions
│   │   ├── notification-service-sub.yaml
│   │   ├── recurring-service-sub.yaml
│   │   ├── audit-service-sub.yaml
│   │   └── sync-service-sub.yaml
│   └── resiliency/
│       └── default.yaml         # Circuit breaker, retry policies
│
├── kubernetes/
│   ├── namespace.yaml           # todo-platform namespace
│   ├── deployments/
│   │   ├── frontend.yaml        # Frontend deployment + Dapr sidecar
│   │   ├── task-service.yaml
│   │   ├── notification-service.yaml
│   │   ├── recurring-service.yaml
│   │   ├── audit-service.yaml
│   │   └── sync-service.yaml
│   ├── services/
│   │   ├── frontend.yaml        # LoadBalancer/NodePort
│   │   ├── task-service.yaml    # ClusterIP
│   │   ├── notification-service.yaml
│   │   ├── recurring-service.yaml
│   │   ├── audit-service.yaml
│   │   └── sync-service.yaml
│   ├── configmaps/
│   │   └── app-config.yaml      # Shared configuration
│   ├── secrets/
│   │   └── app-secrets.yaml     # Kafka credentials, DB URLs (sealed)
│   └── networkpolicies/
│       └── default-deny.yaml    # Network isolation
│
└── helm/
    └── todo-platform/           # Umbrella chart
        ├── Chart.yaml
        ├── values.yaml          # Default values
        ├── values-minikube.yaml # Local overrides
        ├── values-oke.yaml      # Production overrides
        └── templates/
            ├── _helpers.tpl
            ├── deployments/     # All service deployments
            ├── services/        # All service services
            ├── dapr/            # Dapr components
            └── NOTES.txt

# Database migrations
migrations/
├── 001_add_task_fields.sql      # Add priority, tags, dueDate, recurrencePattern
├── 002_create_reminders.sql     # Reminders table
└── 003_create_audit_logs.sql    # Audit logs table

# Documentation
docs/
├── architecture.md              # System architecture diagram
├── event-flows.md               # Event flow diagrams
├── deployment-minikube.md       # Local deployment guide
├── deployment-oke.md            # Production deployment guide
└── troubleshooting.md           # Common issues and solutions
```

**Structure Decision**: Microservices architecture with 6 services (frontend + 5 backend services). Each service is independently deployable with its own Dockerfile and package.json. Shared code (types, schemas, utilities) is in a `shared/` directory. Infrastructure as code (Dapr components, Kubernetes manifests, Helm charts) is in `infrastructure/`. This structure supports independent development, testing, and deployment of each service while maintaining consistency through shared libraries.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. All constitutional requirements are satisfied by the proposed architecture.

## Phase 0: Research & Technology Decisions

### Research Tasks

The following research tasks will be executed to resolve technical unknowns and establish best practices:

1. **Dapr SDK Integration Patterns**
   - Research: Best practices for Dapr SDK in Node.js/TypeScript microservices
   - Focus: Pub/sub patterns, state management, error handling, testing strategies
   - Output: Recommended patterns for service initialization, event publishing, subscription handling

2. **Kafka Topic Design**
   - Research: Event schema design for task management domain
   - Focus: CloudEvents format, topic partitioning strategies, event versioning
   - Output: Topic naming conventions, partition key strategies, schema evolution approach

3. **WebSocket Scalability**
   - Research: WebSocket connection management in Kubernetes with multiple replicas
   - Focus: Sticky sessions, connection draining, Redis pub/sub for broadcast
   - Output: Architecture for scaling WebSocket service horizontally

4. **Dapr State Store Selection**
   - Research: Redis vs PostgreSQL as Dapr state store for task metadata
   - Focus: Performance, consistency guarantees, operational complexity
   - Output: Recommended state store with justification

5. **Recurring Task Scheduling**
   - Research: Cron-based vs event-driven scheduling for recurring tasks
   - Focus: Dapr cron binding vs custom scheduler, reliability, scalability
   - Output: Recommended approach for reminder and recurring task scheduling

6. **Observability Stack**
   - Research: Prometheus + Grafana + Jaeger setup for Kubernetes
   - Focus: Dapr metrics integration, custom metrics, dashboard templates
   - Output: Observability stack configuration and deployment manifests

7. **Database Schema Migration Strategy**
   - Research: Zero-downtime migrations for adding task fields (priority, tags, dueDate, recurrence)
   - Focus: Drizzle ORM migration patterns, backward compatibility
   - Output: Migration scripts and rollback procedures

8. **Oracle OKE Deployment**
   - Research: Oracle Kubernetes Engine Always Free tier limitations and best practices
   - Focus: Resource limits, persistent volumes, LoadBalancer configuration
   - Output: OKE-specific Helm values and deployment guide

**Output**: `research.md` with consolidated findings and decisions

## Phase 1: Design Artifacts

### 1. Data Model (`data-model.md`)

**Entities to be designed**:

- **Task** (extended from existing schema)
  - New fields: priority (enum: low, medium, high), tags (array), dueDate (timestamp), recurrencePattern (enum: none, daily, weekly, monthly)
  - Relationships: belongsTo User, hasMany AuditLogEntries, hasMany Reminders

- **Reminder**
  - Fields: id, taskId, userId, reminderTime, deliveryStatus (enum: pending, delivered, failed), retryCount, createdAt
  - Relationships: belongsTo Task, belongsTo User

- **AuditLogEntry**
  - Fields: id, taskId, userId, action (enum: created, updated, completed, deleted), changes (jsonb), timestamp, correlationId
  - Relationships: belongsTo Task, belongsTo User

- **User** (existing, no changes)
  - Relationships: hasMany Tasks, hasMany Reminders, hasMany AuditLogEntries

**State Transitions**:
- Task: incomplete → complete → incomplete (toggle)
- Reminder: pending → delivered | failed (with retry logic)
- Recurring Task: complete → generates new task instance

### 2. API Contracts (`contracts/`)

**Event Schemas** (`events.yaml` - CloudEvents format):
- TaskCreated, TaskUpdated, TaskCompleted, TaskDeleted
- ReminderScheduled, ReminderTriggered, ReminderDelivered, ReminderFailed
- RecurringTaskGenerated
- AuditLogCreated

**Service APIs** (OpenAPI 3.0):
- `task-service.yaml`: CRUD endpoints for tasks
- `notification-service.yaml`: Reminder configuration endpoints
- `recurring-service.yaml`: Recurrence pattern management
- `audit-service.yaml`: Audit log query endpoints
- `sync-service.yaml`: WebSocket connection protocol

### 3. Quickstart Guide (`quickstart.md`)

**Sections**:
1. Prerequisites (Docker, Minikube, Helm, Dapr CLI)
2. Local Development Setup
   - Start Minikube
   - Install Dapr on Minikube
   - Deploy Redis (Dapr state store)
   - Deploy Redpanda (Kafka alternative for local)
   - Build Docker images
   - Deploy with Helm
3. Verify Deployment
   - Check pod status
   - Test health endpoints
   - Create a task via API
   - Verify event flow in Dapr logs
4. Access Application
   - Frontend URL
   - API endpoints
   - Dapr dashboard
5. Troubleshooting
   - Common issues and solutions

### 4. Agent Context Update

Run `.specify/scripts/bash/update-agent-context.sh claude` to update `CLAUDE.md` with:
- New technologies: Dapr 1.12+, Redpanda Cloud, Redis (state store), WebSocket (ws library)
- New services: task-service, notification-service, recurring-service, audit-service, sync-service
- Event-driven architecture patterns

## Next Steps

After Phase 1 completion:

1. **Run `/sp.tasks`** to generate task breakdown (tasks.md) organized by user story
2. **Run `/sp.implement`** to execute tasks autonomously
3. **Local Deployment**: Deploy to Minikube and verify all event flows
4. **Production Deployment**: Deploy to Oracle OKE with production Helm values
5. **Validation**: Verify all success criteria from spec.md are met

## Architecture Decision Records (ADRs)

The following architectural decisions should be documented as ADRs (suggest after Phase 1):

1. **ADR-001: Microservices Decomposition Strategy**
   - Decision: 6 services (frontend, task, notification, recurring, audit, sync)
   - Alternatives: Monolith, 3 services (frontend, backend, sync), 10+ services
   - Rationale: Balance between service granularity and operational complexity

2. **ADR-002: Event Backbone Selection (Kafka vs NATS vs RabbitMQ)**
   - Decision: Kafka (Redpanda Cloud)
   - Alternatives: NATS, RabbitMQ, AWS SNS/SQS
   - Rationale: Durability, replay capability, Dapr support, managed offering

3. **ADR-003: State Store Selection (Redis vs PostgreSQL)**
   - Decision: TBD (research in Phase 0)
   - Alternatives: Redis, PostgreSQL, etcd
   - Rationale: Performance vs consistency tradeoffs

4. **ADR-004: WebSocket Scaling Strategy**
   - Decision: TBD (research in Phase 0)
   - Alternatives: Sticky sessions, Redis pub/sub, shared state
   - Rationale: Horizontal scalability requirements

5. **ADR-005: Recurring Task Scheduling Approach**
   - Decision: TBD (research in Phase 0)
   - Alternatives: Dapr cron binding, custom scheduler, external cron service
   - Rationale: Reliability and operational simplicity

**Note**: ADRs will be created after user consent following Phase 1 design completion.

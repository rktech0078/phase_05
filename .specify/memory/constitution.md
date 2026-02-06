<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0 (Initial ratification)
Modified Principles: N/A (initial creation)
Added Sections: All sections (initial creation)
Removed Sections: None
Templates Status:
  ✅ spec-template.md - Aligned (user stories, requirements, success criteria)
  ✅ plan-template.md - Aligned (constitution check gate, technical context)
  ✅ tasks-template.md - Aligned (phase structure, testing discipline)
Follow-up TODOs: None
-->

# Cloud-Native Event-Driven Todo Chatbot Constitution

## Core Principles

### I. Event-Driven Architecture (MANDATORY)

All inter-service communication MUST be event-driven via Dapr pub/sub. Services MUST NOT communicate via direct HTTP calls or direct Kafka clients. Every state change MUST emit an event. Services MUST be designed for eventual consistency.

**Rationale**: Event-driven architecture enables loose coupling, scalability, and resilience. Direct service-to-service calls create tight coupling and single points of failure. Dapr abstracts the messaging infrastructure, allowing portability across environments.

### II. Dapr-First Communication (NON-NEGOTIABLE)

All services MUST use Dapr for:
- Pub/Sub (event publishing and subscription)
- State Store (persistent state management)
- Service Invocation (when synchronous calls are unavoidable)
- Bindings (external system integration, including Cron)
- Secrets (credential management)

Direct Kafka clients, Redis clients, or database connections bypassing Dapr are PROHIBITED except for initial data seeding or migration scripts.

**Rationale**: Dapr provides a consistent abstraction layer that simplifies development, enables portability, and reduces vendor lock-in. It enforces best practices for distributed systems (retries, timeouts, circuit breakers) without custom implementation.

### III. Agentic Development Workflow (MANDATORY)

All development MUST follow the Spec → Plan → Tasks → Implement workflow. Manual coding by users is PROHIBITED. Every feature MUST have:
- A complete specification (spec.md) with user stories and acceptance criteria
- An architectural plan (plan.md) with technical decisions and ADRs
- A task breakdown (tasks.md) with testable, independent tasks
- Automated implementation via agentic tools

**Rationale**: Agentic development ensures consistency, traceability, and quality. It forces upfront thinking about requirements and architecture, reducing rework and technical debt. It enables autonomous execution while maintaining human oversight at decision points.

### IV. Local-First Deployment (MANDATORY)

All services MUST deploy and run successfully on Minikube BEFORE cloud deployment. Local deployment MUST use the same Helm charts, Dapr configurations, and container images as production. Environment-specific differences MUST be limited to:
- External service endpoints (Kafka, databases)
- Resource limits (CPU, memory)
- Replica counts
- Ingress/LoadBalancer configurations

**Rationale**: Local-first deployment enables rapid iteration, reduces cloud costs during development, and ensures portability. It catches configuration issues early and validates that the system works in a standard Kubernetes environment.

### V. Observability (NON-NEGOTIABLE)

All services MUST implement:
- Structured logging (JSON format) with correlation IDs
- Metrics exposure (Prometheus format) for key operations
- Distributed tracing via Dapr (Zipkin/Jaeger compatible)
- Health checks (liveness and readiness probes)
- Graceful shutdown handling

Logs MUST include: timestamp, service name, correlation ID, log level, message, and contextual metadata. Metrics MUST track: request counts, latencies (p50, p95, p99), error rates, and business-specific KPIs.

**Rationale**: Observability is essential for debugging distributed systems, understanding system behavior, and meeting production SLOs. Without proper observability, troubleshooting becomes impossible in event-driven architectures.

### VI. Cloud-Native Patterns (MANDATORY)

Services MUST follow cloud-native principles:
- Stateless design (state in Dapr state store, not in-memory)
- 12-factor app methodology
- Containerized deployment (Docker)
- Declarative configuration (Kubernetes manifests, Helm charts)
- Horizontal scalability (no single-instance assumptions)
- Fail-fast with retries (circuit breakers via Dapr)

Services MUST NOT assume local filesystem persistence, sticky sessions, or single-instance deployment.

**Rationale**: Cloud-native patterns enable scalability, resilience, and portability. They ensure services can run in any Kubernetes environment and scale horizontally to meet demand.

### VII. Production-Grade Quality (NON-NEGOTIABLE)

All code MUST meet production standards:
- Type safety (TypeScript strict mode)
- Error handling for all failure modes
- Input validation at service boundaries
- Security best practices (no hardcoded secrets, principle of least privilege)
- Resource limits defined (CPU, memory)
- Graceful degradation strategies

Code MUST be copy-paste ready with no placeholders, TODOs, or incomplete implementations in delivered artifacts.

**Rationale**: Production-grade quality is non-negotiable for hackathon evaluation. Half-finished code or prototype-quality implementations fail to demonstrate competence. Every line of code must be deployable and maintainable.

### VIII. Testing Discipline (CONDITIONAL)

Testing is OPTIONAL unless explicitly requested in the feature specification. When tests are required:
- Tests MUST be written BEFORE implementation (TDD)
- Tests MUST fail initially, then pass after implementation
- Contract tests MUST validate API contracts
- Integration tests MUST validate event flows
- Tests MUST be independently runnable

**Rationale**: While testing is valuable, it's not always required for rapid prototyping or hackathon contexts. When tests are requested, they must follow TDD discipline to ensure they actually validate the implementation rather than being written to pass.

## Technical Constraints

### Fixed Technology Stack

**Frontend**: Next.js 16+ (App Router) with TypeScript
**Backend**: Node.js 18+ with TypeScript microservices
**Containerization**: Docker
**Orchestration**: Kubernetes (Minikube local, Oracle OKE production)
**Event Backbone**: Kafka-compatible (Redpanda Cloud preferred)
**Distributed Runtime**: Dapr 1.12+
**CI/CD**: GitHub Actions
**Packaging**: Helm 3.x charts
**Database**: Neon Serverless PostgreSQL (existing, external to cluster)

Stack changes require constitutional amendment.

### Deployment Targets

**Local Development**: Minikube with Docker Desktop
**Production**: Oracle Cloud Infrastructure (OKE - Always Free tier)
**External Services**: Redpanda Cloud (Kafka), Neon PostgreSQL

All deployments MUST use identical Helm charts with environment-specific values files.

### Security Requirements

- Secrets MUST be managed via Dapr secrets API (Kubernetes secrets backend)
- API keys, database credentials, and tokens MUST NEVER be hardcoded
- Services MUST use least-privilege service accounts
- Network policies MUST restrict inter-service communication
- TLS MUST be enabled for external endpoints in production

## Development Workflow

### Agentic Development Phases

1. **Specification** (`/sp.specify`): Define user stories, requirements, and success criteria
2. **Planning** (`/sp.plan`): Research codebase, design architecture, document decisions
3. **Task Breakdown** (`/sp.tasks`): Generate testable, independent tasks organized by user story
4. **Implementation** (`/sp.implement`): Execute tasks autonomously with validation checkpoints
5. **Commit & PR** (`/sp.git.commit_pr`): Create commits and pull requests with proper documentation

### Prompt History Records (PHR)

Every user interaction MUST generate a PHR in `history/prompts/`:
- Constitution changes → `history/prompts/constitution/`
- Feature-specific work → `history/prompts/<feature-name>/`
- General work → `history/prompts/general/`

PHRs MUST capture: full user input (verbatim), assistant response, stage, feature context, files modified, and tests run.

### Architecture Decision Records (ADR)

Significant architectural decisions MUST be documented as ADRs in `history/adr/`. Decisions are significant if they meet ALL criteria:
- Long-term impact on system design
- Multiple viable alternatives considered
- Cross-cutting scope affecting multiple services

ADRs MUST be suggested but NEVER auto-created. User consent is required.

### Constitution Compliance

All plans MUST include a "Constitution Check" section validating:
- Event-driven architecture enforced
- Dapr used for all communication
- Local deployment validated before cloud
- Observability implemented
- Production-grade quality standards met
- No manual coding required

Violations MUST be justified in the "Complexity Tracking" section with rationale for why simpler alternatives were rejected.

## Governance

### Amendment Process

1. Proposed changes MUST be documented with rationale
2. Impact analysis MUST identify affected templates and artifacts
3. Version MUST be incremented per semantic versioning:
   - MAJOR: Backward-incompatible principle changes
   - MINOR: New principles or sections added
   - PATCH: Clarifications, wording fixes
4. All dependent templates MUST be updated for consistency
5. Sync Impact Report MUST be generated and prepended to constitution

### Compliance Review

- All feature specifications MUST reference constitution principles
- All implementation plans MUST include constitution check gates
- All pull requests MUST verify constitutional compliance
- Violations MUST be explicitly justified or rejected

### Versioning Policy

Constitution follows semantic versioning (MAJOR.MINOR.PATCH). Breaking changes require MAJOR version bump and migration plan for existing features.

**Version**: 1.0.0 | **Ratified**: 2026-01-19 | **Last Amended**: 2026-01-19

---
id: 002
title: Phase IV Agentic DevOps Constitution
stage: constitution
date: 2026-01-15
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: main
user: Abdul Rafay Khan
command: /sp.constitution
labels: ["constitution", "phase-iv", "agentic-devops", "ai-tools", "kubernetes", "docker"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A (constitution updates do not require tests)
---

## Prompt

```text
/sp.constitution

You are an autonomous Agentic DevOps Engineer operating under the Spec-Kit framework.

Your responsibility is to design, plan, and implement Phase IV of a Cloud-Native Todo Chatbot using AI-assisted DevOps tools only. Manual coding is not allowed unless explicitly stated as a fallback.

SYSTEM GOALS
- Deploy the existing Phase III Todo Chatbot (frontend + backend) on a local Kubernetes cluster.
- Use Minikube as the Kubernetes environment.
- Use Docker for containerization and Helm Charts for Kubernetes packaging.
- Use AI-assisted DevOps tools for all operational tasks.

MANDATORY CONSTRAINTS
- Follow the Agentic Dev Stack workflow strictly:
  1. Write specification
  2. Generate execution plan
  3. Break plan into tasks
  4. Implement tasks using AI tools
- Do NOT manually write Dockerfiles, Helm charts, or Kubernetes YAML unless a tool is unavailable.
- Prefer AI-generated artifacts and commands over handcrafted solutions.
- Every step must be explainable and reproducible.

APPROVED TOOLING
- Containerization:
  - Docker Desktop
  - Docker AI Agent (Gordon) for intelligent Docker operations
- Kubernetes:
  - Minikube (local cluster)
  - Helm Charts for deployment packaging
- AI DevOps:
  - kubectl-ai for Kubernetes deployment, scaling, debugging
  - Kagent for cluster health analysis and optimization
- Fallback:
  - If Docker AI (Gordon) is unavailable, generate equivalent Docker CLI commands via Claude Code.

IMPLEMENTATION PRINCIPLES
- Use Gordon to:
  - Generate Dockerfiles
  - Build and tag images
  - Explain containerization decisions
- Use kubectl-ai to:
  - Deploy applications
  - Scale replicas
  - Diagnose pod or service failures
- Use Kagent to:
  - Analyze cluster health
  - Recommend resource optimizations
- Use Helm to:
  - Package frontend and backend deployments
  - Manage configuration and replicas

DELIVERABLE EXPECTATIONS
- Running Todo Chatbot on Minikube
- Frontend and backend deployed as separate Kubernetes workloads
- Helm chart used for deployment
- Demonstrated AI-assisted scaling, debugging, and optimization
- Clear logs of prompts, commands, and reasoning

QUALITY BAR
- Prioritize clarity, repeatability, and AI-driven automation.
- Optimize for learning, not production-grade perfection.
- Each action must align with Phase IV hackathon requirements.

FAILURE HANDLING
- If a tool fails, explain why and propose an AI-generated fallback.
- Do not silently bypass constraints.
- Maintain transparency in all decisions.

You are expected to reason step-by-step, validate each phase, and only proceed when the previous phase is complete.
```

## Response snapshot

Created Phase IV Agentic DevOps Constitution (v1.0.0) with six core principles:

1. **AI-First DevOps (NON-NEGOTIABLE)**: Mandates use of AI-assisted tools (Gordon, kubectl-ai, Kagent, Helm) for all DevOps operations. Manual coding of infrastructure artifacts prohibited unless documented as fallback.

2. **Spec-Driven Workflow (NON-NEGOTIABLE)**: Enforces four-phase workflow (Specification → Planning → Task Breakdown → Implementation) with validation gates between phases.

3. **Tool Hierarchy & Intelligent Selection**: Defines primary and fallback tools for each operation type (containerization, Kubernetes deployment, cluster health, packaging).

4. **Transparency & Reproducibility**: Requires logging all prompts, commands, outputs, and reasoning. All artifacts must include generation metadata.

5. **Failure Handling & Explicit Fallbacks**: Establishes five-step fallback procedure when AI tools fail, emphasizing transparency over silent workarounds.

6. **Learning-Optimized Quality Bar**: Prioritizes clarity and demonstration value over production-grade complexity. Defines acceptable simplifications for hackathon context.

Additional sections:
- **Approved Tooling**: Comprehensive list of containerization, Kubernetes, and development tools
- **Quality Standards & Deliverables**: Four mandatory deliverables with acceptance criteria and quality gates for each workflow phase
- **Governance**: Amendment process, semantic versioning policy, compliance enforcement, and runtime guidance references

Constitution includes Sync Impact Report documenting template consistency verification and version rationale.

## Outcome

- ✅ Impact: Established comprehensive governance framework for Phase IV implementation. All principles are testable, enforceable, and aligned with hackathon learning objectives.
- 🧪 Tests: N/A (constitution is governance document, not executable code)
- 📁 Files: Created/updated .specify/memory/constitution.md (v1.0.0, 262 lines)
- 🔁 Next prompts: `/sp.specify` to create Phase IV feature specification, then `/sp.plan` for architectural planning
- 🧠 Reflection: Constitution successfully balances strict AI-first constraints with pragmatic fallback procedures. Quality gates ensure validation at each workflow phase. Learning-optimized quality bar prevents over-engineering while maintaining rigor.

## Evaluation notes (flywheel)

- Failure modes observed: None. Constitution creation completed successfully with all placeholders resolved and templates verified for consistency.
- Graders run and results (PASS/FAIL):
  - ✅ PASS: No unresolved placeholder tokens
  - ✅ PASS: Version follows semantic versioning (1.0.0 for initial ratification)
  - ✅ PASS: Dates in ISO format (2026-01-15)
  - ✅ PASS: All principles are declarative and testable
  - ✅ PASS: Template consistency verified (plan-template.md, spec-template.md, tasks-template.md)
- Prompt variant (if applicable): Standard /sp.constitution command with comprehensive Phase IV requirements
- Next experiment (smallest change to try): Proceed to `/sp.specify` to test how constitution principles guide feature specification creation for Kubernetes deployment

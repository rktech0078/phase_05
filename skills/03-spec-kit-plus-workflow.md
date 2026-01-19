# Skill: Spec-Kit Plus Workflow

## Overview
Spec-Kit Plus is a documentation-driven development methodology that ensures clear requirements, structured planning, and comprehensive tracking of all development decisions. Based on the `.specify/` directory structure and workflow.

## Philosophy

**Core Principle**: Write specifications before code, track every decision, and maintain a complete audit trail of the development process.

**Benefits:**
- Clear requirements before implementation
- Reduced ambiguity and rework
- Complete project history
- AI-friendly documentation
- Reproducible development process

## Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project principles & architectural rules
├── templates/
│   ├── spec-template.md         # Feature specification template
│   ├── plan-template.md         # Implementation plan template
│   ├── tasks-template.md        # Task breakdown template
│   ├── phr-template.prompt.md   # Prompt History Record template
│   ├── adr-template.md          # Architecture Decision Record template
│   └── checklist-template.md    # General checklist template
└── scripts/
    └── (automation scripts)

specs/
├── 001-feature-name/
│   ├── spec.md                  # Feature specification
│   ├── plan.md                  # Implementation plan
│   ├── tasks.md                 # Task breakdown
│   └── adr/                     # Architecture decisions
│       └── 001-decision.md
└── 002-another-feature/
    └── ...

history/
└── prompts/
    ├── 001-feature-name/        # Prompts for feature 001
    │   ├── 001-initial.prompt.md
    │   ├── 002-refinement.prompt.md
    │   └── ...
    ├── constitution/            # Constitution-related prompts
    └── general/                 # General prompts
```

## The Four-Phase Workflow

### Phase 1: Specification (spec.md)

**Purpose**: Define WHAT needs to be built and WHY.

**Template Structure:**

```markdown
# Feature: [Feature Name]

## Overview
Brief description of the feature and its purpose.

## User Scenarios

### Scenario 1: [Primary Use Case] (P1)
**As a** [user type]
**I want to** [action]
**So that** [benefit]

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2

### Scenario 2: [Secondary Use Case] (P2)
...

## Functional Requirements

### Core Requirements (P1)
1. **REQ-001**: [Requirement description]
   - Details...
   - Constraints...

### Nice-to-Have (P2)
2. **REQ-002**: [Optional requirement]

## Non-Functional Requirements
- **Performance**: Response time < 200ms
- **Security**: User data isolation
- **Scalability**: Support 10k concurrent users

## Success Criteria
- [ ] All P1 scenarios work end-to-end
- [ ] Test coverage > 80%
- [ ] No critical bugs

## Edge Cases & Error Handling
1. **Empty state**: What happens when no data exists?
2. **Invalid input**: How to handle malformed data?
3. **Concurrent operations**: Race condition handling?

## Out of Scope
- Feature X (deferred to v2)
- Integration with Y (separate spec)
```

**Best Practices:**
- Use priority labels (P1, P2, P3)
- Write from user perspective
- Include concrete examples
- Define success criteria upfront
- Document what's NOT included

### Phase 2: Planning (plan.md)

**Purpose**: Define HOW to implement the specification.

**Template Structure:**

```markdown
# Implementation Plan: [Feature Name]

## Technical Context

### Current State
- Existing architecture overview
- Related components
- Current limitations

### Proposed Changes
- New components to create
- Existing components to modify
- Database schema changes

## Constitution Check

### Statelessness ✓
- All state persisted to database
- No in-memory caching between requests

### Agent-Centric Control ✓
- Business logic handled by AI agent
- No hardcoded control flow

### MCP Tool Integration ✓
- All operations exposed as MCP tools

## Project Structure

```
app/
├── api/
│   └── new-feature/
│       └── route.ts          # API endpoint
components/
├── new-feature/
│   ├── FeatureComponent.tsx  # UI component
│   └── FeatureForm.tsx       # Form component
lib/
├── services/
│   └── feature.service.ts    # Business logic
└── agents/
    └── feature-agent.ts      # AI agent
schemas/
└── index.ts                  # Database schema
```

## Implementation Steps

### Step 1: Database Schema
**Files**: `schemas/index.ts`
- Add new tables
- Define relationships
- Create migrations

### Step 2: Service Layer
**Files**: `lib/services/feature.service.ts`
- Implement CRUD operations
- Add business logic
- Error handling

### Step 3: API Routes
**Files**: `app/api/feature/route.ts`
- Create endpoints
- Add authentication
- Input validation

### Step 4: AI Agent
**Files**: `lib/agents/feature-agent.ts`
- Define tools
- System prompt
- Execution loop

### Step 5: UI Components
**Files**: `components/feature/`
- Create components
- Add forms
- Implement interactions

### Step 6: Integration
- Connect components to API
- Add to navigation
- Update layout

## Complexity Tracking

### High Complexity Areas
- **Database migrations**: Requires careful planning
- **AI agent tools**: Complex tool orchestration

### Medium Complexity
- **API routes**: Standard CRUD operations
- **UI components**: Reuse existing patterns

### Low Complexity
- **Service layer**: Straightforward business logic

## Dependencies
- Depends on: Authentication system
- Blocks: Feature Y (needs this first)

## Testing Strategy
- Unit tests for service layer
- Integration tests for API routes
- E2E tests for user flows

## Rollout Plan
1. Deploy database changes
2. Deploy backend (API + services)
3. Deploy frontend
4. Monitor for issues
```

**Best Practices:**
- Check against constitution
- Break into clear steps
- Identify dependencies
- Track complexity
- Plan testing upfront

### Phase 3: Task Breakdown (tasks.md)

**Purpose**: Break plan into actionable, testable tasks.

**Template Structure:**

```markdown
# Tasks: [Feature Name]

## Task 1: Database Schema Setup
**Status**: ⏳ Pending
**Assignee**: AI Agent
**Estimated Complexity**: Low

### Description
Add new tables to database schema for feature storage.

### Acceptance Criteria
- [ ] `feature_items` table created with all required fields
- [ ] Foreign key relationships defined
- [ ] Migration script generated
- [ ] Schema types exported

### Files to Modify
- `schemas/index.ts`

### Dependencies
None

---

## Task 2: Service Layer Implementation
**Status**: ⏳ Pending
**Assignee**: AI Agent
**Estimated Complexity**: Medium

### Description
Implement service class with CRUD operations.

### Acceptance Criteria
- [ ] `FeatureService` class created
- [ ] All CRUD methods implemented
- [ ] Error handling added
- [ ] User ownership validation
- [ ] Unit tests written (>80% coverage)

### Files to Create
- `lib/services/feature.service.ts`

### Dependencies
- Task 1 (Database Schema)

---

## Task 3: API Routes
**Status**: ⏳ Pending
**Assignee**: AI Agent
**Estimated Complexity**: Medium

### Description
Create API endpoints for feature operations.

### Acceptance Criteria
- [ ] GET /api/feature - List items
- [ ] POST /api/feature - Create item
- [ ] PUT /api/feature/[id] - Update item
- [ ] DELETE /api/feature/[id] - Delete item
- [ ] Authentication middleware applied
- [ ] Input validation with Zod
- [ ] Integration tests written

### Files to Create
- `app/api/feature/route.ts`
- `app/api/feature/[id]/route.ts`

### Dependencies
- Task 2 (Service Layer)

---

## Progress Tracking

| Task | Status | Complexity | Completed |
|------|--------|------------|-----------|
| 1. Database Schema | ⏳ Pending | Low | - |
| 2. Service Layer | ⏳ Pending | Medium | - |
| 3. API Routes | ⏳ Pending | Medium | - |
| 4. AI Agent | ⏳ Pending | High | - |
| 5. UI Components | ⏳ Pending | Medium | - |
| 6. Integration | ⏳ Pending | Low | - |

**Legend:**
- ⏳ Pending
- 🚧 In Progress
- ✅ Completed
- ❌ Blocked
```

**Best Practices:**
- One task = one testable unit
- Clear acceptance criteria
- Track dependencies
- Estimate complexity
- Update status regularly

### Phase 4: Prompt History Records (PHR)

**Purpose**: Document every AI interaction for audit, learning, and reproducibility.

**Template Structure:**

```markdown
# Prompt History Record

**Feature**: [Feature Name]
**Phase**: [Specification/Planning/Implementation]
**Date**: 2026-01-11
**Prompt Number**: 001
**AI Model**: Claude Sonnet 4.5

## Context
Brief description of what was needed at this point in development.

## Prompt

```
[Exact prompt given to AI]
```

## Response Summary
Key points from AI response:
- Point 1
- Point 2
- Point 3

## Artifacts Generated
- `file1.ts` - Description
- `file2.tsx` - Description

## Decisions Made
1. **Decision**: Use X instead of Y
   **Rationale**: Performance benefits
   **Trade-offs**: Increased complexity

## Follow-up Actions
- [ ] Action 1
- [ ] Action 2

## Evaluation
**Success**: ✅ Yes / ❌ No
**Issues**: None / [List issues]
**Lessons Learned**: [Key takeaways]

## Related PRs
- #123 - Implementation PR
```

**Best Practices:**
- Record EVERY AI interaction
- Include full context
- Document decisions and rationale
- Track what worked and what didn't
- Link to generated artifacts

## Constitution Document

**Purpose**: Define immutable project principles and architectural rules.

**Example Structure:**

```markdown
# Project Constitution

## Core Principles (Non-Negotiable)

### 1. Statelessness Principle
**Rule**: Zero in-memory state between requests.

**Implementation:**
- All state persisted to database
- No server-side session storage
- Conversation history fetched per request
- MCP tools are stateless

**Rationale**: Scalability, reliability, simplicity

**Violations**: Any code that stores state in memory

---

### 2. Agent-Centric Control Model
**Rule**: AI agents make decisions, not hardcoded logic.

**Implementation:**
- AI interprets user intent
- AI decides which tools to call
- AI handles ambiguity resolution
- Minimal hardcoded control flow

**Rationale**: Flexibility, natural language interface

**Violations**: Complex if-else chains for business logic

---

### 3. MCP Tool Integration
**Rule**: All data operations exposed as MCP tools.

**Implementation:**
- Every CRUD operation has an MCP tool
- Tools use Zod validation
- Tools are discoverable
- Tools are composable

**Rationale**: Standardization, interoperability

**Violations**: Direct database access from agents

---

## Development Process Rules

### Spec-First Development
- Write spec before code
- Get approval on spec
- No implementation without spec

### Documentation Discipline
- Every feature has spec, plan, tasks
- Every AI interaction recorded in PHR
- Architecture decisions documented in ADRs

### Testing Requirements
- Unit tests for services (>80% coverage)
- Integration tests for APIs
- E2E tests for critical flows

## Code Quality Standards

### TypeScript Strictness
- Strict mode enabled
- No `any` types
- Explicit return types

### Error Handling
- All async operations wrapped in try-catch
- User-friendly error messages
- Errors logged for debugging

### Security
- User data isolation (always filter by userId)
- Input validation (Zod schemas)
- Authentication on all protected routes
```

**Best Practices:**
- Keep principles minimal and clear
- Explain rationale for each rule
- Define what constitutes a violation
- Update rarely (constitution should be stable)
- Require team consensus for changes

## Architecture Decision Records (ADRs)

**Purpose**: Document significant architectural decisions.

**Template:**

```markdown
# ADR-001: Use OpenRouter for AI Model Access

**Status**: Accepted
**Date**: 2026-01-11
**Deciders**: Development Team

## Context
We need to integrate AI capabilities into the todo app. We must choose between:
1. Direct OpenAI API
2. OpenRouter (multi-model proxy)
3. Self-hosted models

## Decision
Use OpenRouter with OpenAI SDK.

## Rationale

### Pros
- Access to multiple models (OpenAI, Anthropic, etc.)
- Single API interface
- Cost optimization (choose cheapest model)
- Fallback options if one provider is down

### Cons
- Additional dependency
- Slight latency overhead
- Less control over model versions

## Consequences

### Positive
- Can switch models without code changes
- Better cost management
- Improved reliability

### Negative
- Vendor lock-in to OpenRouter
- Need to monitor OpenRouter status

## Implementation
- Use OpenAI SDK with custom baseURL
- Set OpenRouter API key in environment
- Configure model selection per use case

## Alternatives Considered

### Direct OpenAI API
**Rejected**: Limited to OpenAI models only

### Self-hosted Models
**Rejected**: High infrastructure cost and maintenance

## Related Decisions
- ADR-002: Model selection strategy
- ADR-003: Prompt caching approach
```

## Workflow in Practice

### Starting a New Feature

```bash
# 1. Create feature directory
mkdir -p specs/003-new-feature

# 2. Copy templates
cp .specify/templates/spec-template.md specs/003-new-feature/spec.md
cp .specify/templates/plan-template.md specs/003-new-feature/plan.md
cp .specify/templates/tasks-template.md specs/003-new-feature/tasks.md

# 3. Write specification
# Edit specs/003-new-feature/spec.md

# 4. Get approval on spec
# Review with team/stakeholders

# 5. Create implementation plan
# Edit specs/003-new-feature/plan.md

# 6. Break into tasks
# Edit specs/003-new-feature/tasks.md

# 7. Start implementation
# Work through tasks, recording prompts in history/prompts/003-new-feature/
```

### Recording AI Interactions

```bash
# Create prompt history directory
mkdir -p history/prompts/003-new-feature

# For each AI interaction, create a PHR
# history/prompts/003-new-feature/001-initial-implementation.prompt.md
# history/prompts/003-new-feature/002-bug-fix.prompt.md
# etc.
```

### Making Architectural Decisions

```bash
# When a significant decision is needed
mkdir -p specs/003-new-feature/adr
cp .specify/templates/adr-template.md specs/003-new-feature/adr/001-decision-name.md

# Document the decision
# Edit specs/003-new-feature/adr/001-decision-name.md
```

## Benefits of This Workflow

1. **Clarity**: Everyone knows what's being built and why
2. **Traceability**: Complete audit trail of all decisions
3. **Reproducibility**: Can recreate development process
4. **AI-Friendly**: Structured docs help AI understand context
5. **Onboarding**: New team members can read specs to understand features
6. **Quality**: Thinking before coding reduces bugs
7. **Accountability**: Clear ownership and progress tracking

## Common Pitfalls

1. **Skipping Spec Phase**: Leads to unclear requirements and rework
2. **Incomplete PHRs**: Missing context makes it hard to understand decisions later
3. **Stale Documentation**: Not updating docs as implementation evolves
4. **Over-Documentation**: Too much detail slows down development
5. **No Constitution Checks**: Violating architectural principles
6. **Ignoring ADRs**: Making significant decisions without documentation

## Tools & Automation

### Spec Validation Script

```bash
#!/bin/bash
# .specify/scripts/validate-spec.sh

SPEC_FILE=$1

# Check required sections
required_sections=("Overview" "User Scenarios" "Functional Requirements" "Success Criteria")

for section in "${required_sections[@]}"; do
  if ! grep -q "## $section" "$SPEC_FILE"; then
    echo "❌ Missing required section: $section"
    exit 1
  fi
done

echo "✅ Spec validation passed"
```

### PHR Generator

```bash
#!/bin/bash
# .specify/scripts/new-phr.sh

FEATURE=$1
PROMPT_NUM=$2

PHR_DIR="history/prompts/$FEATURE"
mkdir -p "$PHR_DIR"

PHR_FILE="$PHR_DIR/$(printf '%03d' $PROMPT_NUM)-prompt.md"
cp .specify/templates/phr-template.prompt.md "$PHR_FILE"

echo "Created: $PHR_FILE"
```

## Integration with AI Development

### Providing Context to AI

```
I'm working on Feature X. Here's the context:

1. Specification: [paste specs/X/spec.md]
2. Implementation Plan: [paste specs/X/plan.md]
3. Current Task: Task 3 from tasks.md
4. Constitution: [paste relevant principles]

Please implement Task 3 following the plan and constitution.
```

### Recording AI Output

After AI generates code:
1. Create new PHR file
2. Document prompt and response
3. List generated files
4. Note any decisions made
5. Update task status in tasks.md

## References

- Constitution: `.specify/memory/constitution.md`
- Templates: `.specify/templates/`
- Example Spec: `specs/001-todo-app/spec.md`
- Example Plan: `specs/001-todo-app/plan.md`
- Example PHR: `history/prompts/001-todo-app/`

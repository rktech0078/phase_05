# Tasks: Event-Driven Todo Chatbot Platform

**Input**: Design documents from `/specs/001-event-driven-todo/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in the feature specification, therefore not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Microservices**: `services/<service-name>/src/`
- **Shared code**: `shared/`
- **Infrastructure**: `infrastructure/`
- **Migrations**: `migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create microservices directory structure (services/, shared/, infrastructure/, migrations/)
- [ ] T002 [P] Initialize task-service with package.json and TypeScript configuration
- [ ] T003 [P] Initialize notification-service with package.json and TypeScript configuration
- [ ] T004 [P] Initialize recurring-service with package.json and TypeScript configuration
- [ ] T005 [P] Initialize audit-service with package.json and TypeScript configuration
- [ ] T006 [P] Initialize sync-service with package.json and TypeScript configuration
- [ ] T007 Create shared types package in shared/types/ with event and entity interfaces
- [ ] T008 Create shared schemas package in shared/schemas/ with Drizzle ORM schemas
- [ ] T009 Create shared utilities package in shared/utils/ with logger, validation, correlation utilities

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Run database migration 001_add_task_fields.sql to add priority, tags, dueDate, recurrencePattern columns
- [ ] T011 Run database migration 002_create_reminders.sql to create reminders table
- [ ] T012 Run database migration 003_create_audit_logs.sql to create audit_logs table
- [ ] T013 [P] Create Dapr pub/sub component configuration in infrastructure/dapr/components/pubsub-kafka.yaml
- [ ] T014 [P] Create Dapr state store component configuration in infrastructure/dapr/components/statestore-redis.yaml
- [ ] T015 [P] Create Dapr cron binding component configuration in infrastructure/dapr/components/binding-cron.yaml
- [ ] T016 [P] Create Dapr secrets component configuration in infrastructure/dapr/components/secrets-k8s.yaml
- [ ] T017 [P] Implement Dapr client initialization in task-service/src/dapr/client.ts
- [ ] T018 [P] Implement Dapr client initialization in notification-service/src/dapr/client.ts
- [ ] T019 [P] Implement Dapr client initialization in recurring-service/src/dapr/client.ts
- [ ] T020 [P] Implement Dapr client initialization in audit-service/src/dapr/client.ts
- [ ] T021 [P] Implement Dapr client initialization in sync-service/src/dapr/client.ts
- [ ] T022 [P] Implement structured logging utility in shared/utils/logger.ts with winston
- [ ] T023 [P] Implement correlation ID utility in shared/utils/correlation.ts
- [ ] T024 [P] Implement Zod validation schemas in shared/utils/validation.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Task Management (Priority: P1) 🎯 MVP

**Goal**: Implement core CRUD operations for tasks (create, read, update, delete, complete)

**Independent Test**: Create a task, view it in the list, update its details, mark it complete, and delete it

### Implementation for User Story 1

- [ ] T025 [P] [US1] Update Task model in shared/schemas/index.ts with extended fields (priority, tags, dueDate, recurrencePattern)
- [ ] T026 [P] [US1] Create task validation schemas in task-service/src/models/task-validation.ts using Zod
- [ ] T027 [US1] Implement database connection in task-service/src/db/connection.ts using Drizzle ORM
- [ ] T028 [US1] Implement createTask API endpoint in task-service/src/api/create-task.ts
- [ ] T029 [US1] Implement getUserTasks API endpoint in task-service/src/api/get-tasks.ts
- [ ] T030 [US1] Implement getTaskById API endpoint in task-service/src/api/get-task.ts
- [ ] T031 [US1] Implement updateTask API endpoint in task-service/src/api/update-task.ts
- [ ] T032 [US1] Implement deleteTask API endpoint in task-service/src/api/delete-task.ts
- [ ] T033 [US1] Implement toggleTaskCompletion API endpoint in task-service/src/api/complete-task.ts
- [ ] T034 [US1] Implement TaskCreated event publishing in task-service/src/handlers/publish-task-created.ts
- [ ] T035 [US1] Implement TaskUpdated event publishing in task-service/src/handlers/publish-task-updated.ts
- [ ] T036 [US1] Implement TaskCompleted event publishing in task-service/src/handlers/publish-task-completed.ts
- [ ] T037 [US1] Implement TaskDeleted event publishing in task-service/src/handlers/publish-task-deleted.ts
- [ ] T038 [US1] Implement health check endpoints (/health, /ready) in task-service/src/api/health.ts
- [ ] T039 [US1] Implement graceful shutdown handler in task-service/src/index.ts
- [ ] T040 [US1] Create Dockerfile for task-service in services/task-service/Dockerfile
- [ ] T041 [P] [US1] Update frontend to call task-service API endpoints in app/api/tasks/route.ts
- [ ] T042 [P] [US1] Update TaskItem component to use new task fields in components/tasks/TaskItem.tsx
- [ ] T043 [US1] Create Kubernetes deployment manifest for task-service in infrastructure/kubernetes/deployments/task-service.yaml
- [ ] T044 [US1] Create Kubernetes service manifest for task-service in infrastructure/kubernetes/services/task-service.yaml

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Task Organization and Discovery (Priority: P2)

**Goal**: Add priority, tags, due dates, search, filtering, and sorting capabilities

**Independent Test**: Create tasks with different priorities, tags, and due dates, then use search, filters, and sorting to find specific tasks

### Implementation for User Story 2

- [ ] T045 [P] [US2] Implement priority filter logic in task-service/src/api/get-tasks.ts
- [ ] T046 [P] [US2] Implement tag filter logic in task-service/src/api/get-tasks.ts
- [ ] T047 [P] [US2] Implement due date filter logic in task-service/src/api/get-tasks.ts
- [ ] T048 [P] [US2] Implement overdue detection logic in task-service/src/api/get-tasks.ts
- [ ] T049 [P] [US2] Implement sorting logic (dueDate, priority, createdAt) in task-service/src/api/get-tasks.ts
- [ ] T050 [US2] Implement full-text search endpoint in task-service/src/api/search-tasks.ts
- [ ] T051 [P] [US2] Create priority selector component in components/tasks/PrioritySelector.tsx
- [ ] T052 [P] [US2] Create tag input component in components/tasks/TagInput.tsx
- [ ] T053 [P] [US2] Create due date picker component in components/tasks/DueDatePicker.tsx
- [ ] T054 [US2] Create filter panel component in components/tasks/FilterPanel.tsx
- [ ] T055 [US2] Create search bar component in components/tasks/SearchBar.tsx
- [ ] T056 [US2] Update dashboard to include filters and search in app/dashboard/page.tsx
- [ ] T057 [US2] Add overdue task visual indicator in components/tasks/TaskItem.tsx

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Reminder Notifications (Priority: P3)

**Goal**: Implement reminder notifications for tasks with due dates

**Independent Test**: Create a task with a due date, wait for the reminder time, and verify the notification is received

### Implementation for User Story 3

- [ ] T058 [P] [US3] Create Reminder model validation schemas in notification-service/src/models/reminder-validation.ts
- [ ] T059 [US3] Implement database connection in notification-service/src/db/connection.ts
- [ ] T060 [US3] Implement TaskCreated event subscriber in notification-service/src/handlers/task-created-handler.ts
- [ ] T061 [US3] Implement reminder scheduling logic in notification-service/src/scheduler/schedule-reminder.ts
- [ ] T062 [US3] Implement Dapr cron binding handler in notification-service/src/scheduler/cron-handler.ts
- [ ] T063 [US3] Implement reminder check logic in notification-service/src/scheduler/check-reminders.ts
- [ ] T064 [US3] Implement push notification delivery in notification-service/src/notifiers/push-notifier.ts
- [ ] T065 [US3] Implement ReminderScheduled event publishing in notification-service/src/handlers/publish-reminder-scheduled.ts
- [ ] T066 [US3] Implement ReminderTriggered event publishing in notification-service/src/handlers/publish-reminder-triggered.ts
- [ ] T067 [US3] Implement ReminderDelivered event publishing in notification-service/src/handlers/publish-reminder-delivered.ts
- [ ] T068 [US3] Implement ReminderFailed event publishing with retry logic in notification-service/src/handlers/publish-reminder-failed.ts
- [ ] T069 [US3] Implement TaskCompleted event subscriber to cancel reminders in notification-service/src/handlers/task-completed-handler.ts
- [ ] T070 [US3] Implement TaskUpdated event subscriber to reschedule reminders in notification-service/src/handlers/task-updated-handler.ts
- [ ] T071 [US3] Implement health check endpoints in notification-service/src/api/health.ts
- [ ] T072 [US3] Implement graceful shutdown handler in notification-service/src/index.ts
- [ ] T073 [US3] Create Dockerfile for notification-service in services/notification-service/Dockerfile
- [ ] T074 [US3] Create Dapr subscription configuration in infrastructure/dapr/subscriptions/notification-service-sub.yaml
- [ ] T075 [US3] Create Kubernetes deployment manifest for notification-service in infrastructure/kubernetes/deployments/notification-service.yaml
- [ ] T076 [US3] Create Kubernetes service manifest for notification-service in infrastructure/kubernetes/services/notification-service.yaml
- [ ] T077 [P] [US3] Implement browser notification permission request in components/notifications/NotificationPermission.tsx
- [ ] T078 [US3] Implement notification display handler in lib/notifications/display-notification.ts

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Recurring Tasks (Priority: P4)

**Goal**: Implement automatic generation of recurring task instances

**Independent Test**: Create a recurring task, complete it, and verify the next instance is automatically created

### Implementation for User Story 4

- [ ] T079 [P] [US4] Implement recurrence pattern calculation logic in recurring-service/src/patterns/calculate-next-date.ts
- [ ] T080 [US4] Implement database connection in recurring-service/src/db/connection.ts
- [ ] T081 [US4] Implement TaskCompleted event subscriber in recurring-service/src/handlers/task-completed-handler.ts
- [ ] T082 [US4] Implement next task instance generation logic in recurring-service/src/generators/generate-next-instance.ts
- [ ] T083 [US4] Implement RecurringTaskGenerated event publishing in recurring-service/src/handlers/publish-recurring-generated.ts
- [ ] T084 [US4] Implement RecurringTaskGenerated event subscriber in task-service to create new task
- [ ] T085 [US4] Implement health check endpoints in recurring-service/src/api/health.ts
- [ ] T086 [US4] Implement graceful shutdown handler in recurring-service/src/index.ts
- [ ] T087 [US4] Create Dockerfile for recurring-service in services/recurring-service/Dockerfile
- [ ] T088 [US4] Create Dapr subscription configuration in infrastructure/dapr/subscriptions/recurring-service-sub.yaml
- [ ] T089 [US4] Create Kubernetes deployment manifest for recurring-service in infrastructure/kubernetes/deployments/recurring-service.yaml
- [ ] T090 [US4] Create Kubernetes service manifest for recurring-service in infrastructure/kubernetes/services/recurring-service.yaml
- [ ] T091 [P] [US4] Create recurrence pattern selector component in components/tasks/RecurrenceSelector.tsx
- [ ] T092 [US4] Update task creation form to include recurrence options in app/tasks/create/page.tsx
- [ ] T093 [US4] Implement delete confirmation modal for recurring tasks in components/tasks/DeleteRecurringModal.tsx

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - Real-Time Task Synchronization (Priority: P5)

**Goal**: Implement WebSocket-based real-time synchronization across devices

**Independent Test**: Open the application on two devices, make changes on one device, and verify the changes appear immediately on the other device

### Implementation for User Story 5

- [ ] T094 [P] [US5] Implement WebSocket server in sync-service/src/websocket/server.ts using ws library
- [ ] T095 [P] [US5] Implement connection management in sync-service/src/connections/connection-manager.ts
- [ ] T096 [US5] Implement Redis pub/sub client in sync-service/src/dapr/redis-client.ts
- [ ] T097 [US5] Implement task-updates topic subscriber in sync-service/src/handlers/task-updates-handler.ts
- [ ] T098 [US5] Implement Redis channel subscription logic in sync-service/src/handlers/redis-subscriber.ts
- [ ] T099 [US5] Implement WebSocket message broadcasting in sync-service/src/websocket/broadcaster.ts
- [ ] T100 [US5] Implement WebSocket authentication in sync-service/src/websocket/auth.ts
- [ ] T101 [US5] Implement graceful connection closure in sync-service/src/websocket/close-handler.ts
- [ ] T102 [US5] Implement health check endpoints in sync-service/src/api/health.ts
- [ ] T103 [US5] Implement graceful shutdown handler in sync-service/src/index.ts
- [ ] T104 [US5] Create Dockerfile for sync-service in services/sync-service/Dockerfile
- [ ] T105 [US5] Create Dapr subscription configuration in infrastructure/dapr/subscriptions/sync-service-sub.yaml
- [ ] T106 [US5] Create Kubernetes deployment manifest for sync-service in infrastructure/kubernetes/deployments/sync-service.yaml
- [ ] T107 [US5] Create Kubernetes service manifest for sync-service in infrastructure/kubernetes/services/sync-service.yaml
- [ ] T108 [US5] Publish task-updates events from task-service for all task operations
- [ ] T109 [P] [US5] Implement WebSocket client connection in lib/websocket/client.ts
- [ ] T110 [P] [US5] Implement WebSocket message handler in lib/websocket/message-handler.ts
- [ ] T111 [US5] Implement real-time task list updates in app/dashboard/page.tsx
- [ ] T112 [US5] Add connection status indicator in components/layout/ConnectionStatus.tsx

**Checkpoint**: At this point, User Stories 1-5 should all work independently

---

## Phase 8: User Story 6 - Activity Audit Trail (Priority: P6)

**Goal**: Implement comprehensive audit logging for all task operations

**Independent Test**: Perform various task operations and verify each action is logged with timestamp and details

### Implementation for User Story 6

- [ ] T113 [P] [US6] Create AuditLogEntry model validation schemas in audit-service/src/models/audit-validation.ts
- [ ] T114 [US6] Implement database connection in audit-service/src/db/connection.ts
- [ ] T115 [US6] Implement task-events topic subscriber in audit-service/src/handlers/task-events-handler.ts
- [ ] T116 [US6] Implement audit log creation logic in audit-service/src/handlers/create-audit-log.ts
- [ ] T117 [US6] Implement change tracking logic in audit-service/src/handlers/track-changes.ts
- [ ] T118 [US6] Implement getTaskAuditHistory API endpoint in audit-service/src/api/get-task-audit.ts
- [ ] T119 [US6] Implement getUserActivityHistory API endpoint in audit-service/src/api/get-user-activity.ts
- [ ] T120 [US6] Implement health check endpoints in audit-service/src/api/health.ts
- [ ] T121 [US6] Implement graceful shutdown handler in audit-service/src/index.ts
- [ ] T122 [US6] Create Dockerfile for audit-service in services/audit-service/Dockerfile
- [ ] T123 [US6] Create Dapr subscription configuration in infrastructure/dapr/subscriptions/audit-service-sub.yaml
- [ ] T124 [US6] Create Kubernetes deployment manifest for audit-service in infrastructure/kubernetes/deployments/audit-service.yaml
- [ ] T125 [US6] Create Kubernetes service manifest for audit-service in infrastructure/kubernetes/services/audit-service.yaml
- [ ] T126 [P] [US6] Create audit log viewer component in components/audit/AuditLogViewer.tsx
- [ ] T127 [US6] Create task activity page in app/tasks/[id]/activity/page.tsx
- [ ] T128 [US6] Add activity log link to task detail page in app/tasks/[id]/page.tsx

**Checkpoint**: All user stories should now be independently functional

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T129 [P] Implement Prometheus metrics endpoint in all services at /metrics
- [ ] T130 [P] Add correlation ID propagation to all event handlers
- [ ] T131 [P] Implement error boundaries in frontend components
- [ ] T132 [P] Add loading states to all async operations
- [ ] T133 Create Helm chart structure in infrastructure/helm/todo-platform/
- [ ] T134 Create Helm values.yaml with default configuration
- [ ] T135 Create Helm values-minikube.yaml with local overrides
- [ ] T136 Create Helm values-oke.yaml with production overrides
- [ ] T137 Create Helm deployment templates for all services
- [ ] T138 Create Helm service templates for all services
- [ ] T139 Create Helm ConfigMap template in infrastructure/helm/todo-platform/templates/configmap.yaml
- [ ] T140 Create Helm Secrets template in infrastructure/helm/todo-platform/templates/secrets.yaml
- [ ] T141 Create Dapr resiliency configuration in infrastructure/dapr/resiliency/default.yaml
- [ ] T142 Create network policies in infrastructure/kubernetes/networkpolicies/default-deny.yaml
- [ ] T143 [P] Add input validation to all API endpoints
- [ ] T144 [P] Add rate limiting to public endpoints
- [ ] T145 [P] Implement request timeout handling in all services
- [ ] T146 Create architecture documentation in docs/architecture.md
- [ ] T147 Create event flow diagrams in docs/event-flows.md
- [ ] T148 Create Minikube deployment guide in docs/deployment-minikube.md
- [ ] T149 Create OKE deployment guide in docs/deployment-oke.md
- [ ] T150 Create troubleshooting guide in docs/troubleshooting.md
- [ ] T151 Validate quickstart.md by following all steps on clean Minikube

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-8)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5 → P6)
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Extends US1 but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires US2 (due dates) but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Requires US2 (recurrence field) but independently testable
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Works with any user story, independently testable
- **User Story 6 (P6)**: Can start after Foundational (Phase 2) - Observes all events, independently testable

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks (T002-T009) can run in parallel
- All Foundational Dapr component tasks (T013-T016) can run in parallel
- All Foundational Dapr client initialization tasks (T017-T021) can run in parallel
- All Foundational utility tasks (T022-T024) can run in parallel
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within each user story, tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch models and validation in parallel:
Task T025: Update Task model in shared/schemas/index.ts
Task T026: Create task validation schemas in task-service/src/models/task-validation.ts

# After models complete, launch API endpoints in parallel:
Task T028: Implement createTask API endpoint
Task T029: Implement getUserTasks API endpoint
Task T030: Implement getTaskById API endpoint
Task T031: Implement updateTask API endpoint
Task T032: Implement deleteTask API endpoint
Task T033: Implement toggleTaskCompletion API endpoint

# Launch frontend updates in parallel with backend:
Task T041: Update frontend to call task-service API endpoints
Task T042: Update TaskItem component to use new task fields
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009)
2. Complete Phase 2: Foundational (T010-T024) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T025-T044)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy to Minikube and verify all event flows
6. Demo MVP functionality

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add User Story 6 → Test independently → Deploy/Demo
8. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (T025-T044)
   - Developer B: User Story 2 (T045-T057)
   - Developer C: User Story 3 (T058-T078)
   - Developer D: User Story 4 (T079-T093)
   - Developer E: User Story 5 (T094-T112)
   - Developer F: User Story 6 (T113-T128)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Tests are OPTIONAL per constitution (not requested in spec)

---

## Task Count Summary

- **Total Tasks**: 151
- **Setup Phase**: 9 tasks
- **Foundational Phase**: 15 tasks
- **User Story 1 (P1)**: 20 tasks
- **User Story 2 (P2)**: 13 tasks
- **User Story 3 (P3)**: 21 tasks
- **User Story 4 (P4)**: 15 tasks
- **User Story 5 (P5)**: 19 tasks
- **User Story 6 (P6)**: 16 tasks
- **Polish Phase**: 23 tasks

**Parallel Opportunities**: 60+ tasks can run in parallel across different files and services

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1) = 44 tasks for functional todo application

# Tasks: Kubernetes AI-Assisted Deployment

**Input**: Design documents from `/specs/001-k8s-ai-deployment/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: No tests requested in specification - tasks focus on deployment and operations

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Infrastructure**: `infrastructure/` at repository root
- **Docker**: `infrastructure/docker/`
- **Kubernetes**: `infrastructure/kubernetes/`
- **Helm**: `infrastructure/helm/todo-chatbot/`
- **Logs**: `logs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and prerequisite verification

- [x] T001 Verify Docker Desktop is installed and running
- [x] T002 Verify Minikube is installed (version 1.30+) ✅ User confirmed installed
- [x] T003 Verify kubectl is installed (version 1.28+)
- [x] T004 Verify Helm is installed (version 3.x) ✅ User confirmed installed
- [x] T005 Verify Node.js 18+ is installed
- [x] T006 Create infrastructure directory structure (infrastructure/docker/, infrastructure/kubernetes/, infrastructure/helm/, logs/)
- [x] T007 Verify Next.js application has standalone output mode in next.config.js
- [x] T008 [P] Create .dockerignore file in infrastructure/docker/.dockerignore
- [x] T009 [P] Initialize audit log file in logs/deployment-audit.md

**Note**: Minikube and Helm are installed but not yet in PATH. Manual commands will be provided for execution.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Start Minikube cluster with recommended resources (4 CPU, 8GB RAM, Docker driver)
- [ ] T011 Enable Minikube addons (ingress, metrics-server, dashboard)
- [ ] T012 Verify Minikube cluster is running and nodes are Ready
- [ ] T013 Point Docker CLI to Minikube Docker daemon (eval $(minikube docker-env))
- [ ] T014 Create Kubernetes Secret for database credentials and auth secrets in default namespace
- [ ] T015 Verify Secret exists and contains all required keys (DATABASE_URL, AUTH_SECRET, BETTER_AUTH_SECRET)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Deploy Application to Local Cluster (Priority: P1) 🎯 MVP

**Goal**: Deploy Todo Chatbot to Minikube with containerized application accessible via browser

**Independent Test**: Access application via browser, register user, login, create todo, verify full workflow functions

### Implementation for User Story 1

- [ ] T016 [US1] Generate Dockerfile using Gordon (Docker AI) with prompt: "Generate production-ready multi-stage Dockerfile for Next.js 16+ with standalone output, Alpine base, non-root user, port 3000" in infrastructure/docker/frontend.Dockerfile
- [ ] T017 [US1] Log Gordon prompt, generated Dockerfile, and reasoning in logs/deployment-audit.md
- [ ] T018 [US1] Build container image inside Minikube (docker build -t todo-chatbot:latest .)
- [ ] T019 [US1] Verify container image size is < 200MB and test container startup locally
- [ ] T020 [US1] Log image build command, output, and validation results in logs/deployment-audit.md
- [ ] T021 [US1] Generate Kubernetes ConfigMap manifest using kubectl-ai for non-sensitive config (NODE_ENV, PORT, LOG_LEVEL) in infrastructure/kubernetes/configmap.yaml
- [ ] T022 [US1] Generate Kubernetes Deployment manifest using kubectl-ai with specifications: 1 replica, image todo-chatbot:latest with imagePullPolicy Never, resources (256Mi/250m requests, 512Mi/500m limits), liveness probe on /api/health, readiness probe on /api/ready, envFrom ConfigMap and Secret in infrastructure/kubernetes/deployment.yaml
- [ ] T023 [US1] Generate Kubernetes Service manifest using kubectl-ai with type NodePort, port 80 → 3000, nodePort 30080 in infrastructure/kubernetes/service.yaml
- [ ] T024 [US1] Log all kubectl-ai prompts, generated manifests, and reasoning in logs/deployment-audit.md
- [ ] T025 [US1] Apply ConfigMap to Kubernetes cluster (kubectl apply -f infrastructure/kubernetes/configmap.yaml)
- [ ] T026 [US1] Apply Deployment to Kubernetes cluster (kubectl apply -f infrastructure/kubernetes/deployment.yaml)
- [ ] T027 [US1] Apply Service to Kubernetes cluster (kubectl apply -f infrastructure/kubernetes/service.yaml)
- [ ] T028 [US1] Verify all pods reach Running state and pass readiness checks within 60 seconds
- [ ] T029 [US1] Verify Service has endpoints and is accessible via minikube service command
- [ ] T030 [US1] Access application via browser and verify frontend loads successfully
- [ ] T031 [US1] Test full application workflow: register user, login, create todo, mark complete
- [ ] T032 [US1] Log deployment commands, outputs, verification results, and any issues encountered in logs/deployment-audit.md
- [ ] T033 [US1] Document fallback procedure if Gordon unavailable: use Claude Code to generate equivalent Dockerfile in logs/deployment-audit.md
- [ ] T034 [US1] Document fallback procedure if kubectl-ai unavailable: use standard kubectl with AI-generated manifests in logs/deployment-audit.md

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Application is deployed and accessible.

---

## Phase 4: User Story 2 - Package Deployment with Configuration Management (Priority: P2)

**Goal**: Package all Kubernetes resources in Helm chart for versioned, reproducible deployments

**Independent Test**: Install/uninstall Helm chart multiple times, verify consistent deployment with configurable parameters

### Implementation for User Story 2

- [ ] T035 [US2] Create Helm chart scaffold using helm create command in infrastructure/helm/todo-chatbot/
- [ ] T036 [US2] Update Chart.yaml with metadata (name: todo-chatbot, version: 0.1.0, appVersion: 1.0.0, description) in infrastructure/helm/todo-chatbot/Chart.yaml
- [ ] T037 [US2] Create values.yaml with configuration parameters (image, replicaCount, service, resources, probes, env, configMapName, secretName) in infrastructure/helm/todo-chatbot/values.yaml
- [ ] T038 [P] [US2] Create _helpers.tpl with template helper functions (name, fullname, chart, labels, selectorLabels) in infrastructure/helm/todo-chatbot/templates/_helpers.tpl
- [ ] T039 [P] [US2] Create deployment.yaml template using values and helpers in infrastructure/helm/todo-chatbot/templates/deployment.yaml
- [ ] T040 [P] [US2] Create service.yaml template using values and helpers in infrastructure/helm/todo-chatbot/templates/service.yaml
- [ ] T041 [P] [US2] Create configmap.yaml template using values and helpers in infrastructure/helm/todo-chatbot/templates/configmap.yaml
- [ ] T042 [P] [US2] Create secret.yaml template (example only, with instructions for manual creation) in infrastructure/helm/todo-chatbot/templates/secret.yaml
- [ ] T043 [US2] Create NOTES.txt with post-install instructions for accessing application in infrastructure/helm/todo-chatbot/templates/NOTES.txt
- [ ] T044 [US2] Run helm lint to validate chart structure and templates
- [ ] T045 [US2] Run helm template to verify template rendering without errors
- [ ] T046 [US2] Uninstall existing Kubernetes resources from User Story 1 (kubectl delete deployment,service,configmap)
- [ ] T047 [US2] Install Helm chart (helm install todo-chatbot infrastructure/helm/todo-chatbot)
- [ ] T048 [US2] Verify all resources created successfully and pods reach Running state
- [ ] T049 [US2] Verify application is accessible via minikube service command
- [ ] T050 [US2] Test configuration changes: upgrade chart with different replica count (helm upgrade --set replicaCount=2)
- [ ] T051 [US2] Verify configuration change applied correctly (2 pods running)
- [ ] T052 [US2] Uninstall Helm chart (helm uninstall todo-chatbot)
- [ ] T053 [US2] Verify all resources cleanly removed (kubectl get all)
- [ ] T054 [US2] Reinstall Helm chart on fresh cluster to verify reproducibility
- [ ] T055 [US2] Log all Helm commands, outputs, and validation results in logs/deployment-audit.md

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Helm chart enables versioned deployments.

---

## Phase 5: User Story 3 - Perform AI-Assisted Operations (Priority: P3)

**Goal**: Demonstrate AI-assisted scaling, debugging, and optimization capabilities

**Independent Test**: Execute AI-assisted operations and verify tools provide intelligent recommendations

### Implementation for User Story 3

- [ ] T056 [US3] Use kubectl-ai to scale deployment to 3 replicas with prompt: "Scale todo-chatbot deployment to 3 replicas"
- [ ] T057 [US3] Verify replica count increased to 3 and all pods are Running
- [ ] T058 [US3] Log kubectl-ai prompt, command executed, and scaling results in logs/deployment-audit.md
- [ ] T059 [US3] Simulate pod failure by deleting one pod (kubectl delete pod <pod-name>)
- [ ] T060 [US3] Use kubectl-ai to diagnose the issue with prompt: "Diagnose why todo-chatbot pod was terminated"
- [ ] T061 [US3] Verify kubectl-ai identifies the manual deletion and shows pod recreation
- [ ] T062 [US3] Log kubectl-ai diagnostic prompt, analysis, and recommendations in logs/deployment-audit.md
- [ ] T063 [US3] Use Kagent to analyze cluster health with command: "kagent analyze cluster"
- [ ] T064 [US3] Review Kagent recommendations for resource optimization
- [ ] T065 [US3] Log Kagent analysis prompt, health report, and optimization recommendations in logs/deployment-audit.md
- [ ] T066 [US3] Use kubectl-ai to check resource usage with prompt: "Show resource usage for todo-chatbot pods"
- [ ] T067 [US3] Log kubectl-ai resource usage prompt and results in logs/deployment-audit.md
- [ ] T068 [US3] Document fallback procedure if kubectl-ai unavailable: use standard kubectl commands (kubectl scale, kubectl describe, kubectl top) in logs/deployment-audit.md
- [ ] T069 [US3] Document fallback procedure if Kagent unavailable: use kubectl top nodes and kubectl top pods for manual analysis in logs/deployment-audit.md
- [ ] T070 [US3] Verify audit log contains at least 3 AI-assisted operations with complete prompts and outputs

**Checkpoint**: All user stories should now be independently functional. AI-assisted operations demonstrated.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [ ] T071 [P] Review and enhance audit log formatting in logs/deployment-audit.md
- [ ] T072 [P] Add troubleshooting section to quickstart.md based on issues encountered
- [ ] T073 Validate all 10 success criteria from spec.md are met
- [ ] T074 Verify deployment can be reproduced on fresh Minikube cluster in under 10 minutes
- [ ] T075 Test application with 10 concurrent user sessions to verify performance
- [ ] T076 Document any deviations from plan or specification in logs/deployment-audit.md
- [ ] T077 Create summary report of AI tool usage, fallbacks used, and lessons learned
- [ ] T078 [P] Update README.md with deployment instructions and architecture overview
- [ ] T079 Verify all infrastructure artifacts are committed to Git (except secrets)
- [ ] T080 Final validation: Run complete deployment from scratch following quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Builds on US1 but independently testable (can uninstall US1 resources and install via Helm)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires deployed application (US1 or US2) but independently testable

### Within Each User Story

- **User Story 1**: Dockerfile generation → Image build → Manifest generation → Resource deployment → Verification
- **User Story 2**: Chart scaffold → Template creation (parallel) → Lint/validate → Install → Test → Uninstall/reinstall
- **User Story 3**: Scaling operation → Diagnostic operation → Health analysis → Resource analysis → Fallback documentation

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T008, T009)
- Within US2: Template creation tasks (T038-T042) can run in parallel
- Within Polish phase: Documentation tasks (T071, T072, T078) can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch all template creation tasks for User Story 2 together:
Task T038: "Create _helpers.tpl with template helper functions"
Task T039: "Create deployment.yaml template"
Task T040: "Create service.yaml template"
Task T041: "Create configmap.yaml template"
Task T042: "Create secret.yaml template"

# These can all be created in parallel since they are different files
# with no dependencies on each other
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2 (can start in parallel, will need US1 deployed for testing)
   - Developer C: User Story 3 (can start in parallel, will need US1 or US2 deployed for testing)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- AI tools (Gordon, kubectl-ai, Kagent) are PRIMARY method with documented fallbacks
- Audit trail is MANDATORY for all AI tool interactions
- Single container image strategy (Next.js full-stack in one image)
- No tests requested in specification - focus on deployment and operations
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

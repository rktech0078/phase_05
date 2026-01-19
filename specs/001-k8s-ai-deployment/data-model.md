# Data Model: Kubernetes AI-Assisted Deployment

**Feature**: 001-k8s-ai-deployment
**Date**: 2026-01-15
**Phase**: Phase 1 - Design

## Overview

This document defines the infrastructure entities and their relationships for deploying the Todo Chatbot to Kubernetes. Unlike traditional data models that describe database schemas, this model describes the deployment architecture and resource dependencies.

## Infrastructure Entities

### 1. Container Image (Frontend)

**Purpose**: Packaged Next.js application with all runtime dependencies

**Attributes**:
- **Name**: `todo-chatbot-frontend`
- **Tag**: Version identifier (e.g., `v1.0.0`, `latest`)
- **Base Image**: `node:18-alpine`
- **Build Method**: Multi-stage Docker build
- **Size Target**: < 200MB (optimized with standalone output)
- **User**: Non-root user (nextjs:1001)
- **Exposed Port**: 3000
- **Entry Point**: `node server.js`

**Dependencies**:
- Source code from repository root
- Environment variables from ConfigMap/Secret
- Build-time: npm dependencies
- Runtime: Node.js 18+ runtime

**Generation Method**: Gordon (Docker AI) or Claude Code fallback

**Validation Criteria**:
- Image builds successfully without errors
- Image size is reasonable (< 200MB)
- Container starts and serves HTTP on port 3000
- Health check endpoint responds

### 2. Container Image (Backend)

**Purpose**: Same as frontend (Next.js is full-stack, single image may suffice)

**Note**: For this Next.js application, frontend and backend are in the same codebase. We may use a single container image for both, or separate images if we split the deployment. Research indicates Next.js API routes run in the same process, so **single image deployment is recommended**.

**Decision**: Use single container image for both frontend and backend unless separation is explicitly required.

### 3. Kubernetes Deployment (Application)

**Purpose**: Manages application pod replicas and rolling updates

**Attributes**:
- **Name**: `todo-chatbot-deployment`
- **Namespace**: `default` (or custom namespace)
- **Replicas**: 1-3 (configurable via Helm values)
- **Strategy**: RollingUpdate (maxSurge: 1, maxUnavailable: 0)
- **Selector**: `app: todo-chatbot`
- **Pod Template**:
  - Container: todo-chatbot-frontend
  - Resources: 256Mi/250m requests, 512Mi/500m limits
  - Ports: 3000
  - Environment: From ConfigMap + Secret
  - Probes: Liveness + Readiness

**Relationships**:
- **Uses**: Container Image (Frontend)
- **References**: ConfigMap (for configuration)
- **References**: Secret (for sensitive data)
- **Managed by**: Helm Release

**State Transitions**:
- Pending → Running (pods scheduled and started)
- Running → Updating (rolling update in progress)
- Running → Failed (pod crashes, restarts)
- Running → Terminating (scale down or deletion)

**Validation Criteria**:
- All replicas reach Running state
- Pods pass readiness checks
- Rolling updates complete without downtime

### 4. Kubernetes Service (Frontend)

**Purpose**: Network endpoint for accessing the application

**Attributes**:
- **Name**: `todo-chatbot-service`
- **Type**: NodePort (for Minikube access)
- **Selector**: `app: todo-chatbot`
- **Ports**:
  - Port: 80 (service port)
  - TargetPort: 3000 (container port)
  - NodePort: 30000-32767 (auto-assigned or specified)

**Relationships**:
- **Routes to**: Deployment pods (via selector)
- **Exposed via**: Minikube service command or Ingress

**Validation Criteria**:
- Service has endpoints (pods are selected)
- Service is accessible via NodePort
- Traffic routes to healthy pods only

### 5. ConfigMap (Application Configuration)

**Purpose**: Non-sensitive configuration data

**Attributes**:
- **Name**: `todo-chatbot-config`
- **Data**:
  - `NODE_ENV`: "production"
  - `PORT`: "3000"
  - `LOG_LEVEL`: "info"
  - `NEXT_TELEMETRY_DISABLED`: "1"
  - Additional app-specific config

**Relationships**:
- **Consumed by**: Deployment (environment variables)
- **Managed by**: Helm Release

**Validation Criteria**:
- ConfigMap exists in namespace
- All required keys are present
- Values are correctly formatted

### 6. Secret (Sensitive Data)

**Purpose**: Encrypted storage for sensitive configuration

**Attributes**:
- **Name**: `todo-chatbot-secrets`
- **Type**: Opaque
- **Data** (base64 encoded):
  - `DATABASE_URL`: Neon PostgreSQL connection string
  - `AUTH_SECRET`: Better Auth secret key
  - `BETTER_AUTH_SECRET`: Additional auth secret
  - Additional sensitive keys as needed

**Relationships**:
- **Consumed by**: Deployment (environment variables)
- **Managed by**: Manual creation (not in Helm chart for security)

**Security Considerations**:
- Never commit to Git
- Create manually before Helm install
- Use RBAC to restrict access
- Rotate periodically

**Validation Criteria**:
- Secret exists before deployment
- All required keys are present
- Values are base64 encoded
- Application can decode and use values

### 7. Helm Chart (Package)

**Purpose**: Versioned package containing all Kubernetes resources

**Attributes**:
- **Name**: `todo-chatbot`
- **Chart Version**: 0.1.0 (semantic versioning)
- **App Version**: 1.0.0 (application version)
- **Type**: application
- **Templates**:
  - deployment.yaml
  - service.yaml
  - configmap.yaml
  - secret.yaml (template only, not actual secret)
  - _helpers.tpl
  - NOTES.txt

**Relationships**:
- **Contains**: All Kubernetes resource templates
- **Configured by**: values.yaml
- **Manages**: Deployment, Service, ConfigMap

**Validation Criteria**:
- Chart passes `helm lint`
- Chart installs successfully
- All resources are created
- Application is accessible after install

### 8. Helm Values (Configuration)

**Purpose**: User-configurable parameters for Helm chart

**Attributes**:
- **File**: values.yaml
- **Key Sections**:
  - image: repository, tag, pullPolicy
  - replicaCount: number of pods
  - service: type, port, nodePort
  - resources: requests and limits
  - env: environment variables
  - probes: health check configuration

**Relationships**:
- **Configures**: Helm Chart templates
- **Overridable**: Via `--set` or custom values files

**Validation Criteria**:
- All required values have defaults
- Values are properly typed
- Overrides work as expected

### 9. Audit Log (Transparency Record)

**Purpose**: Complete record of AI tool interactions and commands

**Attributes**:
- **File**: logs/deployment-audit.md
- **Sections**:
  - Timestamp
  - Tool used (Gordon, kubectl-ai, Kagent, Helm)
  - Prompt sent
  - Command executed
  - Output received
  - Decision reasoning

**Relationships**:
- **Documents**: All infrastructure entity creation
- **References**: Container Images, Deployments, Services

**Validation Criteria**:
- All AI tool interactions logged
- Prompts are verbatim
- Commands and outputs are complete
- Reasoning is clear

## Entity Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                        Helm Chart                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    values.yaml                          │ │
│  │  (Configuration: replicas, resources, image tag, etc.)  │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Templates                              │ │
│  │  • deployment.yaml                                      │ │
│  │  • service.yaml                                         │ │
│  │  • configmap.yaml                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Kubernetes Resources                        │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │  ConfigMap   │      │    Secret    │                    │
│  │              │      │              │                    │
│  │ • NODE_ENV   │      │ • DATABASE   │                    │
│  │ • PORT       │      │ • AUTH_KEY   │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                      │                            │
│         └──────────┬───────────┘                            │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │     Deployment       │                            │
│         │                      │                            │
│         │  Replicas: 1-3       │                            │
│         │  Strategy: Rolling   │                            │
│         └──────────────────────┘                            │
│                    │                                         │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │    Pod (Replica)     │                            │
│         │                      │                            │
│         │  ┌────────────────┐  │                            │
│         │  │   Container    │  │                            │
│         │  │                │  │                            │
│         │  │  Image: todo-  │  │                            │
│         │  │  chatbot:v1    │  │                            │
│         │  │                │  │                            │
│         │  │  Port: 3000    │  │                            │
│         │  └────────────────┘  │                            │
│         └──────────────────────┘                            │
│                    │                                         │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │      Service         │                            │
│         │                      │                            │
│         │  Type: NodePort      │                            │
│         │  Port: 80 → 3000     │                            │
│         └──────────────────────┘                            │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   External  │
              │   Access    │
              │             │
              │  minikube   │
              │  service    │
              └─────────────┘
```

## Dependency Order

**Creation Order** (must follow this sequence):

1. **Container Image**: Build and tag Docker image
2. **Secret**: Create manually (contains sensitive data)
3. **Helm Chart**: Package all resource templates
4. **Helm Install**: Creates ConfigMap, Deployment, Service
5. **Validation**: Verify pods running, service accessible

**Deletion Order** (reverse):

1. **Helm Uninstall**: Removes Deployment, Service, ConfigMap
2. **Secret**: Delete manually (not managed by Helm)
3. **Container Image**: Remove from Minikube (optional cleanup)

## State Management

### Deployment Lifecycle

1. **Initial**: No resources exist
2. **Building**: Container image being built
3. **Packaging**: Helm chart being created
4. **Installing**: Helm creating Kubernetes resources
5. **Pending**: Pods scheduled but not running
6. **Running**: All pods healthy and ready
7. **Updating**: Rolling update in progress
8. **Degraded**: Some pods unhealthy
9. **Failed**: Deployment failed, pods crashing
10. **Terminating**: Resources being deleted

### Health States

**Pod Health**:
- **Pending**: Waiting for scheduling
- **ContainerCreating**: Pulling image, creating container
- **Running**: Container started
- **Ready**: Passed readiness probe
- **CrashLoopBackOff**: Container repeatedly crashing
- **Error**: Container failed to start
- **Terminating**: Pod being deleted

**Service Health**:
- **No Endpoints**: No pods match selector
- **Partial Endpoints**: Some pods ready
- **Full Endpoints**: All pods ready

## Validation Rules

### Container Image
- ✅ Image builds without errors
- ✅ Image size < 200MB
- ✅ Container starts successfully
- ✅ Health endpoint responds (200 OK)

### Deployment
- ✅ All replicas reach Running state
- ✅ Pods pass readiness checks within 60s
- ✅ No CrashLoopBackOff errors
- ✅ Environment variables injected correctly

### Service
- ✅ Service has endpoints (pods selected)
- ✅ Service accessible via NodePort
- ✅ Traffic routes to healthy pods only
- ✅ No connection refused errors

### ConfigMap & Secret
- ✅ All required keys present
- ✅ Values correctly formatted
- ✅ Successfully mounted in pods

### Helm Chart
- ✅ Passes `helm lint`
- ✅ Installs without errors
- ✅ All resources created
- ✅ Uninstalls cleanly

## Notes

- **Single Image Strategy**: Next.js full-stack app uses one container image for both frontend and backend
- **External Database**: Neon PostgreSQL is external to cluster, accessed via connection string in Secret
- **Stateless Design**: No persistent volumes needed, all state in external database
- **Minikube-Optimized**: NodePort service and imagePullPolicy: Never for local development

# Research: Kubernetes AI-Assisted Deployment

**Feature**: 001-k8s-ai-deployment
**Date**: 2026-01-15
**Phase**: Phase 0 - Research & Decision Making

## Overview

This document consolidates research findings for deploying the Phase III Todo Chatbot to Kubernetes using AI-assisted DevOps tools. All decisions are informed by industry best practices adapted for a hackathon learning environment.

## Research Areas

### 1. Next.js Containerization Strategy

**Decision**: Use multi-stage Docker builds with standalone output mode

**Rationale**:
- Multi-stage builds reduce final image size by 60-80% (only runtime dependencies included)
- Standalone output mode (Next.js feature) bundles only necessary dependencies
- Alpine Linux base provides minimal attack surface and smaller image size
- Non-root user execution improves security posture

**Alternatives Considered**:
- Single-stage build: Rejected due to large image size (includes dev dependencies)
- Full Node.js image: Rejected due to unnecessary bloat (Alpine is sufficient)
- Root user execution: Rejected due to security concerns

**Implementation Approach**:
- Stage 1: Install production dependencies only
- Stage 2: Build Next.js application with standalone output
- Stage 3: Copy only runtime artifacts to minimal Alpine image
- Use Gordon (Docker AI) to generate Dockerfile following this pattern
- Fallback: Claude Code generates equivalent Dockerfile if Gordon unavailable

**Key Configuration**:
```javascript
// next.config.js requirement
module.exports = {
  output: 'standalone',  // Critical for minimal container size
  compress: true,
  poweredByHeader: false,
}
```

### 2. Kubernetes Deployment Pattern

**Decision**: Use Deployment (not StatefulSet) with NodePort service for Minikube

**Rationale**:
- Next.js applications are stateless (no persistent identity needed)
- Deployment supports rolling updates and horizontal scaling
- NodePort provides simplest access method in Minikube environment
- ClusterIP + Ingress is production pattern but adds complexity for demo

**Alternatives Considered**:
- StatefulSet: Rejected - only needed for stateful apps (databases, message queues)
- LoadBalancer service: Rejected - requires cloud provider or minikube tunnel
- ClusterIP + Ingress: Deferred to optional enhancement (adds complexity)

**Resource Allocation**:
- Requests: 256Mi memory, 250m CPU (guaranteed resources)
- Limits: 512Mi memory, 500m CPU (prevent resource exhaustion)
- Quality of Service: Burstable (requests < limits, flexible for web apps)

**Health Check Strategy**:
- Liveness probe: Simple `/api/health` endpoint (restart if unhealthy)
- Readiness probe: `/api/ready` with database connectivity check (remove from load balancer if not ready)
- Initial delay: 30s for liveness, 10s for readiness (allow Next.js startup time)

### 3. Helm Chart Structure

**Decision**: Standard Helm chart structure with values-driven configuration

**Rationale**:
- Helm provides versioning, rollback, and reproducibility
- Values.yaml enables configuration without modifying templates
- Standard structure follows Kubernetes community conventions
- Template helpers (_helpers.tpl) reduce duplication

**Chart Organization**:
```
helm/todo-chatbot/
├── Chart.yaml           # Metadata (chart version, app version)
├── values.yaml          # Default configuration
├── templates/
│   ├── _helpers.tpl     # Reusable template functions
│   ├── deployment.yaml  # Frontend/backend deployments
│   ├── service.yaml     # Service definitions
│   ├── configmap.yaml   # Non-sensitive configuration
│   ├── secret.yaml      # Sensitive data (template only)
│   └── NOTES.txt        # Post-install instructions
```

**Versioning Strategy**:
- Chart version: Semantic versioning for Helm chart changes
- App version: Tracks application version independently
- Use `--set image.tag=vX.Y.Z` to override at install time

### 4. Minikube Configuration

**Decision**: 4 CPU, 8GB RAM, Docker driver with essential addons

**Rationale**:
- 4 CPUs: 2 for system overhead, 2 for application workloads
- 8GB RAM: 4GB for Minikube, 4GB for application pods
- Docker driver: Most compatible across Windows/Mac/Linux
- Ingress addon: Enables production-like patterns (optional)
- Metrics-server addon: Required for horizontal pod autoscaling

**Minimum Configuration** (if resources constrained):
- 2 CPUs, 4GB RAM sufficient for basic demo
- May limit concurrent operations and scaling demonstrations

**Image Loading Strategy**:
- Build inside Minikube Docker daemon: `eval $(minikube docker-env)`
- Use `imagePullPolicy: Never` to prevent pull attempts
- Fastest approach for local development and demos

**Service Exposure**:
- Primary: NodePort with `minikube service <name>` command
- Alternative: Port forwarding for localhost access
- Advanced: Ingress for production-like routing (optional)

### 5. Secrets and Configuration Management

**Decision**: Kubernetes Secrets for sensitive data, ConfigMaps for public configuration

**Rationale**:
- Secrets provide base64 encoding and RBAC protection
- ConfigMaps separate configuration from code
- Environment variable injection is simplest for Next.js
- External database (Neon PostgreSQL) requires only connection string

**Data Classification**:
| Data Type | Storage | Example |
|-----------|---------|---------|
| Database credentials | Secret | DATABASE_URL, AUTH_SECRET |
| API keys | Secret | Third-party service keys |
| Public URLs | ConfigMap | API endpoints, CDN URLs |
| Feature flags | ConfigMap | Boolean flags, feature names |
| Environment settings | ConfigMap | NODE_ENV, LOG_LEVEL |

**Injection Method**:
```yaml
envFrom:
  - configMapRef:
      name: todo-chatbot-config
  - secretRef:
      name: todo-chatbot-secrets
```

**Security Best Practices**:
- Never commit secrets to Git (use .gitignore)
- Document secret creation in README with example template
- Use `kubectl create secret` from literals for hackathon
- Production: Consider Sealed Secrets or external secret managers

### 6. AI Tool Integration Strategy

**Decision**: Gordon for Docker, kubectl-ai for Kubernetes, Kagent for optimization, Helm for packaging

**Rationale**:
- Each tool specializes in specific domain (follows Tool Hierarchy principle)
- AI-generated artifacts ensure learning objectives are met
- Fallback to Claude Code maintains flexibility
- Complete audit trail satisfies transparency requirements

**Tool Usage Plan**:

**Gordon (Docker AI)**:
- Generate Dockerfile for Next.js application
- Explain containerization decisions
- Optimize build process
- Fallback: Claude Code generates equivalent Dockerfile

**kubectl-ai**:
- Generate Kubernetes deployment manifests
- Create service definitions
- Perform scaling operations
- Diagnose pod failures
- Fallback: Standard kubectl with documented reasoning

**Kagent**:
- Analyze cluster health
- Recommend resource optimizations
- Identify performance bottlenecks
- Fallback: Manual kubectl commands for metrics

**Helm**:
- Package all Kubernetes resources
- Manage configuration values
- Enable versioned deployments
- No fallback needed (standard CLI tool)

**Audit Trail Requirements**:
- Log exact prompts sent to each AI tool
- Capture all commands executed
- Record outputs and responses
- Document reasoning for tool selection
- Store in `logs/deployment-audit.md`

## Key Decisions Summary

1. **Containerization**: Multi-stage Docker build with standalone Next.js output
2. **Deployment Pattern**: Kubernetes Deployment (stateless) with NodePort service
3. **Resource Allocation**: 256Mi/250m requests, 512Mi/500m limits
4. **Health Checks**: Liveness on `/api/health`, readiness on `/api/ready`
5. **Packaging**: Standard Helm chart with values-driven configuration
6. **Minikube Setup**: 4 CPU, 8GB RAM, Docker driver, ingress + metrics-server addons
7. **Image Strategy**: Build inside Minikube Docker daemon, imagePullPolicy: Never
8. **Service Exposure**: NodePort for simplicity, optional Ingress for learning
9. **Configuration**: Secrets for sensitive data, ConfigMaps for public config
10. **AI Tools**: Gordon (Docker), kubectl-ai (K8s), Kagent (optimization), Helm (packaging)

## Implementation Risks and Mitigations

**Risk 1: AI tools unavailable or fail**
- Mitigation: Documented fallback to Claude Code for equivalent generation
- Mitigation: Test tool availability before starting implementation

**Risk 2: Insufficient local resources**
- Mitigation: Document minimum requirements (2 CPU, 4GB RAM)
- Mitigation: Provide resource-constrained configuration option

**Risk 3: Database connectivity from Kubernetes**
- Mitigation: Use Kubernetes Secret for connection string
- Mitigation: Implement readiness probe to verify connectivity
- Mitigation: Document network requirements for Neon PostgreSQL access

**Risk 4: Next.js environment variable handling**
- Mitigation: Use standalone output mode for runtime variables
- Mitigation: Document NEXT_PUBLIC_* vs server-side variables
- Mitigation: Test environment variable injection before deployment

**Risk 5: Image build failures**
- Mitigation: Use proven multi-stage Dockerfile pattern
- Mitigation: Test build locally before Minikube deployment
- Mitigation: Document common build issues and solutions

## Next Steps

Phase 1 artifacts to be created:
1. **data-model.md**: Document deployment entities and relationships
2. **contracts/**: Specifications for Docker, Kubernetes, and Helm resources
3. **quickstart.md**: Step-by-step deployment guide
4. **Agent context update**: Add technology stack to agent-specific file

All decisions documented here will guide the task breakdown in Phase 2 (`/sp.tasks` command).

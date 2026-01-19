# Kubernetes Contracts: Resource Specifications

**Feature**: 001-k8s-ai-deployment
**Date**: 2026-01-15
**Phase**: Phase 1 - Design

## Overview

This document specifies the contracts for all Kubernetes resources required to deploy the Todo Chatbot. These specifications guide AI-assisted manifest generation using kubectl-ai or Claude Code.

## Resource: Deployment

### Metadata

**Name**: `todo-chatbot-deployment`
**Namespace**: `default`
**Labels**:
- `app: todo-chatbot`
- `version: v1`
- `managed-by: helm`

### Specification

**API Version**: `apps/v1`
**Kind**: `Deployment`

**Replicas**: 1 (configurable via Helm: 1-3)

**Selector**:
```yaml
matchLabels:
  app: todo-chatbot
```

**Strategy**:
- **Type**: RollingUpdate
- **Max Surge**: 1 (allow 1 extra pod during update)
- **Max Unavailable**: 0 (ensure zero downtime)

### Pod Template

**Labels**:
- `app: todo-chatbot`
- `version: v1`

**Container Specification**:

**Name**: `todo-chatbot`
**Image**: `todo-chatbot:latest`
**Image Pull Policy**: `Never` (for Minikube)

**Ports**:
- **Container Port**: 3000
- **Protocol**: TCP
- **Name**: http

**Environment Variables**:

From ConfigMap:
```yaml
envFrom:
  - configMapRef:
      name: todo-chatbot-config
```

From Secret:
```yaml
envFrom:
  - secretRef:
      name: todo-chatbot-secrets
```

**Resource Requirements**:
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

**Liveness Probe**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
    scheme: HTTP
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  successThreshold: 1
  failureThreshold: 3
```

**Readiness Probe**:
```yaml
readinessProbe:
  httpGet:
    path: /api/ready
    port: 3000
    scheme: HTTP
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  successThreshold: 1
  failureThreshold: 2
```

### Validation Criteria

**Pre-Deployment**:
- ✅ Container image exists in Minikube
- ✅ ConfigMap exists
- ✅ Secret exists
- ✅ Resource requests fit within node capacity

**Post-Deployment**:
- ✅ All replicas reach Running state within 60s
- ✅ Pods pass readiness probe within 30s
- ✅ No CrashLoopBackOff errors
- ✅ Logs show successful startup

**Validation Commands**:
```bash
# Check deployment status
kubectl get deployment todo-chatbot-deployment

# Check pod status
kubectl get pods -l app=todo-chatbot

# Check pod details
kubectl describe pod -l app=todo-chatbot

# Check logs
kubectl logs -l app=todo-chatbot --tail=50

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

---

## Resource: Service

### Metadata

**Name**: `todo-chatbot-service`
**Namespace**: `default`
**Labels**:
- `app: todo-chatbot`
- `managed-by: helm`

### Specification

**API Version**: `v1`
**Kind**: `Service`

**Type**: `NodePort` (for Minikube access)

**Selector**:
```yaml
selector:
  app: todo-chatbot
```

**Ports**:
```yaml
ports:
  - name: http
    protocol: TCP
    port: 80          # Service port
    targetPort: 3000  # Container port
    nodePort: 30080   # Optional: specify NodePort (30000-32767)
```

### Service Behavior

**Session Affinity**: None (stateless application)
**IP Family**: IPv4
**Cluster IP**: Auto-assigned by Kubernetes

### Access Methods

**Via Minikube Service**:
```bash
minikube service todo-chatbot-service
# Opens browser automatically
```

**Via Minikube IP**:
```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Get NodePort
NODE_PORT=$(kubectl get svc todo-chatbot-service -o jsonpath='{.spec.ports[0].nodePort}')

# Access application
curl http://$MINIKUBE_IP:$NODE_PORT
```

**Via Port Forward** (alternative):
```bash
kubectl port-forward service/todo-chatbot-service 8080:80
# Access at http://localhost:8080
```

### Validation Criteria

**Pre-Deployment**:
- ✅ Deployment exists with matching selector
- ✅ At least one pod is ready

**Post-Deployment**:
- ✅ Service has endpoints (pods selected)
- ✅ Service is accessible via NodePort
- ✅ HTTP requests return 200 OK
- ✅ No connection refused errors

**Validation Commands**:
```bash
# Check service
kubectl get svc todo-chatbot-service

# Check endpoints
kubectl get endpoints todo-chatbot-service

# Test connectivity
kubectl run test-pod --rm -it --image=curlimages/curl -- curl http://todo-chatbot-service/api/health

# Access via Minikube
minikube service todo-chatbot-service --url
```

---

## Resource: ConfigMap

### Metadata

**Name**: `todo-chatbot-config`
**Namespace**: `default`
**Labels**:
- `app: todo-chatbot`
- `managed-by: helm`

### Data

**Non-Sensitive Configuration**:
```yaml
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOG_LEVEL: "info"
  NEXT_TELEMETRY_DISABLED: "1"
```

**Optional Configuration** (add as needed):
- `API_TIMEOUT`: "30000"
- `MAX_CONNECTIONS`: "100"
- `FEATURE_FLAGS`: "feature1,feature2"

### Usage

**Injected as Environment Variables**:
```yaml
envFrom:
  - configMapRef:
      name: todo-chatbot-config
```

**Mounted as Files** (alternative, not used):
```yaml
volumeMounts:
  - name: config-volume
    mountPath: /app/config
volumes:
  - name: config-volume
    configMap:
      name: todo-chatbot-config
```

### Validation Criteria

- ✅ ConfigMap exists before deployment
- ✅ All required keys are present
- ✅ Values are correctly formatted (strings)
- ✅ Environment variables appear in pod

**Validation Commands**:
```bash
# Check ConfigMap
kubectl get configmap todo-chatbot-config

# View ConfigMap data
kubectl describe configmap todo-chatbot-config

# Verify in pod
kubectl exec -it <pod-name> -- env | grep NODE_ENV
```

---

## Resource: Secret

### Metadata

**Name**: `todo-chatbot-secrets`
**Namespace**: `default`
**Labels**:
- `app: todo-chatbot`
- `managed-by: manual` (not Helm)

**Type**: `Opaque`

### Data

**Sensitive Configuration** (base64 encoded):
```yaml
data:
  DATABASE_URL: <base64-encoded-connection-string>
  AUTH_SECRET: <base64-encoded-secret>
  BETTER_AUTH_SECRET: <base64-encoded-secret>
```

### Creation Method

**Manual Creation** (recommended for hackathon):
```bash
kubectl create secret generic todo-chatbot-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=AUTH_SECRET="your-auth-secret" \
  --from-literal=BETTER_AUTH_SECRET="your-better-auth-secret"
```

**From File** (alternative):
```bash
# Create .env file (DO NOT COMMIT)
cat > .env <<EOF
DATABASE_URL=postgresql://user:pass@host:5432/db
AUTH_SECRET=your-auth-secret
BETTER_AUTH_SECRET=your-better-auth-secret
EOF

# Create secret from file
kubectl create secret generic todo-chatbot-secrets --from-env-file=.env

# Delete .env file
rm .env
```

### Security Requirements

- ❌ Never commit secrets to Git
- ✅ Create manually before Helm install
- ✅ Use RBAC to restrict access
- ✅ Document creation in quickstart guide
- ✅ Provide template (secret.yaml.example)

### Usage

**Injected as Environment Variables**:
```yaml
envFrom:
  - secretRef:
      name: todo-chatbot-secrets
```

### Validation Criteria

- ✅ Secret exists before deployment
- ✅ All required keys are present
- ✅ Values are base64 encoded
- ✅ Application can decode and use values
- ✅ Database connection succeeds

**Validation Commands**:
```bash
# Check secret exists
kubectl get secret todo-chatbot-secrets

# View secret keys (not values)
kubectl describe secret todo-chatbot-secrets

# Decode secret (for debugging only)
kubectl get secret todo-chatbot-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d

# Verify in pod
kubectl exec -it <pod-name> -- env | grep DATABASE_URL
```

---

## AI Tool Integration

### kubectl-ai Prompt Templates

**Generate Deployment**:
```
Create a Kubernetes Deployment for a Next.js application named "todo-chatbot" with:
- 1 replica
- Container image: todo-chatbot:latest with imagePullPolicy Never
- Container port 3000
- Resource requests: 256Mi memory, 250m CPU
- Resource limits: 512Mi memory, 500m CPU
- Liveness probe on /api/health with 30s initial delay
- Readiness probe on /api/ready with 10s initial delay
- Environment variables from ConfigMap "todo-chatbot-config"
- Environment variables from Secret "todo-chatbot-secrets"
- Rolling update strategy with maxSurge 1 and maxUnavailable 0
```

**Generate Service**:
```
Create a Kubernetes NodePort Service for the todo-chatbot deployment with:
- Service name: todo-chatbot-service
- Selector: app=todo-chatbot
- Service port 80 mapping to container port 3000
- NodePort 30080
```

**Generate ConfigMap**:
```
Create a Kubernetes ConfigMap named "todo-chatbot-config" with:
- NODE_ENV: production
- PORT: 3000
- LOG_LEVEL: info
- NEXT_TELEMETRY_DISABLED: 1
```

### Fallback (Claude Code) Approach

If kubectl-ai is unavailable:
1. Request manifest generation from Claude Code with same requirements
2. Document fallback reasoning in audit log
3. Validate generated manifests against contract specifications
4. Apply manifests using standard kubectl

### Deployment Commands

**Using kubectl-ai** (preferred):
```bash
# Generate and apply deployment
kubectl-ai "deploy todo-chatbot application with specifications from contract"

# Generate and apply service
kubectl-ai "create NodePort service for todo-chatbot on port 80"
```

**Using kubectl** (fallback):
```bash
# Apply manifests
kubectl apply -f infrastructure/kubernetes/deployment.yaml
kubectl apply -f infrastructure/kubernetes/service.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
```

### Audit Trail Requirements

For each resource creation, log:
- Tool used (kubectl-ai or kubectl)
- Prompt sent (if kubectl-ai)
- Manifest generated (full YAML)
- Apply command executed
- Apply output (success/failure, warnings)
- Resource status after creation
- Any modifications made to generated manifests

Store in: `logs/deployment-audit.md`

---

## Troubleshooting Guide

### Issue: Pods stuck in Pending

**Symptoms**: `kubectl get pods` shows Pending status

**Diagnosis**:
```bash
kubectl describe pod <pod-name>
# Look for: "Insufficient cpu" or "Insufficient memory"
```

**Solutions**:
- Reduce resource requests in deployment
- Increase Minikube resources: `minikube start --cpus=4 --memory=8192`

### Issue: Pods in CrashLoopBackOff

**Symptoms**: Pods repeatedly restarting

**Diagnosis**:
```bash
kubectl logs <pod-name> --previous
kubectl describe pod <pod-name>
```

**Common Causes**:
- Missing environment variables (check Secret exists)
- Database connection failure (check DATABASE_URL)
- Application startup error (check logs)

**Solutions**:
- Verify Secret: `kubectl get secret todo-chatbot-secrets`
- Test database connectivity from pod
- Check application logs for errors

### Issue: Service has no endpoints

**Symptoms**: `kubectl get endpoints` shows no endpoints

**Diagnosis**:
```bash
kubectl get pods -l app=todo-chatbot
kubectl describe service todo-chatbot-service
```

**Common Causes**:
- No pods match service selector
- Pods not ready (failing readiness probe)

**Solutions**:
- Verify selector matches pod labels
- Check pod readiness: `kubectl get pods`
- Check readiness probe endpoint: `/api/ready`

### Issue: Cannot access service via NodePort

**Symptoms**: Connection refused or timeout

**Diagnosis**:
```bash
minikube service todo-chatbot-service --url
curl <url>
```

**Common Causes**:
- Minikube not running
- Service not created
- Firewall blocking port

**Solutions**:
- Verify Minikube: `minikube status`
- Use `minikube service` command instead of direct IP
- Try port forwarding: `kubectl port-forward svc/todo-chatbot-service 8080:80`

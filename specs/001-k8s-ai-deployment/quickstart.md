# Quickstart Guide: Kubernetes AI-Assisted Deployment

**Feature**: 001-k8s-ai-deployment
**Date**: 2026-01-15
**Phase**: Phase 1 - Design

## Overview

This guide provides step-by-step instructions for deploying the Todo Chatbot to a local Kubernetes cluster using AI-assisted DevOps tools. Follow these steps in order to achieve a successful deployment.

## Prerequisites

### Required Software

- **Docker Desktop**: Container runtime (version 20.x or later)
- **Minikube**: Local Kubernetes cluster (version 1.30 or later)
- **kubectl**: Kubernetes CLI (version 1.28 or later)
- **Helm**: Kubernetes package manager (version 3.x)
- **Node.js**: Version 18 or later (for local testing)

### Optional AI Tools

- **Gordon**: Docker AI Agent (for intelligent Dockerfile generation)
- **kubectl-ai**: AI-assisted Kubernetes operations
- **Kagent**: Cluster health analysis and optimization

**Note**: If AI tools are unavailable, Claude Code will generate equivalent commands and artifacts.

### System Requirements

**Minimum**:
- 2 CPU cores
- 4GB RAM
- 20GB disk space

**Recommended**:
- 4 CPU cores
- 8GB RAM
- 20GB disk space

### Verify Prerequisites

```bash
# Check Docker
docker --version
docker ps

# Check Minikube
minikube version

# Check kubectl
kubectl version --client

# Check Helm
helm version

# Check Node.js
node --version
npm --version
```

---

## Step 1: Start Minikube

### Start Cluster

```bash
# Start Minikube with recommended resources
minikube start --cpus=4 --memory=8192 --driver=docker

# Or minimum configuration
minikube start --cpus=2 --memory=4096 --driver=docker
```

### Enable Required Addons

```bash
# Enable ingress (optional, for production-like routing)
minikube addons enable ingress

# Enable metrics-server (for autoscaling)
minikube addons enable metrics-server

# Enable dashboard (for visual monitoring)
minikube addons enable dashboard
```

### Verify Cluster

```bash
# Check cluster status
minikube status

# Check nodes
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system
```

**Expected Output**:
- Minikube status: Running
- Node status: Ready
- System pods: All Running

---

## Step 2: Prepare Application

### Navigate to Project Root

```bash
cd "D:\AGENTIC_AI\Hackhathon 2\phase_04"
```

### Verify Application Files

```bash
# Check Next.js configuration
cat next.config.js | grep standalone

# Check package.json
cat package.json | grep next

# Verify application structure
ls -la app/
ls -la components/
```

**Required**: `next.config.js` must have `output: 'standalone'`

### Test Application Locally (Optional)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser: http://localhost:3000
# Verify application works before containerizing
```

---

## Step 3: Build Container Image

### Point Docker to Minikube

```bash
# Configure Docker CLI to use Minikube's Docker daemon
eval $(minikube docker-env)

# Verify connection
docker ps
```

**Note**: This ensures images are built inside Minikube, avoiding the need to push to a registry.

### Generate Dockerfile (AI-Assisted)

**Option A: Using Gordon (Docker AI)**

```bash
# Prompt Gordon to generate Dockerfile
gordon generate dockerfile \
  --framework nextjs \
  --version 16 \
  --output standalone \
  --optimize production

# Gordon will create: infrastructure/docker/frontend.Dockerfile
```

**Option B: Using Claude Code (Fallback)**

```bash
# Request Dockerfile generation from Claude Code
# Prompt: "Generate a production-ready multi-stage Dockerfile for Next.js 16+
# with standalone output, Alpine base, non-root user, and port 3000"

# Save generated Dockerfile to: infrastructure/docker/frontend.Dockerfile
```

**Option C: Manual Creation (Last Resort)**

Create `infrastructure/docker/frontend.Dockerfile` with multi-stage build pattern (see docker-contracts.md for specification).

### Build Image

```bash
# Create infrastructure directory
mkdir -p infrastructure/docker

# Build image (using generated Dockerfile)
docker build -f infrastructure/docker/frontend.Dockerfile -t todo-chatbot:latest .

# Verify image
docker images | grep todo-chatbot
```

**Expected Output**:
- Image size: < 200MB
- Tag: latest

### Test Container Locally (Optional)

```bash
# Run container
docker run -d -p 3000:3000 --name test-todo \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-neon-connection-string" \
  todo-chatbot:latest

# Wait for startup
sleep 10

# Test health endpoint
curl http://localhost:3000/api/health

# Stop and remove test container
docker stop test-todo && docker rm test-todo
```

---

## Step 4: Create Kubernetes Secret

### Prepare Secret Values

**Required Secrets**:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `AUTH_SECRET`: Better Auth secret key
- `BETTER_AUTH_SECRET`: Additional auth secret

### Create Secret

```bash
# Create secret from literals
kubectl create secret generic todo-chatbot-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host.neon.tech:5432/dbname?sslmode=require" \
  --from-literal=AUTH_SECRET="your-auth-secret-key-here" \
  --from-literal=BETTER_AUTH_SECRET="your-better-auth-secret-here"

# Verify secret created
kubectl get secret todo-chatbot-secrets

# View secret keys (not values)
kubectl describe secret todo-chatbot-secrets
```

**Security Note**: Never commit these values to Git. Store them securely.

---

## Step 5: Create Helm Chart

### Generate Chart Scaffold

```bash
# Create Helm chart directory
mkdir -p infrastructure/helm

# Generate chart scaffold
helm create infrastructure/helm/todo-chatbot

# Verify structure
ls -la infrastructure/helm/todo-chatbot/
```

### Customize Chart Files

**Edit Chart.yaml**:
```bash
cat > infrastructure/helm/todo-chatbot/Chart.yaml <<EOF
apiVersion: v2
name: todo-chatbot
description: Helm chart for deploying Todo Chatbot to Kubernetes
type: application
version: 0.1.0
appVersion: "1.0.0"
EOF
```

**Edit values.yaml**:
```bash
cat > infrastructure/helm/todo-chatbot/values.yaml <<EOF
image:
  repository: todo-chatbot
  pullPolicy: Never
  tag: "latest"

replicaCount: 1

service:
  type: NodePort
  port: 80
  targetPort: 3000
  nodePort: 30080

resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi

livenessProbe:
  enabled: true
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  enabled: true
  httpGet:
    path: /api/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2

env:
  - name: NODE_ENV
    value: production
  - name: PORT
    value: "3000"
  - name: LOG_LEVEL
    value: info
  - name: NEXT_TELEMETRY_DISABLED
    value: "1"

configMapName: todo-chatbot-config
secretName: todo-chatbot-secrets
EOF
```

**Create Templates** (see helm-contracts.md for full specifications):
- `templates/_helpers.tpl`
- `templates/deployment.yaml`
- `templates/service.yaml`
- `templates/configmap.yaml`
- `templates/NOTES.txt`

### Validate Chart

```bash
# Lint chart
helm lint infrastructure/helm/todo-chatbot

# Dry-run template rendering
helm template todo-chatbot infrastructure/helm/todo-chatbot --debug
```

**Expected Output**: No errors or warnings

---

## Step 6: Deploy to Kubernetes

### Install Helm Chart

```bash
# Install chart
helm install todo-chatbot infrastructure/helm/todo-chatbot

# Watch deployment progress
kubectl get pods -w

# Wait for pods to be ready (Ctrl+C to stop watching)
```

**Expected Output**:
```
NAME                                     READY   STATUS    RESTARTS   AGE
todo-chatbot-deployment-xxxxxxxxx-xxxxx  1/1     Running   0          30s
```

### Verify Deployment

```bash
# Check deployment
kubectl get deployment todo-chatbot-deployment

# Check pods
kubectl get pods -l app.kubernetes.io/name=todo-chatbot

# Check service
kubectl get svc todo-chatbot-service

# Check endpoints
kubectl get endpoints todo-chatbot-service

# Check logs
kubectl logs -l app.kubernetes.io/name=todo-chatbot --tail=50
```

---

## Step 7: Access Application

### Get Access URL

```bash
# Option 1: Use minikube service (recommended)
minikube service todo-chatbot-service

# This will open the application in your default browser
```

### Alternative Access Methods

**Option 2: Get URL manually**:
```bash
# Get Minikube IP
MINIKUBE_IP=$(minikube ip)

# Get NodePort
NODE_PORT=$(kubectl get svc todo-chatbot-service -o jsonpath='{.spec.ports[0].nodePort}')

# Access application
echo "Application URL: http://$MINIKUBE_IP:$NODE_PORT"
open "http://$MINIKUBE_IP:$NODE_PORT"  # macOS
# or
start "http://$MINIKUBE_IP:$NODE_PORT"  # Windows
```

**Option 3: Port forwarding**:
```bash
# Forward service port to localhost
kubectl port-forward service/todo-chatbot-service 8080:80

# Access at: http://localhost:8080
```

### Test Application

1. Open application in browser
2. Register a new user account
3. Login with credentials
4. Create a new todo task
5. Mark task as complete
6. Verify all features work correctly

---

## Step 8: AI-Assisted Operations (Optional)

### Scale Application (kubectl-ai)

**Using kubectl-ai**:
```bash
# Scale to 3 replicas
kubectl-ai "scale todo-chatbot deployment to 3 replicas"

# Verify scaling
kubectl get pods -l app.kubernetes.io/name=todo-chatbot
```

**Using kubectl (fallback)**:
```bash
# Scale deployment
kubectl scale deployment todo-chatbot-deployment --replicas=3

# Watch pods being created
kubectl get pods -w
```

### Debug Issues (kubectl-ai)

**Using kubectl-ai**:
```bash
# Diagnose pod failures
kubectl-ai "diagnose why todo-chatbot pods are failing"

# Check resource usage
kubectl-ai "show resource usage for todo-chatbot pods"
```

**Using kubectl (fallback)**:
```bash
# Describe pod
kubectl describe pod -l app.kubernetes.io/name=todo-chatbot

# Check logs
kubectl logs -l app.kubernetes.io/name=todo-chatbot --tail=100

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

### Analyze Cluster Health (Kagent)

**Using Kagent**:
```bash
# Analyze cluster health
kagent analyze cluster

# Get optimization recommendations
kagent recommend optimizations
```

**Using kubectl (fallback)**:
```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods

# Check cluster info
kubectl cluster-info
```

---

## Maintenance Operations

### Update Application

```bash
# Rebuild image with new code
eval $(minikube docker-env)
docker build -f infrastructure/docker/frontend.Dockerfile -t todo-chatbot:v1.1.0 .

# Update Helm release
helm upgrade todo-chatbot infrastructure/helm/todo-chatbot \
  --set image.tag=v1.1.0

# Watch rolling update
kubectl rollout status deployment todo-chatbot-deployment
```

### View Logs

```bash
# Stream logs from all pods
kubectl logs -f -l app.kubernetes.io/name=todo-chatbot

# View logs from specific pod
kubectl logs <pod-name>

# View previous container logs (if crashed)
kubectl logs <pod-name> --previous
```

### Restart Deployment

```bash
# Restart all pods (rolling restart)
kubectl rollout restart deployment todo-chatbot-deployment

# Watch restart progress
kubectl rollout status deployment todo-chatbot-deployment
```

### Rollback Deployment

```bash
# View rollout history
helm history todo-chatbot

# Rollback to previous version
helm rollback todo-chatbot

# Rollback to specific revision
helm rollback todo-chatbot 1
```

---

## Cleanup

### Uninstall Application

```bash
# Uninstall Helm release
helm uninstall todo-chatbot

# Verify resources removed
kubectl get all -l app.kubernetes.io/instance=todo-chatbot

# Delete secret (not managed by Helm)
kubectl delete secret todo-chatbot-secrets
```

### Stop Minikube

```bash
# Stop cluster (preserves state)
minikube stop

# Delete cluster (removes all data)
minikube delete
```

### Clean Docker Images

```bash
# Remove Docker images
docker rmi todo-chatbot:latest

# Clean up unused images
docker image prune -a
```

---

## Troubleshooting

### Issue: Pods stuck in Pending

**Symptoms**: `kubectl get pods` shows Pending status

**Solutions**:
```bash
# Check node resources
kubectl describe nodes

# Check pod events
kubectl describe pod <pod-name>

# Reduce resource requests or increase Minikube resources
minikube start --cpus=4 --memory=8192
```

### Issue: Pods in CrashLoopBackOff

**Symptoms**: Pods repeatedly restarting

**Solutions**:
```bash
# Check logs
kubectl logs <pod-name> --previous

# Verify secret exists
kubectl get secret todo-chatbot-secrets

# Check environment variables
kubectl exec <pod-name> -- env | grep DATABASE_URL

# Test database connectivity
kubectl exec <pod-name> -- curl -v <database-host>:5432
```

### Issue: Cannot access application

**Symptoms**: Connection refused or timeout

**Solutions**:
```bash
# Verify service has endpoints
kubectl get endpoints todo-chatbot-service

# Check pod status
kubectl get pods -l app.kubernetes.io/name=todo-chatbot

# Use minikube service command
minikube service todo-chatbot-service

# Try port forwarding
kubectl port-forward service/todo-chatbot-service 8080:80
```

### Issue: Image not found

**Symptoms**: ImagePullBackOff or ErrImagePull

**Solutions**:
```bash
# Verify image exists in Minikube
eval $(minikube docker-env)
docker images | grep todo-chatbot

# Rebuild image
docker build -f infrastructure/docker/frontend.Dockerfile -t todo-chatbot:latest .

# Verify imagePullPolicy is Never
kubectl get deployment todo-chatbot-deployment -o yaml | grep imagePullPolicy
```

---

## Success Criteria Checklist

- [ ] Minikube cluster running with sufficient resources
- [ ] Container image built successfully (< 200MB)
- [ ] Kubernetes secret created with database credentials
- [ ] Helm chart passes lint validation
- [ ] Deployment successful with all pods Running
- [ ] Pods pass readiness checks
- [ ] Service has endpoints
- [ ] Application accessible via browser
- [ ] User registration and login work
- [ ] Todo creation and management work
- [ ] At least 3 AI-assisted operations demonstrated
- [ ] Complete audit trail logged

---

## Next Steps

After successful deployment:

1. **Run `/sp.tasks`**: Generate detailed task breakdown for implementation
2. **Execute tasks**: Follow task list to complete deployment
3. **Demonstrate AI operations**: Scale, debug, optimize using AI tools
4. **Document audit trail**: Log all prompts, commands, and outputs
5. **Validate success criteria**: Verify all 10 success criteria are met

---

## Additional Resources

- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Helm Documentation**: https://helm.sh/docs/
- **Minikube Documentation**: https://minikube.sigs.k8s.io/docs/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review contract specifications in `contracts/` directory
3. Consult research findings in `research.md`
4. Review audit trail in `logs/deployment-audit.md`

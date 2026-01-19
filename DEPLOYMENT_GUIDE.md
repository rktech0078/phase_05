# Manual Execution Guide: Kubernetes AI-Assisted Deployment

**Feature**: 001-k8s-ai-deployment
**Date**: 2026-01-15
**Purpose**: Step-by-step commands for manual execution after PATH is updated

---

## Prerequisites

Before running these commands, ensure:
1. Minikube and Helm are in your PATH (restart terminal/IDE if needed)
2. Docker Desktop is running
3. You have your database credentials ready

---

## Phase 2: Foundational Setup

### Step 1: Start Minikube Cluster

```bash
# Start Minikube with recommended resources
minikube start --cpus=4 --memory=8192 --driver=docker

# If resources are limited, use minimum configuration:
# minikube start --cpus=2 --memory=4096 --driver=docker
```

**Expected Output**: Minikube cluster starts successfully, nodes are Ready.

---

### Step 2: Enable Minikube Addons

```bash
# Enable ingress controller (optional)
minikube addons enable ingress

# Enable metrics server (for autoscaling)
minikube addons enable metrics-server

# Enable dashboard (for visual monitoring)
minikube addons enable dashboard
```

**Expected Output**: Addons enabled successfully.

---

### Step 3: Verify Cluster Status

```bash
# Check Minikube status
minikube status

# Check nodes
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system
```

**Expected Output**:
- Minikube: Running
- Nodes: Ready
- System pods: All Running

---

### Step 4: Point Docker to Minikube

```bash
# Configure Docker CLI to use Minikube's Docker daemon
# For PowerShell:
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# For Bash/Git Bash:
eval $(minikube docker-env)

# For CMD:
@FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i
```

**Verification**:
```bash
docker ps
# Should show Minikube containers
```

---

### Step 5: Create Kubernetes Secret

**IMPORTANT**: Replace the placeholder values with your actual credentials!

```bash
kubectl create secret generic todo-chatbot-secrets \
  --from-literal=DATABASE_URL="postgresql://user:password@your-neon-host.neon.tech:5432/your-database?sslmode=require" \
  --from-literal=AUTH_SECRET="your-auth-secret-key-here" \
  --from-literal=BETTER_AUTH_SECRET="your-better-auth-secret-here"
```

**Verification**:
```bash
# Check secret exists
kubectl get secret todo-chatbot-secrets

# View secret keys (not values)
kubectl describe secret todo-chatbot-secrets
```

**Expected Output**: Secret created with 3 keys (DATABASE_URL, AUTH_SECRET, BETTER_AUTH_SECRET).

---

## Phase 3: User Story 1 - Deploy Application

### Step 6: Build Container Image

```bash
# Navigate to project root
cd "D:\AGENTIC_AI\Hackhathon 2\phase_04"

# Build image inside Minikube
docker build -f infrastructure/docker/frontend.Dockerfile -t todo-chatbot:latest .
```

**Expected Output**:
- Build completes successfully
- Image size < 200MB
- No errors during build

**Verification**:
```bash
# Check image exists
docker images | grep todo-chatbot

# Check image size
docker images todo-chatbot:latest --format "{{.Size}}"
```

---

### Step 7: Test Container Locally (Optional)

```bash
# Run container locally to test
docker run -d -p 3000:3000 --name test-todo \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-connection-string" \
  todo-chatbot:latest

# Wait for startup
sleep 10

# Test health endpoint
curl http://localhost:3000/api/health

# Stop and remove test container
docker stop test-todo && docker rm test-todo
```

---

### Step 8: Deploy to Kubernetes

```bash
# Apply ConfigMap
kubectl apply -f infrastructure/kubernetes/configmap.yaml

# Apply Deployment
kubectl apply -f infrastructure/kubernetes/deployment.yaml

# Apply Service
kubectl apply -f infrastructure/kubernetes/service.yaml
```

**Expected Output**: All resources created successfully.

---

### Step 9: Verify Deployment

```bash
# Check deployment status
kubectl get deployment todo-chatbot-deployment

# Check pods
kubectl get pods -l app=todo-chatbot

# Watch pods until Running
kubectl get pods -l app=todo-chatbot -w
# Press Ctrl+C to stop watching

# Check pod details if issues
kubectl describe pod -l app=todo-chatbot

# Check logs
kubectl logs -l app=todo-chatbot --tail=50
```

**Expected Output**:
- Deployment: 1/1 replicas ready
- Pods: Running status
- Readiness: 1/1 containers ready

---

### Step 10: Access Application

```bash
# Get Minikube service URL
minikube service todo-chatbot-service --url

# Or open in browser automatically
minikube service todo-chatbot-service
```

**Alternative Access Methods**:

**Via Port Forward**:
```bash
kubectl port-forward service/todo-chatbot-service 8080:80
# Access at: http://localhost:8080
```

**Via Minikube IP**:
```bash
# Get Minikube IP
minikube ip

# Access at: http://<minikube-ip>:30080
```

---

### Step 11: Test Application

1. Open application in browser
2. Register a new user account
3. Login with credentials
4. Create a new todo task
5. Mark task as complete
6. Verify all features work correctly

**Expected Result**: Full application workflow functions correctly.

---

## Phase 4: User Story 2 - Helm Chart (Optional)

### Step 12: Create Helm Chart

```bash
# Create Helm chart scaffold
helm create infrastructure/helm/todo-chatbot

# The chart templates have been pre-generated in infrastructure/helm/
# You can customize values.yaml as needed
```

---

### Step 13: Install via Helm

```bash
# First, uninstall existing resources
kubectl delete deployment todo-chatbot-deployment
kubectl delete service todo-chatbot-service
kubectl delete configmap todo-chatbot-config

# Install Helm chart
helm install todo-chatbot infrastructure/helm/todo-chatbot

# Check release status
helm status todo-chatbot

# List releases
helm list
```

---

### Step 14: Test Helm Operations

```bash
# Upgrade with different replica count
helm upgrade todo-chatbot infrastructure/helm/todo-chatbot --set replicaCount=2

# Verify 2 pods running
kubectl get pods -l app.kubernetes.io/name=todo-chatbot

# Rollback if needed
helm rollback todo-chatbot

# Uninstall
helm uninstall todo-chatbot

# Reinstall to verify reproducibility
helm install todo-chatbot infrastructure/helm/todo-chatbot
```

---

## Phase 5: User Story 3 - AI Operations (Manual Fallback)

Since kubectl-ai and Kagent aren't available, use these standard commands:

### Step 15: Scaling Operations

```bash
# Scale to 3 replicas
kubectl scale deployment todo-chatbot-deployment --replicas=3

# Verify scaling
kubectl get pods -l app=todo-chatbot

# Watch pods being created
kubectl get pods -l app=todo-chatbot -w
```

---

### Step 16: Debugging Operations

```bash
# Simulate pod failure
kubectl delete pod -l app=todo-chatbot --field-selector=status.phase=Running | head -1

# Watch pod recreation
kubectl get pods -l app=todo-chatbot -w

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp | grep todo-chatbot

# Describe deployment
kubectl describe deployment todo-chatbot-deployment
```

---

### Step 17: Resource Analysis

```bash
# Check node resources
kubectl top nodes

# Check pod resources
kubectl top pods -l app=todo-chatbot

# Get detailed resource usage
kubectl describe node minikube | grep -A 5 "Allocated resources"
```

---

## Troubleshooting

### Issue: Pods stuck in Pending

```bash
# Check pod events
kubectl describe pod -l app=todo-chatbot

# Check node resources
kubectl describe node minikube

# Solution: Reduce resource requests or increase Minikube resources
```

---

### Issue: Pods in CrashLoopBackOff

```bash
# Check logs
kubectl logs -l app=todo-chatbot --previous

# Check secret exists
kubectl get secret todo-chatbot-secrets

# Verify environment variables
kubectl exec -it <pod-name> -- env | grep DATABASE_URL
```

---

### Issue: Cannot access application

```bash
# Check service endpoints
kubectl get endpoints todo-chatbot-service

# Check pod status
kubectl get pods -l app=todo-chatbot

# Try port forwarding
kubectl port-forward service/todo-chatbot-service 8080:80
```

---

## Cleanup

```bash
# Delete all resources
kubectl delete deployment todo-chatbot-deployment
kubectl delete service todo-chatbot-service
kubectl delete configmap todo-chatbot-config
kubectl delete secret todo-chatbot-secrets

# Or if using Helm
helm uninstall todo-chatbot
kubectl delete secret todo-chatbot-secrets

# Stop Minikube
minikube stop

# Delete Minikube cluster (removes all data)
minikube delete
```

---

## Success Criteria Checklist

- [ ] Frontend accessible via browser within 5 minutes
- [ ] All application features work (register, login, create todo, mark complete)
- [ ] Deployment reproducible on fresh cluster in under 10 minutes
- [ ] At least 3 operations demonstrated (build, deploy, scale)
- [ ] Complete audit trail exists in logs/deployment-audit.md
- [ ] Helm chart installs/uninstalls cleanly
- [ ] Application handles 10 concurrent users
- [ ] Deployment process documented
- [ ] Fallback procedures documented
- [ ] Resource usage analyzed

---

## Notes

- All Kubernetes manifests were generated using Claude Code (fallback strategy)
- Dockerfile generated using Claude Code (Gordon unavailable)
- kubectl-ai and Kagent operations replaced with standard kubectl commands
- Complete audit trail maintained in logs/deployment-audit.md
- All artifacts follow Phase IV Agentic DevOps Constitution principles

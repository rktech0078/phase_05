# Quickstart Guide: Local Development Setup

**Feature**: Event-Driven Todo Chatbot Platform
**Date**: 2026-01-19
**Target**: Minikube local development environment

## Overview

This guide walks you through setting up the complete event-driven todo platform on your local machine using Minikube, Dapr, and Helm. By the end, you'll have all 6 microservices running with event-driven communication via Kafka.

**Estimated Setup Time**: 30-45 minutes

---

## Prerequisites

### Required Software

1. **Docker Desktop** (v20.10+)
   - Download: https://www.docker.com/products/docker-desktop
   - Ensure Docker is running before proceeding

2. **Minikube** (v1.30+)
   - Install: `choco install minikube` (Windows) or `brew install minikube` (Mac)
   - Verify: `minikube version`

3. **kubectl** (v1.28+)
   - Install: `choco install kubernetes-cli` (Windows) or `brew install kubectl` (Mac)
   - Verify: `kubectl version --client`

4. **Helm** (v3.12+)
   - Install: `choco install kubernetes-helm` (Windows) or `brew install helm` (Mac)
   - Verify: `helm version`

5. **Dapr CLI** (v1.12+)
   - Install: `powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"` (Windows)
   - Or: `brew install dapr/tap/dapr-cli` (Mac)
   - Verify: `dapr version`

6. **Node.js** (v18+) and npm
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

### System Requirements

- **CPU**: 4 cores minimum (8 cores recommended)
- **RAM**: 8 GB minimum (16 GB recommended)
- **Disk**: 20 GB free space
- **OS**: Windows 10/11, macOS 11+, or Linux

---

## Step 1: Start Minikube

Start Minikube with sufficient resources:

```bash
# Start Minikube with 4 CPUs and 8GB RAM
minikube start --cpus=4 --memory=8192 --driver=docker

# Verify Minikube is running
minikube status

# Enable ingress addon (optional, for external access)
minikube addons enable ingress

# Configure Docker to use Minikube's Docker daemon
# This allows building images directly in Minikube
eval $(minikube docker-env)
# On Windows PowerShell: & minikube -p minikube docker-env --shell powershell | Invoke-Expression
```

**Expected Output**:
```
✅ minikube v1.32.0 on Darwin 13.0
✅ Using the docker driver based on existing profile
✅ Starting control plane node minikube in cluster minikube
✅ Pulling base image ...
✅ Restarting existing docker container for "minikube" ...
✅ Preparing Kubernetes v1.28.3 on Docker 24.0.7 ...
✅ Configuring bridge CNI (Container Networking Interface) ...
✅ Verifying Kubernetes components...
✅ Enabled addons: storage-provisioner, default-storageclass, ingress
✅ Done! kubectl is now configured to use "minikube" cluster
```

---

## Step 2: Install Dapr on Minikube

Initialize Dapr in your Kubernetes cluster:

```bash
# Initialize Dapr on Kubernetes
dapr init --kubernetes --wait

# Verify Dapr installation
dapr status -k

# Check Dapr pods are running
kubectl get pods -n dapr-system
```

**Expected Output**:
```
NAME                                     READY   STATUS    RESTARTS   AGE
dapr-dashboard-5c9c9b9b9c-xxxxx         1/1     Running   0          2m
dapr-operator-5c9c9b9b9c-xxxxx          1/1     Running   0          2m
dapr-placement-server-0                  1/1     Running   0          2m
dapr-sentry-5c9c9b9b9c-xxxxx            1/1     Running   0          2m
dapr-sidecar-injector-5c9c9b9b9c-xxxxx  1/1     Running   0          2m
```

---

## Step 3: Deploy Redis (Dapr State Store)

Deploy Redis for Dapr state management and pub/sub:

```bash
# Add Bitnami Helm repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update

# Create namespace for infrastructure
kubectl create namespace infrastructure

# Deploy Redis
helm install redis bitnami/redis \
  --namespace infrastructure \
  --set auth.enabled=false \
  --set master.persistence.enabled=false \
  --set replica.replicaCount=0

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n infrastructure --timeout=300s

# Verify Redis is running
kubectl get pods -n infrastructure
```

---

## Step 4: Deploy Redpanda (Kafka Alternative)

Deploy Redpanda as a lightweight Kafka alternative for local development:

```bash
# Add Redpanda Helm repository
helm repo add redpanda https://charts.redpanda.com
helm repo update

# Deploy Redpanda (single node for local dev)
helm install redpanda redpanda/redpanda \
  --namespace infrastructure \
  --set statefulset.replicas=1 \
  --set storage.persistentVolume.enabled=false \
  --set resources.cpu.cores=1 \
  --set resources.memory.container.max=2Gi

# Wait for Redpanda to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redpanda -n infrastructure --timeout=300s

# Verify Redpanda is running
kubectl get pods -n infrastructure
```

---

## Step 5: Deploy Dapr Components

Create Dapr components for pub/sub, state store, and bindings:

```bash
# Navigate to infrastructure directory
cd infrastructure/dapr/components

# Apply Dapr components
kubectl apply -f pubsub-kafka.yaml
kubectl apply -f statestore-redis.yaml
kubectl apply -f binding-cron.yaml
kubectl apply -f secrets-k8s.yaml

# Verify components are created
kubectl get components -n default
```

**Component Files** (create if not exists):

**pubsub-kafka.yaml**:
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: pubsub-kafka
spec:
  type: pubsub.kafka
  version: v1
  metadata:
  - name: brokers
    value: "redpanda.infrastructure.svc.cluster.local:9092"
  - name: consumerGroup
    value: "todo-platform"
  - name: clientId
    value: "todo-platform"
  - name: authType
    value: "none"
```

**statestore-redis.yaml**:
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: statestore
spec:
  type: state.redis
  version: v1
  metadata:
  - name: redisHost
    value: "redis-master.infrastructure.svc.cluster.local:6379"
  - name: redisPassword
    value: ""
```

**binding-cron.yaml**:
```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: reminder-cron
spec:
  type: bindings.cron
  version: v1
  metadata:
  - name: schedule
    value: "@every 1m"
  - name: direction
    value: "input"
```

---

## Step 6: Build Docker Images

Build all service Docker images in Minikube's Docker environment:

```bash
# Ensure you're using Minikube's Docker daemon
eval $(minikube docker-env)

# Navigate to project root
cd "D:\AGENTIC_AI\Hackhathon 2\phase_05"

# Build frontend image
docker build -t todo-frontend:latest -f infrastructure/docker/frontend.Dockerfile .

# Build task service image
docker build -t task-service:latest -f services/task-service/Dockerfile ./services/task-service

# Build notification service image
docker build -t notification-service:latest -f services/notification-service/Dockerfile ./services/notification-service

# Build recurring service image
docker build -t recurring-service:latest -f services/recurring-service/Dockerfile ./services/recurring-service

# Build audit service image
docker build -t audit-service:latest -f services/audit-service/Dockerfile ./services/audit-service

# Build sync service image
docker build -t sync-service:latest -f services/sync-service/Dockerfile ./services/sync-service

# Verify images are built
docker images | grep todo
```

**Note**: If Dockerfiles don't exist yet, they will be created during the implementation phase (`/sp.implement`).

---

## Step 7: Create Kubernetes Secrets

Create secrets for database connection and other sensitive data:

```bash
# Create namespace for application
kubectl create namespace todo-platform

# Create database secret (replace with your Neon PostgreSQL URL)
kubectl create secret generic app-secrets \
  --namespace todo-platform \
  --from-literal=DATABASE_URL='postgresql://user:password@host/database?sslmode=require' \
  --from-literal=AUTH_SECRET='your-auth-secret-here' \
  --from-literal=BETTER_AUTH_SECRET='your-better-auth-secret-here'

# Verify secret is created
kubectl get secrets -n todo-platform
```

---

## Step 8: Deploy Application with Helm

Deploy all services using Helm:

```bash
# Navigate to Helm chart directory
cd infrastructure/helm/todo-platform

# Install the Helm chart
helm install todo-platform . \
  --namespace todo-platform \
  --values values-minikube.yaml \
  --wait \
  --timeout 10m

# Verify all pods are running
kubectl get pods -n todo-platform

# Check Dapr sidecars are injected
kubectl get pods -n todo-platform -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].name}{"\n"}{end}'
```

**Expected Output**:
```
NAME                                   READY   STATUS    RESTARTS   AGE
frontend-xxxxxxxxxx-xxxxx              2/2     Running   0          2m
task-service-xxxxxxxxxx-xxxxx          2/2     Running   0          2m
notification-service-xxxxxxxxxx-xxxxx  2/2     Running   0          2m
recurring-service-xxxxxxxxxx-xxxxx     2/2     Running   0          2m
audit-service-xxxxxxxxxx-xxxxx         2/2     Running   0          2m
sync-service-xxxxxxxxxx-xxxxx          2/2     Running   0          2m
```

**Note**: Each pod should have 2/2 containers (application + Dapr sidecar).

---

## Step 9: Verify Deployment

### Check Service Health

```bash
# Check all services are healthy
kubectl get pods -n todo-platform

# Check service endpoints
kubectl get svc -n todo-platform

# Test health endpoints
kubectl port-forward -n todo-platform svc/task-service 3001:3001 &
curl http://localhost:3001/health

# Stop port-forward
pkill -f "port-forward"
```

### Verify Event Flow

```bash
# Watch Dapr logs for event publishing
kubectl logs -n todo-platform -l app=task-service -c daprd --tail=50 -f

# In another terminal, create a task via API
kubectl port-forward -n todo-platform svc/frontend 3000:3000 &

# Create a task (replace with actual API call)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Test task","priority":"high"}'

# Check audit service received the event
kubectl logs -n todo-platform -l app=audit-service -c audit-service --tail=20
```

---

## Step 10: Access the Application

### Option 1: Port Forwarding (Recommended for Development)

```bash
# Forward frontend service to localhost
kubectl port-forward -n todo-platform svc/frontend 3000:3000

# Access application at http://localhost:3000
```

### Option 2: Minikube Service (Opens in Browser)

```bash
# Get the Minikube service URL
minikube service frontend -n todo-platform --url

# Or open directly in browser
minikube service frontend -n todo-platform
```

### Option 3: Ingress (If Enabled)

```bash
# Get Minikube IP
minikube ip

# Add to /etc/hosts (or C:\Windows\System32\drivers\etc\hosts on Windows)
# <minikube-ip> todo.local

# Access at http://todo.local
```

---

## Step 11: Access Dapr Dashboard (Optional)

```bash
# Port-forward Dapr dashboard
kubectl port-forward -n dapr-system svc/dapr-dashboard 8080:8080

# Access dashboard at http://localhost:8080
```

**Dapr Dashboard Features**:
- View all Dapr-enabled applications
- Monitor pub/sub subscriptions
- View state store entries
- Check component configurations
- View distributed traces

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl get pods -n todo-platform

# Describe pod for events
kubectl describe pod <pod-name> -n todo-platform

# Check logs
kubectl logs <pod-name> -n todo-platform -c <container-name>

# Check Dapr sidecar logs
kubectl logs <pod-name> -n todo-platform -c daprd
```

### Dapr Components Not Working

```bash
# Check component status
kubectl get components -n todo-platform

# Describe component
kubectl describe component pubsub-kafka -n todo-platform

# Check Dapr operator logs
kubectl logs -n dapr-system -l app=dapr-operator
```

### Redis Connection Issues

```bash
# Check Redis is running
kubectl get pods -n infrastructure -l app.kubernetes.io/name=redis

# Test Redis connection
kubectl run redis-test --rm -it --image=redis:alpine -n infrastructure -- redis-cli -h redis-master.infrastructure.svc.cluster.local ping

# Should return: PONG
```

### Redpanda Connection Issues

```bash
# Check Redpanda is running
kubectl get pods -n infrastructure -l app.kubernetes.io/name=redpanda

# Test Redpanda connection
kubectl exec -it redpanda-0 -n infrastructure -- rpk cluster info
```

### Image Pull Errors

```bash
# Ensure you're using Minikube's Docker daemon
eval $(minikube docker-env)

# Rebuild images
docker build -t <image-name>:latest -f <dockerfile> .

# Verify image exists in Minikube
docker images | grep <image-name>

# Update Helm values to use imagePullPolicy: Never
# (prevents pulling from remote registry)
```

### Database Connection Issues

```bash
# Check database secret exists
kubectl get secret app-secrets -n todo-platform

# Verify DATABASE_URL is correct
kubectl get secret app-secrets -n todo-platform -o jsonpath='{.data.DATABASE_URL}' | base64 --decode

# Test database connection from a pod
kubectl run db-test --rm -it --image=postgres:15-alpine -n todo-platform -- psql <DATABASE_URL>
```

---

## Cleanup

To remove all resources and start fresh:

```bash
# Uninstall Helm release
helm uninstall todo-platform -n todo-platform

# Delete namespace
kubectl delete namespace todo-platform

# Uninstall infrastructure
helm uninstall redis -n infrastructure
helm uninstall redpanda -n infrastructure
kubectl delete namespace infrastructure

# Uninstall Dapr
dapr uninstall --kubernetes

# Stop Minikube
minikube stop

# Delete Minikube cluster (complete reset)
minikube delete
```

---

## Next Steps

After successful local deployment:

1. **Test Event Flows**: Create tasks and verify events are published to Kafka and consumed by services
2. **Test Real-Time Sync**: Open application in multiple browser tabs and verify changes sync in real-time
3. **Test Recurring Tasks**: Create a recurring task, complete it, and verify next instance is generated
4. **Test Reminders**: Create a task with due date and verify reminder notification is sent
5. **View Audit Logs**: Check audit service API for complete activity history
6. **Monitor with Dapr Dashboard**: Use Dapr dashboard to monitor event flows and component health
7. **Production Deployment**: Follow deployment-oke.md guide to deploy to Oracle Kubernetes Engine

---

## Useful Commands

### Monitoring

```bash
# Watch all pods
kubectl get pods -n todo-platform -w

# Stream logs from all services
kubectl logs -n todo-platform -l app=task-service -f

# Check resource usage
kubectl top pods -n todo-platform
kubectl top nodes
```

### Debugging

```bash
# Execute shell in a pod
kubectl exec -it <pod-name> -n todo-platform -c <container-name> -- /bin/sh

# Port-forward to a service
kubectl port-forward -n todo-platform svc/<service-name> <local-port>:<service-port>

# Get service endpoints
kubectl get endpoints -n todo-platform
```

### Helm

```bash
# List installed releases
helm list -n todo-platform

# Get release values
helm get values todo-platform -n todo-platform

# Upgrade release
helm upgrade todo-platform . -n todo-platform -f values-minikube.yaml

# Rollback release
helm rollback todo-platform -n todo-platform
```

---

## Summary

You now have a fully functional event-driven todo platform running locally with:

- ✅ 6 microservices (frontend, task, notification, recurring, audit, sync)
- ✅ Dapr for event-driven communication
- ✅ Kafka (Redpanda) for event backbone
- ✅ Redis for state management
- ✅ Real-time WebSocket synchronization
- ✅ Distributed tracing and observability
- ✅ Production-like Kubernetes environment

**Total Resources**:
- Pods: ~15 (6 services + Dapr sidecars + infrastructure)
- CPU: ~2-3 cores used
- RAM: ~4-6 GB used
- Disk: ~10 GB used

The platform is ready for development, testing, and demonstration!

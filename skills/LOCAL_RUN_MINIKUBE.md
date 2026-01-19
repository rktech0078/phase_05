# 🚀 Local Setup Guide - Todo Chatbot Kubernetes Deployment

**Quick Reference Guide** - Apne project ko locally kaise run karein

---

## 📋 Prerequisites Check

Pehle yeh verify karein ke sab tools installed hain:

```bash
# Docker Desktop running hai?
docker --version

# Minikube installed hai?
minikube version

# Kubectl installed hai?
kubectl version --client

# Helm installed hai? (optional)
helm version
```

---

## 🎯 Step-by-Step: Application Start Karna

### Step 1: Docker Desktop Start Karein
- Windows mein Docker Desktop application open karein
- Wait karein jab tak "Docker Desktop is running" show ho

### Step 2: Minikube Cluster Start Karein

```bash
# Minikube start karo (3GB memory ke saath)
minikube start --cpus=2 --memory=3072 --driver=docker

# Status check karo
minikube status
```

**Expected Output:**
```
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

**Agar status "Stopped" dikhe to:**
```bash
minikube stop
minikube start --cpus=2 --memory=3072 --driver=docker
```

---

### Step 3: Application Status Check Karein

```bash
# Pods check karo
kubectl get pods -l app=todo-chatbot

# Service check karo
kubectl get svc todo-chatbot-service

# Deployment check karo
kubectl get deployment todo-chatbot-deployment
```

**Expected Output:**
- Pod status: `Running` (1/1 Ready)
- Service type: `NodePort` (port 80:30080)
- Deployment: `1/1` replicas ready

---

### Step 4: Application Access Karein

**Method 1: Minikube Service Command (Recommended)**

```bash
# Yeh command run karo - browser automatically open hoga
minikube service todo-chatbot-service
```

**Important:** Terminal window open rakhna zaroori hai jab tak application use kar rahe ho!

**Method 2: Port Forwarding**

```bash
# Port forward karo
kubectl port-forward service/todo-chatbot-service 8080:80

# Browser mein open karo
# http://localhost:8080
```

**Method 3: NodePort Direct Access**

```bash
# Minikube IP nikalo
minikube ip

# Browser mein open karo
# http://<minikube-ip>:30080
# Example: http://192.168.49.2:30080
```

---

## 🧪 Application Testing

### Health Check (Terminal se)

```bash
# Health endpoint test karo
curl http://localhost:8080/api/health

# Expected: {"status":"healthy","timestamp":"...","service":"todo-chatbot"}

# Ready endpoint test karo
curl http://localhost:8080/api/ready

# Expected: {"status":"ready","database":"connected"}
```

### Browser Testing Steps

1. **Homepage**: `http://localhost:8080` open karein
2. **Register**: Naya user account banao (email + password)
3. **Login**: Credentials se login karo
4. **Create Todo**: Naya task create karo
5. **Mark Complete**: Task ko complete mark karo
6. **Verify**: Page refresh karke check karo ke data persist ho raha hai

---

## 🔧 Common Issues & Solutions

### Issue 1: Minikube Start Nahi Ho Raha

**Problem:** Memory allocation error
```
Requested memory allocation 8192MB is more than your system limit
```

**Solution:**
```bash
# Kam memory ke saath start karo
minikube start --cpus=2 --memory=3072 --driver=docker
```

---

### Issue 2: Pod "Error" ya "CrashLoopBackOff" Status Mein Hai

**Check Logs:**
```bash
# Pod logs dekho
kubectl logs -l app=todo-chatbot --tail=50

# Previous container logs dekho
kubectl logs -l app=todo-chatbot --previous

# Pod details dekho
kubectl describe pod -l app=todo-chatbot
```

**Common Fixes:**
```bash
# Pod restart karo
kubectl delete pod -l app=todo-chatbot

# Wait karo - Kubernetes automatically naya pod create karega
kubectl get pods -l app=todo-chatbot -w
```

---

### Issue 3: Application Browser Mein Load Nahi Ho Raha

**Check Service:**
```bash
# Service endpoints check karo
kubectl get endpoints todo-chatbot-service

# Agar endpoints empty hain to pod ready nahi hai
kubectl get pods -l app=todo-chatbot
```

**Try Different Access Method:**
```bash
# Port forwarding try karo
kubectl port-forward service/todo-chatbot-service 8080:80

# Browser mein: http://localhost:8080
```

---

### Issue 4: Database Connection Error

**Check Secret:**
```bash
# Secret exists karta hai?
kubectl get secret todo-chatbot-secrets

# Secret keys check karo
kubectl describe secret todo-chatbot-secrets
```

**Expected Keys:**
- DATABASE_URL
- AUTH_SECRET
- BETTER_AUTH_SECRET

---

## 🛑 Application Stop Karna

### Application Ko Stop Karo (Minikube Running Rakho)

```bash
# Deployment scale down karo
kubectl scale deployment todo-chatbot-deployment --replicas=0

# Ya deployment delete karo
kubectl delete deployment todo-chatbot-deployment
kubectl delete service todo-chatbot-service
kubectl delete configmap todo-chatbot-config
```

### Minikube Cluster Stop Karo

```bash
# Cluster stop karo (data preserve rahega)
minikube stop

# Cluster completely delete karo (sab data delete hoga)
minikube delete
```

---

## 📊 Useful Commands

### Monitoring

```bash
# Real-time pod status dekho
kubectl get pods -l app=todo-chatbot -w

# Logs continuously dekho
kubectl logs -f -l app=todo-chatbot

# Resource usage dekho
kubectl top pods -l app=todo-chatbot
kubectl top nodes
```

### Debugging

```bash
# Pod ke andar command run karo
kubectl exec -it <pod-name> -- sh

# Pod environment variables dekho
kubectl exec <pod-name> -- env

# Pod ke andar files dekho
kubectl exec <pod-name> -- ls -la /app
```

### Cluster Info

```bash
# Cluster info
kubectl cluster-info

# All resources dekho
kubectl get all

# Specific namespace resources
kubectl get all -n default
```

---

## 🎯 Quick Start (Agar Sab Pehle Se Setup Hai)

```bash
# 1. Docker Desktop start karo (GUI se)

# 2. Minikube start karo
minikube start

# 3. Status check karo
kubectl get pods -l app=todo-chatbot

# 4. Application open karo
minikube service todo-chatbot-service

# Done! Browser mein application open ho jayega
```

---

## 📝 Important Notes

1. **Docker Desktop** hamesha running hona chahiye
2. **Terminal window** open rakhein jab `minikube service` command use kar rahe ho
3. **Minikube stop** karne se data preserve rahta hai
4. **Minikube delete** karne se sab kuch delete ho jata hai
5. **Port forwarding** background mein run karne ke liye `&` use karein (Linux/Mac)
6. **Windows** par port forwarding ke liye separate terminal window use karein

---

## 🔗 Useful Links

- **Minikube Docs**: https://minikube.sigs.k8s.io/docs/
- **Kubectl Cheatsheet**: https://kubernetes.io/docs/reference/kubectl/cheatsheet/
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/

---

## 📞 Troubleshooting Checklist

Agar kuch kaam nahi kar raha to yeh steps follow karein:

- [ ] Docker Desktop running hai?
- [ ] Minikube status "Running" hai?
- [ ] Pods "Running" status mein hain?
- [ ] Service endpoints exist karte hain?
- [ ] Secret properly configured hai?
- [ ] Logs mein koi error nahi hai?
- [ ] Port forwarding ya minikube service command properly run ho raha hai?

---

**Last Updated:** 2026-01-17
**Project:** Todo Chatbot Kubernetes Deployment
**Feature:** 001-k8s-ai-deployment

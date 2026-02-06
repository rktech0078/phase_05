# Azure AKS Deployment Guide

## Problem Summary
Previous deployment script failed due to:
1. Database URL with `&` character causing shell parsing issues
2. Secret references not working properly
3. Environment variables being truncated

## Solution: YAML-Based Deployment
This new approach uses YAML configuration files which properly handle special characters and complex configurations.

---

## Prerequisites

1. **Azure CLI** installed and logged in:
   ```powershell
   az login
   az account set --subscription "your-subscription-id"
   ```

2. **Resource Group** created:
   ```powershell
   az group create --name rg-todo-platform --location eastus
   ```

3. **Container Apps Environment** created:
   ```powershell
   az containerapp env create `
     --name cae-todo-platform `
     --resource-group rg-todo-platform `
     --location eastus
   ```

4. **Azure Container Registry** created:
   ```powershell
   az acr create `
     --name acrtodoplatform `
     --resource-group rg-todo-platform `
     --sku Basic `
     --admin-enabled true
   ```

5. **Docker images** built and pushed:
   ```powershell
   .\infrastructure\azure\build_and_push.ps1
   ```

---

## Step-by-Step Deployment

### Step 1: Update Secrets (IMPORTANT!)

Open `infrastructure/azure/deploy_with_yaml.ps1` and update these values:

```powershell
# Line 18-20: Update with your actual credentials
$DB_URL = 'postgresql://your-user:your-password@your-host/your-db?sslmode=require&channel_binding=require'
$AUTH_SECRET = "your-auth-secret-here"
$BETTER_AUTH_SECRET = "your-better-auth-secret-here"
```

### Step 2: Clean Up Failed Deployments (if any)

```powershell
.\infrastructure\azure\cleanup.ps1
```

This will delete any existing container apps that might be in a failed state.

### Step 3: Deploy All Services

```powershell
.\infrastructure\azure\deploy_with_yaml.ps1
```

This script will:
- ✅ Fetch Container Apps Environment ID
- ✅ Get ACR credentials automatically
- ✅ Generate YAML config for each service
- ✅ Deploy all 6 services (5 microservices + frontend)
- ✅ Configure Dapr for service-to-service communication
- ✅ Set up proper ingress (frontend is public, others are internal)

### Step 4: Verify Deployment

```powershell
# List all container apps
az containerapp list -g rg-todo-platform -o table

# Check specific service status
az containerapp show -n frontend -g rg-todo-platform --query properties.runningStatus -o tsv

# Get frontend URL
az containerapp show -n frontend -g rg-todo-platform --query properties.configuration.ingress.fqdn -o tsv
```

### Step 5: View Logs (if issues occur)

```powershell
# View logs for a specific service
az containerapp logs show -n frontend -g rg-todo-platform --follow

# View logs for task-service
az containerapp logs show -n task-service -g rg-todo-platform --follow
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Azure Container Apps                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐                                        │
│  │   Frontend   │ (Public, Port 3000)                    │
│  │  (Next.js)   │                                        │
│  └──────┬───────┘                                        │
│         │                                                 │
│         │ Dapr Service Invocation                        │
│         │                                                 │
│  ┌──────▼───────────────────────────────────────────┐   │
│  │           Microservices (Internal)                │   │
│  ├───────────────────────────────────────────────────┤   │
│  │  • task-service        (Port 3001)                │   │
│  │  • notification-service (Port 3002)               │   │
│  │  • recurring-service   (Port 3003)                │   │
│  │  • audit-service       (Port 3004)                │   │
│  │  • sync-service        (Port 3005)                │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │  Neon PostgreSQL │
              │    (External)    │
              └──────────────────┘
```

---

## Services Configuration

| Service | Port | External | Dapr Enabled | Purpose |
|---------|------|----------|--------------|---------|
| frontend | 3000 | ✅ Yes | ✅ Yes | Next.js web app |
| task-service | 3001 | ❌ No | ✅ Yes | Task CRUD operations |
| notification-service | 3002 | ❌ No | ✅ Yes | Push notifications |
| recurring-service | 3003 | ❌ No | ✅ Yes | Recurring tasks |
| audit-service | 3004 | ❌ No | ✅ Yes | Audit logging |
| sync-service | 3005 | ❌ No | ✅ Yes | Real-time sync |

---

## Troubleshooting

### Issue: "Container Apps Environment not found"

**Solution:**
```powershell
az containerapp env create `
  --name cae-todo-platform `
  --resource-group rg-todo-platform `
  --location eastus
```

### Issue: "Image not found in ACR"

**Solution:**
```powershell
# Rebuild and push images
.\infrastructure\azure\build_and_push.ps1

# Verify images exist
az acr repository list --name acrtodoplatform -o table
```

### Issue: "Service fails to start"

**Solution:**
```powershell
# Check logs
az containerapp logs show -n <service-name> -g rg-todo-platform --follow

# Check revision status
az containerapp revision list -n <service-name> -g rg-todo-platform -o table

# Restart the app
az containerapp update -n <service-name> -g rg-todo-platform
```

### Issue: "Database connection fails"

**Solution:**
1. Verify DATABASE_URL is correct in `deploy_with_yaml.ps1`
2. Check if Neon database allows connections from Azure
3. Verify the connection string format:
   ```
   postgresql://user:password@host:5432/database?sslmode=require&channel_binding=require
   ```

### Issue: "Frontend shows 502 Bad Gateway"

**Solution:**
```powershell
# Check if frontend is running
az containerapp show -n frontend -g rg-todo-platform --query properties.runningStatus

# Check frontend logs
az containerapp logs show -n frontend -g rg-todo-platform --follow

# Verify environment variables are set
az containerapp show -n frontend -g rg-todo-platform --query properties.template.containers[0].env
```

---

## Useful Commands

### View all apps status
```powershell
az containerapp list -g rg-todo-platform --query "[].{Name:name, Status:properties.runningStatus, URL:properties.configuration.ingress.fqdn}" -o table
```

### Scale a service
```powershell
az containerapp update -n task-service -g rg-todo-platform --min-replicas 1 --max-replicas 3
```

### Update environment variable
```powershell
az containerapp update -n frontend -g rg-todo-platform --set-env-vars "LOG_LEVEL=debug"
```

### View Dapr components
```powershell
az containerapp env dapr-component list -g rg-todo-platform --environment cae-todo-platform -o table
```

### Delete a specific service
```powershell
az containerapp delete -n <service-name> -g rg-todo-platform --yes
```

### Delete everything
```powershell
az group delete -n rg-todo-platform --yes
```

---

## Cost Optimization

To minimize costs during development:

1. **Use consumption-based pricing:**
   - Container Apps automatically scale to zero when not in use
   - You only pay for actual usage

2. **Reduce resource allocation:**
   ```powershell
   # Edit deploy_with_yaml.ps1, line ~90
   resources:
     cpu: 0.25      # Reduce from 0.5
     memory: 0.5Gi  # Reduce from 1Gi
   ```

3. **Stop services when not needed:**
   ```powershell
   az containerapp update -n <service-name> -g rg-todo-platform --min-replicas 0 --max-replicas 0
   ```

---

## Next Steps After Deployment

1. **Test the application:**
   - Open the frontend URL in browser
   - Register a new user
   - Create tasks
   - Test all features

2. **Set up monitoring:**
   ```powershell
   # Enable Application Insights
   az containerapp update -n frontend -g rg-todo-platform --enable-app-insights
   ```

3. **Configure custom domain (optional):**
   ```powershell
   az containerapp hostname add -n frontend -g rg-todo-platform --hostname yourdomain.com
   ```

4. **Set up CI/CD:**
   - Use GitHub Actions or Azure DevOps
   - Automate image builds and deployments

---

## Support

If you encounter issues:
1. Check the logs: `az containerapp logs show -n <service-name> -g rg-todo-platform --follow`
2. Verify YAML configs in `infrastructure/azure/*-config.yaml`
3. Check Azure Portal → Container Apps for visual status
4. Review this guide's troubleshooting section

---

**Good luck with your hackathon! 🚀**

# 🚀 Quick Azure Deployment Guide

## ✅ Prerequisites Check

```powershell
# 1. Azure login check karein
az account show

# Agar login nahi hai to:
az login
```

## 📦 Step 1: Images Build & Push (Agar abhi tak nahi kiya)

```powershell
# Project root directory mein jayen
cd "D:\AGENTIC_AI\Hackhathon 2\phase_04"

# Images build aur push karein
.\infrastructure\azure\build_and_push.ps1
```

**Expected Time:** 10-15 minutes (pehli baar)

---

## 🧹 Step 2: Cleanup (Agar pehle failed deployments hain)

```powershell
.\infrastructure\azure\cleanup.ps1
```

**Expected Time:** 2-3 minutes

---

## 🎯 Step 3: Deploy All Services

```powershell
.\infrastructure\azure\deploy_with_yaml.ps1
```

**Expected Time:** 5-10 minutes

**Ye script kya karega:**
- ✅ Container Apps Environment check karega
- ✅ ACR credentials fetch karega
- ✅ 6 services deploy karega:
  - task-service (internal)
  - notification-service (internal)
  - recurring-service (internal)
  - audit-service (internal)
  - sync-service (internal)
  - frontend (public) ← Yahan se access karenge

---

## 🔍 Step 4: Verify Deployment

```powershell
# Sab apps ki status dekhein
az containerapp list -g rg-todo-platform -o table

# Frontend ka URL nikalen
az containerapp show -n frontend -g rg-todo-platform --query properties.configuration.ingress.fqdn -o tsv
```

**Success ka sign:**
- Sab services ka status: `Running`
- Frontend ka URL mil jayega (e.g., `frontend.xxx.eastus.azurecontainerapps.io`)

---

## 🌐 Step 5: Test Application

```powershell
# Frontend URL browser mein kholen
# Ya direct command se:
$FRONTEND_URL = az containerapp show -n frontend -g rg-todo-platform --query properties.configuration.ingress.fqdn -o tsv
Start-Process "https://$FRONTEND_URL"
```

**Test karein:**
1. ✅ Page load ho raha hai
2. ✅ User registration
3. ✅ Login
4. ✅ Todo create/update/delete
5. ✅ AI chatbot features

---

## 🐛 Troubleshooting

### Agar koi service fail ho:

```powershell
# Logs dekhein
az containerapp logs show -n frontend -g rg-todo-platform --follow

# Service restart karein
az containerapp update -n frontend -g rg-todo-platform
```

### Agar database connection fail ho:

```powershell
# Environment variables check karein
az containerapp show -n frontend -g rg-todo-platform --query properties.template.containers[0].env -o table

# Secret check karein
az containerapp show -n frontend -g rg-todo-platform --query properties.configuration.secrets -o table
```

### Agar 502 Bad Gateway aaye:

```powershell
# Revision status check karein
az containerapp revision list -n frontend -g rg-todo-platform -o table

# Latest logs dekhein
az containerapp logs show -n frontend -g rg-todo-platform --tail 100
```

---

## 📊 Useful Commands

```powershell
# Sab services ka detailed status
az containerapp list -g rg-todo-platform --query "[].{Name:name, Status:properties.runningStatus, URL:properties.configuration.ingress.fqdn}" -o table

# Specific service scale karein
az containerapp update -n task-service -g rg-todo-platform --min-replicas 1 --max-replicas 3

# Service delete karein (agar zarurat ho)
az containerapp delete -n task-service -g rg-todo-platform --yes

# Complete cleanup (sab kuch delete)
az group delete -n rg-todo-platform --yes
```

---

## 🎉 Success Checklist

- [ ] Images ACR mein push ho gayi
- [ ] Cleanup script successfully run hui
- [ ] Deploy script successfully complete hui
- [ ] Sab 6 services `Running` status mein hain
- [ ] Frontend URL accessible hai
- [ ] Application features kaam kar rahe hain

---

## ⏱️ Total Time Estimate

- **First Time:** 20-30 minutes
- **Subsequent Deploys:** 5-10 minutes

---

## 💰 Cost Estimate

Azure Container Apps (Consumption Plan):
- **Development/Testing:** ~$5-10/day
- **Production:** Depends on traffic

**Cost bachane ke liye:**
```powershell
# Services ko scale down karein jab use na ho
az containerapp update -n frontend -g rg-todo-platform --min-replicas 0
```

---

## 📞 Support

Agar koi issue aaye to:
1. Logs check karein (commands upar diye hain)
2. YAML config files check karein: `infrastructure/azure/*-config.yaml`
3. Azure Portal mein Container Apps section dekhein

**Good luck! 🚀**

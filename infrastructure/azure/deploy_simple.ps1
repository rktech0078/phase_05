$ErrorActionPreference = "Stop"

$RG = "rg-todo-platform"
$ENV_NAME = "cae-todo-platform"
$ACR_NAME = "acrtodoplatform"
$LOCATION = "eastus"

Write-Host "Starting Azure Deployment..." -ForegroundColor Cyan

# Get Environment ID
$ENV_ID = az containerapp env show -n $ENV_NAME -g $RG --query id -o tsv
if (-not $ENV_ID) {
    Write-Host "ERROR: Environment not found. Creating..." -ForegroundColor Red
    az containerapp env create --name $ENV_NAME --resource-group $RG --location $LOCATION
    $ENV_ID = az containerapp env show -n $ENV_NAME -g $RG --query id -o tsv
}

# Get ACR credentials
az acr update -n $ACR_NAME --admin-enabled true | Out-Null
$ACR_USER = az acr credential show -n $ACR_NAME --query "username" -o tsv
$ACR_PASS = az acr credential show -n $ACR_NAME --query "passwords[0].value" -o tsv

# Secrets
$DB = 'postgresql://neondb_owner:npg_ViUF4kTjQc0u@ep-empty-night-a1f62zum-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
$AUTH = "CScmNpQrZezguV+hM/nAmWrZpp428klCIAhic+R4OKo="
$BETTER = "qTVmp/NQbah0P6sSMdU2WMCBjLQwdfOR/BFOHtU6yHA="
$OPENROUTER = "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"

Write-Host "Deploying task-service..." -ForegroundColor Yellow
az containerapp create `
  --name task-service `
  --resource-group $RG `
  --environment $ENV_NAME `
  --image "$ACR_NAME.azurecr.io/task-service:latest" `
  --target-port 3001 `
  --ingress internal `
  --registry-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_USER `
  --registry-password $ACR_PASS `
  --secrets "db-url=$DB" `
  --env-vars "DATABASE_URL=secretref:db-url" "APP_PORT=3001" "SERVICE_NAME=task-service" "NODE_ENV=production" `
  --cpu 0.5 --memory 1Gi

Write-Host "Deploying notification-service..." -ForegroundColor Yellow
az containerapp create `
  --name notification-service `
  --resource-group $RG `
  --environment $ENV_NAME `
  --image "$ACR_NAME.azurecr.io/notification-service:latest" `
  --target-port 3002 `
  --ingress internal `
  --registry-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_USER `
  --registry-password $ACR_PASS `
  --secrets "db-url=$DB" `
  --env-vars "DATABASE_URL=secretref:db-url" "APP_PORT=3002" "SERVICE_NAME=notification-service" "NODE_ENV=production" `
  --cpu 0.5 --memory 1Gi

Write-Host "Deploying recurring-service..." -ForegroundColor Yellow
az containerapp create `
  --name recurring-service `
  --resource-group $RG `
  --environment $ENV_NAME `
  --image "$ACR_NAME.azurecr.io/recurring-service:latest" `
  --target-port 3003 `
  --ingress internal `
  --registry-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_USER `
  --registry-password $ACR_PASS `
  --secrets "db-url=$DB" `
  --env-vars "DATABASE_URL=secretref:db-url" "APP_PORT=3003" "SERVICE_NAME=recurring-service" "NODE_ENV=production" `
  --cpu 0.5 --memory 1Gi

Write-Host "Deploying audit-service..." -ForegroundColor Yellow
az containerapp create `
  --name audit-service `
  --resource-group $RG `
  --environment $ENV_NAME `
  --image "$ACR_NAME.azurecr.io/audit-service:latest" `
  --target-port 3004 `
  --ingress internal `
  --registry-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_USER `
  --registry-password $ACR_PASS `
  --secrets "db-url=$DB" `
  --env-vars "DATABASE_URL=secretref:db-url" "APP_PORT=3004" "SERVICE_NAME=audit-service" "NODE_ENV=production" `
  --cpu 0.5 --memory 1Gi

Write-Host "Deploying sync-service..." -ForegroundColor Yellow
az containerapp create `
  --name sync-service `
  --resource-group $RG `
  --environment $ENV_NAME `
  --image "$ACR_NAME.azurecr.io/sync-service:latest" `
  --target-port 3005 `
  --ingress internal `
  --registry-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_USER `
  --registry-password $ACR_PASS `
  --env-vars "APP_PORT=3005" "SERVICE_NAME=sync-service" "NODE_ENV=production" `
  --cpu 0.5 --memory 1Gi

Write-Host "Deploying frontend..." -ForegroundColor Yellow
az containerapp create `
  --name frontend `
  --resource-group $RG `
  --environment $ENV_NAME `
  --image "$ACR_NAME.azurecr.io/frontend:latest" `
  --target-port 3000 `
  --ingress external `
  --registry-server "$ACR_NAME.azurecr.io" `
  --registry-username $ACR_USER `
  --registry-password $ACR_PASS `
  --secrets "db-url=$DB" "auth-secret=$AUTH" "better-auth-secret=$BETTER" "openrouter-key=$OPENROUTER" `
  --env-vars "DATABASE_URL=secretref:db-url" "AUTH_SECRET=secretref:auth-secret" "BETTER_AUTH_SECRET=secretref:better-auth-secret" "OPENROUTER_API_KEY=secretref:openrouter-key" "OPENAI_BASE_URL=https://openrouter.ai/api/v1" "NODE_ENV=production" "PORT=3000" `
  --cpu 0.5 --memory 1Gi

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "`nGet frontend URL:" -ForegroundColor Yellow
Write-Host "az containerapp show -n frontend -g $RG --query properties.configuration.ingress.fqdn -o tsv" -ForegroundColor White

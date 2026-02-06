$ErrorActionPreference = "Stop"

$RG = "rg-todo-platform"
$APP = "frontend"

Write-Host "Getting frontend URL..." -ForegroundColor Yellow
$FRONTEND_URL = az containerapp show -n $APP -g $RG --query properties.configuration.ingress.fqdn -o tsv
$FULL_URL = "https://$FRONTEND_URL"

Write-Host "Frontend URL: $FULL_URL" -ForegroundColor Cyan

Write-Host "`nUpdating AUTH URLs..." -ForegroundColor Yellow

# Update all auth-related environment variables
az containerapp update `
  --name $APP `
  --resource-group $RG `
  --replace-env-vars `
    "DATABASE_URL=secretref:db-url" `
    "AUTH_SECRET=secretref:auth-secret" `
    "BETTER_AUTH_SECRET=secretref:better-auth-secret" `
    "OPENROUTER_API_KEY=secretref:openrouter-key" `
    "OPENAI_BASE_URL=https://openrouter.ai/api/v1" `
    "AUTH_URL=$FULL_URL" `
    "NEXT_PUBLIC_BETTER_AUTH_URL=$FULL_URL" `
    "NODE_ENV=production" `
    "PORT=3000"

Write-Host "`nDone! Container restarting..." -ForegroundColor Green
Write-Host "Wait 30 seconds then test sign-in at: $FULL_URL/sign-in" -ForegroundColor Cyan

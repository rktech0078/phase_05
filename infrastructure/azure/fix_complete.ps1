$ErrorActionPreference = "Stop"

$RG = "rg-todo-platform"
$APP = "frontend"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Complete Fix for Frontend" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Get frontend URL
Write-Host "`n1. Getting frontend URL..." -ForegroundColor Yellow
$FRONTEND_URL = az containerapp show -n $APP -g $RG --query properties.configuration.ingress.fqdn -o tsv
$FULL_URL = "https://$FRONTEND_URL"
Write-Host "   URL: $FULL_URL" -ForegroundColor Green

# Secrets


Write-Host "`n2. Setting all secrets..." -ForegroundColor Yellow
az containerapp secret set `
  --name $APP `
  --resource-group $RG `
  --secrets `
    "db-url=$DB_URL" `
    "auth-secret=$AUTH_SECRET" `
    "better-auth-secret=$BETTER_AUTH_SECRET" `
    "openrouter-key=$OPENROUTER_API_KEY"

Write-Host "   Secrets set successfully" -ForegroundColor Green

Write-Host "`n3. Updating environment variables..." -ForegroundColor Yellow
az containerapp update `
  --name $APP `
  --resource-group $RG `
  --set-env-vars `
    "DATABASE_URL=secretref:db-url" `
    "AUTH_SECRET=secretref:auth-secret" `
    "BETTER_AUTH_SECRET=secretref:better-auth-secret" `
    "OPENROUTER_API_KEY=secretref:openrouter-key" `
    "OPENAI_BASE_URL=https://openrouter.ai/api/v1" `
    "AUTH_URL=$FULL_URL" `
    "NEXT_PUBLIC_BETTER_AUTH_URL=$FULL_URL" `
    "NODE_ENV=production" `
    "PORT=3000"

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

Write-Host "`nContainer is restarting..." -ForegroundColor Yellow
Write-Host "Wait 30-60 seconds then test:" -ForegroundColor Cyan
Write-Host "  - Home: $FULL_URL" -ForegroundColor White
Write-Host "  - Sign In: $FULL_URL/sign-in" -ForegroundColor White
Write-Host "  - Sign Up: $FULL_URL/sign-up" -ForegroundColor White

Write-Host "`nTo watch live logs:" -ForegroundColor Yellow
Write-Host "az containerapp logs show -n frontend -g rg-todo-platform --follow" -ForegroundColor White

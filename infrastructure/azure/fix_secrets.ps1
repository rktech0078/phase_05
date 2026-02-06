$ErrorActionPreference = "Stop"

$RG = "rg-todo-platform"
$APP = "frontend"

Write-Host "Fixing BETTER_AUTH_SECRET..." -ForegroundColor Yellow

# Add secret
az containerapp secret set `
  --name $APP `
  --resource-group $RG `
  --secrets "better-auth-secret=qTVmp/NQbah0P6sSMdU2WMCBjLQwdfOR/BFOHtU6yHA="

Write-Host "Updating environment variable..." -ForegroundColor Yellow

# Update env var to use secret
az containerapp update `
  --name $APP `
  --resource-group $RG `
  --replace-env-vars "BETTER_AUTH_SECRET=secretref:better-auth-secret"

Write-Host "Done! Container will restart automatically." -ForegroundColor Green
Write-Host "Wait 30 seconds then test: https://frontend.wonderfuldune-49749e01.eastus.azurecontainerapps.io" -ForegroundColor Cyan

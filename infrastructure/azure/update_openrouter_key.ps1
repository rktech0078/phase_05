$ErrorActionPreference = "Stop"

$RG = "rg-todo-platform"
$APP = "frontend"
$NEW_KEY = ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Updating OpenRouter API Key" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Host "`nUpdating secret..." -ForegroundColor Yellow
az containerapp secret set `
  --name $APP `
  --resource-group $RG `
  --secrets "openrouter-key=$NEW_KEY"

Write-Host "Secret updated successfully!" -ForegroundColor Green

Write-Host "`nRestarting container..." -ForegroundColor Yellow
az containerapp revision restart `
  --name $APP `
  --resource-group $RG

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "Done! New API key is active." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

Write-Host "`nYour app: https://frontend.wonderfuldune-49749e01.eastus.azurecontainerapps.io" -ForegroundColor Cyan

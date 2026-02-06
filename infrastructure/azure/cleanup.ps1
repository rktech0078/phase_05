$ErrorActionPreference = "Stop"

$RG = "rg-todo-platform"
$SERVICES = @(
    "task-service",
    "notification-service", 
    "recurring-service",
    "audit-service",
    "sync-service",
    "frontend"
)

Write-Host "================================================" -ForegroundColor Red
Write-Host "Cleaning up Azure Container Apps" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Red

foreach ($service in $SERVICES) {
    Write-Host "`nChecking if $service exists..." -ForegroundColor Yellow
    
    $exists = az containerapp show -n $service -g $RG 2>$null
    
    if ($exists) {
        Write-Host "Deleting $service..." -ForegroundColor Yellow
        az containerapp delete -n $service -g $RG --yes
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $service deleted" -ForegroundColor Green
        } else {
            Write-Host "✗ Failed to delete $service" -ForegroundColor Red
        }
    } else {
        Write-Host "✓ $service does not exist (already clean)" -ForegroundColor Gray
    }
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

Write-Host "`nYou can now run the deployment script:" -ForegroundColor Yellow
Write-Host ".\infrastructure\azure\deploy_with_yaml.ps1" -ForegroundColor White

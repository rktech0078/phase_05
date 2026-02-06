$ErrorActionPreference = "Stop"
$ACR_NAME = "acrtodoplatform"
$SERVICES = @("audit-service", "notification-service", "recurring-service", "sync-service", "task-service")

Write-Host "Logging into Azure Container Registry..."
az acr login --name $ACR_NAME

foreach ($service in $SERVICES) {
    Write-Host "------------------------------------------------" -ForegroundColor Cyan
    Write-Host "Building $service..." -ForegroundColor Cyan
    
    # Use ${service} to avoid PowerShell scope separator issue with ":"
    docker build -t "${service}:latest" -f "services/$service/Dockerfile" .
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed for $service" }
    
    Write-Host "Tagging $service..." -ForegroundColor Cyan
    docker tag "${service}:latest" "$ACR_NAME.azurecr.io/${service}:latest"
    if ($LASTEXITCODE -ne 0) { throw "Docker tag failed for $service" }
    
    Write-Host "Pushing $service..." -ForegroundColor Cyan
    docker push "$ACR_NAME.azurecr.io/${service}:latest"
    if ($LASTEXITCODE -ne 0) { throw "Docker push failed for $service" }
    
    Write-Host "$service push successful!" -ForegroundColor Green
}

# Frontend
Write-Host "------------------------------------------------" -ForegroundColor Cyan
Write-Host "Building frontend..." -ForegroundColor Cyan
docker build -t "frontend:latest" -f "infrastructure/docker/frontend.Dockerfile" .
if ($LASTEXITCODE -ne 0) { throw "Docker build failed for frontend" }

docker tag "frontend:latest" "$ACR_NAME.azurecr.io/frontend:latest"
docker push "$ACR_NAME.azurecr.io/frontend:latest"
if ($LASTEXITCODE -ne 0) { throw "Docker push failed for frontend" }

Write-Host "Frontend push successful!" -ForegroundColor Green
Write-Host "All images pushed successfully!" -ForegroundColor Green

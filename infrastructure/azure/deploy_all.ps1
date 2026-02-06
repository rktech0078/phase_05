$RG = "rg-todo-platform"
$ENV_NAME = "cae-todo-platform"
$ACR_NAME = "acrtodoplatform"
$ACR_URL = "$ACR_NAME.azurecr.io"

Write-Host "Enabling ACR Admin and fetching credentials..."
az acr update -n $ACR_NAME --admin-enabled true > $null
$ACR_PASSWORD = az acr credential show -n $ACR_NAME --query "passwords[0].value" -o tsv

# Secrets
$DB_URL = 'postgresql://neondb_owner:npg_ViUF4kTjQc0u@ep-empty-night-a1f62zum-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
$AUTH_SECRET = "CScmNpQrZezguV+hM/nAmWrZpp428klCIAhic+R4OKo="
$BETTER_AUTH_SECRET = "qTVmp/NQbah0P6sSMdU2WMCBjLQwdfOR/BFOHtU6yHA="

# We use double quotes around the secret value in the command to protect it from the shell
$DB_URL_SAFE = $DB_URL

Write-Host "Starting Microservices Deployment to Azure..."

function Deploy-App {
    param (
        [string]$name,
        [string]$imageName,
        [string]$port,
        [bool]$isPublic,
        [string[]]$envVars,
        [string[]]$secrets
    )

    Write-Host "------------------------------------------------"
    Write-Host "Deploying $name..."
    
    $fullImage = "$ACR_URL/$imageName"

    # Generate YAML configuration
    $yamlPath = "$PSScriptRoot/$name-config.yaml"
    
    $yamlContent = @"
properties:
  configuration:
    activeRevisionsMode: Single
    dapr:
      enabled: true
      appId: $name
      appPort: $port
    ingress:
      external: $($isPublic.ToString().ToLower())
      allowInsecure: false
      targetPort: $port
      transport: Auto
    registries:
      - server: $ACR_URL
        username: $ACR_NAME
        passwordSecretRef: acr-password
    secrets:
      - name: acr-password
        value: "$ACR_PASSWORD"
"@

    # Add secrets to YAML
    if ($secrets) {
        $secrets | ForEach-Object {
            $parts = $_.Split('=', 2)
            $yamlContent += "`n      - name: $($parts[0])"
            $yamlContent += "`n        value: `"$($parts[1])`""
        }
    }

    # Add template section
    $yamlContent += @"

  template:
    containers:
      - image: $fullImage
        name: $name
        resources:
          cpu: 0.25
          memory: 0.5Gi
"@

    # Add env vars to YAML
    if ($envVars) {
        $yamlContent += "`n        env:"
        $envVars | ForEach-Object {
            $parts = $_.Split('=', 2)
            if ($parts[1].StartsWith("secretref:")) {
                $ref = $parts[1].Substring(10)
                $yamlContent += "`n          - name: $($parts[0])`n            secretRef: $ref"
            } else {
                $yamlContent += "`n          - name: $($parts[0])`n            value: `"$($parts[1])`""
            }
        }
    }

    # Write BOM-less UTF-8 file
    $Utf8NoBomEncoding = New-Object System.Text.UTF8Encoding $False
    # Adding a trailing newline as some YAML parsers prefer it
    [System.IO.File]::WriteAllText($yamlPath, $yamlContent + "`n", $Utf8NoBomEncoding)

    # Deploy using YAML with required flags
    Write-Host "Running: az containerapp create --name $name --resource-group $RG --environment $ENV_NAME --yaml `"$yamlPath`""
    az containerapp create --name $name --resource-group $RG --environment $ENV_NAME --yaml `"$yamlPath`"

    # Cleanup (commented out for debugging)
    # Remove-Item $yamlPath
}

# 1. Task Service
Deploy-App "task-service" "task-service:latest" "3001" $false `
    @("DATABASE_URL=secretref:db-url", "APP_PORT=3001", "SERVICE_NAME=task-service") `
    @("db-url=$DB_URL")

# 2. Notification Service
Deploy-App "notification-service" "notification-service:latest" "3002" $false `
    @("DATABASE_URL=secretref:db-url", "APP_PORT=3002", "SERVICE_NAME=notification-service") `
    @("db-url=$DB_URL")

# 3. Recurring Service
Deploy-App "recurring-service" "recurring-service:latest" "3003" $false `
    @("DATABASE_URL=secretref:db-url", "APP_PORT=3003", "SERVICE_NAME=recurring-service") `
    @("db-url=$DB_URL")

# 4. Audit Service
Deploy-App "audit-service" "audit-service:latest" "3004" $false `
    @("DATABASE_URL=secretref:db-url", "APP_PORT=3004", "SERVICE_NAME=audit-service") `
    @("db-url=$DB_URL")

# 5. Sync Service
Deploy-App "sync-service" "sync-service:latest" "3005" $false `
    @("APP_PORT=3005", "SERVICE_NAME=sync-service") `
    $null

# 6. Frontend (Public)
Deploy-App "frontend" "frontend:latest" "3000" $true `
    @("DATABASE_URL=secretref:db-url", "AUTH_SECRET=secretref:auth-secret", "BETTER_AUTH_SECRET=secretref:better-auth-secret", "NODE_ENV=production") `
    @("db-url=$DB_URL", "auth-secret=$AUTH_SECRET", "better-auth-secret=$BETTER_AUTH_SECRET")

Write-Host "Deployment Complete!"

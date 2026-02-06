$ErrorActionPreference = "Stop"

Write-Host "================================================" -ForegroundColor Red
Write-Host "GitHub Security Cleanup" -ForegroundColor Red
Write-Host "================================================" -ForegroundColor Red

# Step 1: Delete all YAML config files (they contain secrets)
Write-Host "`n1. Deleting YAML config files with secrets..." -ForegroundColor Yellow
$yamlFiles = Get-ChildItem -Path "infrastructure/azure" -Filter "*-config.yaml"
foreach ($file in $yamlFiles) {
    Remove-Item $file.FullName -Force
    Write-Host "   Deleted: $($file.Name)" -ForegroundColor Green
}

# Step 2: Add to .gitignore
Write-Host "`n2. Updating .gitignore..." -ForegroundColor Yellow
$gitignoreContent = @"

# Azure deployment configs (contain secrets)
infrastructure/azure/*-config.yaml
infrastructure/azure/*.yaml

# Environment files
.env.local
.env*.local
"@

Add-Content -Path ".gitignore" -Value $gitignoreContent
Write-Host "   .gitignore updated" -ForegroundColor Green

# Step 3: Remove from git tracking
Write-Host "`n3. Removing files from git tracking..." -ForegroundColor Yellow
git rm --cached infrastructure/azure/*-config.yaml 2>$null
git rm --cached .env.local 2>$null
Write-Host "   Files removed from git tracking" -ForegroundColor Green

# Step 4: Commit changes
Write-Host "`n4. Committing changes..." -ForegroundColor Yellow
git add .gitignore
git commit -m "Security: Remove exposed secrets and add to .gitignore"
Write-Host "   Changes committed" -ForegroundColor Green

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Push changes: git push" -ForegroundColor White
Write-Host "2. Update API key on Azure: .\infrastructure\azure\update_openrouter_key.ps1" -ForegroundColor White
Write-Host "3. Verify on GitHub that secrets are removed" -ForegroundColor White

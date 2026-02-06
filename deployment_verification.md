# Verification Checklist for Azure Deployment

## Status of Apps (Based on logs)
- [ ] **task-service**: ❌ FAILED (`SecretRef not found` / URL truncated)
- [ ] **notification-service**: ❌ FAILED (`SecretRef not found` / URL truncated)
- [ ] **recurring-service**: ❌ FAILED (`SecretRef not found` / URL truncated)
- [ ] **audit-service**: ❌ FAILED (`SecretRef not found` / URL truncated)
- [ ] **sync-service**: ⚠️ PARTIAL (Created, but check env-vars)
- [ ] **frontend**: ❌ FAILED (`DATABASE_URL` is empty in JSON output)

## Observed Errors
1. `(ContainerAppSecretRefNotFound) SecretRef 'db-url,APP_PORT=3001,SERVICE_NAME=task-service'`: The comma-separation for `--env-vars` failed.
2. `'channel_binding' is not recognized`: The ampersand `&` in the `DATABASE_URL` is still triggering CMD command execution, truncating the URL.

## Proposed Resolution: YAML Deployment
We will use `az containerapp create --yaml` for each service. This approach:
1. Bypasses the shell's argument parsing.
2. Preserves special characters like `&` perfectly.
3. Allows precise configuration of secrets and environment variables.

### YAML Template Structure
```yaml
location: eastus
name: <app-name>
resourceGroup: rg-todo-platform
type: Microsoft.App/containerApps
properties:
  environmentId: <env-id>
  configuration:
    activeRevisionsMode: Single
    ingress:
      external: <true/false>
      targetPort: <port>
      transport: Auto
    registries:
      - server: acrtodoplatform.azurecr.io
        username: acrtodoplatform
        passwordSecretRef: acr-password
    secrets:
      - name: db-url
        value: "postgresql://...&channel_binding=require"
      - name: acr-password
        value: "..."
  template:
    containers:
      - image: acrtodoplatform.azurecr.io/<image>
        name: <name>
        env:
          - name: DATABASE_URL
            secretRef: db-url
```

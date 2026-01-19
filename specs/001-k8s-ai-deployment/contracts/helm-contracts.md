# Helm Contracts: Chart Specifications

**Feature**: 001-k8s-ai-deployment
**Date**: 2026-01-15
**Phase**: Phase 1 - Design

## Overview

This document specifies the contract for the Helm chart that packages all Kubernetes resources for the Todo Chatbot deployment. The chart enables versioned, reproducible deployments with configurable parameters.

## Chart Metadata (Chart.yaml)

### Required Fields

```yaml
apiVersion: v2
name: todo-chatbot
description: Helm chart for deploying Todo Chatbot to Kubernetes
type: application
version: 0.1.0
appVersion: "1.0.0"
```

**Field Specifications**:
- **apiVersion**: `v2` (Helm 3 format)
- **name**: `todo-chatbot` (chart name, must match directory)
- **description**: Clear description of what the chart deploys
- **type**: `application` (not library)
- **version**: Chart version (semantic versioning, increments with chart changes)
- **appVersion**: Application version (tracks deployed app version)

### Optional Fields

```yaml
keywords:
  - nextjs
  - todo
  - kubernetes
  - hackathon

maintainers:
  - name: Phase IV Team
    email: team@example.com

home: https://github.com/your-org/todo-chatbot
sources:
  - https://github.com/your-org/todo-chatbot

icon: https://example.com/icon.png
```

---

## Chart Structure

### Directory Layout

```
helm/todo-chatbot/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default configuration values
├── values-dev.yaml         # Development overrides (optional)
├── values-prod.yaml        # Production overrides (optional)
├── .helmignore             # Files to exclude from chart
├── README.md               # Chart documentation
├── templates/              # Kubernetes manifest templates
│   ├── NOTES.txt          # Post-install instructions
│   ├── _helpers.tpl       # Template helper functions
│   ├── deployment.yaml    # Deployment template
│   ├── service.yaml       # Service template
│   ├── configmap.yaml     # ConfigMap template
│   └── secret.yaml        # Secret template (example only)
└── charts/                 # Dependency charts (empty for now)
```

---

## Values Schema (values.yaml)

### Image Configuration

```yaml
image:
  repository: todo-chatbot
  pullPolicy: Never  # For Minikube (IfNotPresent for production)
  tag: ""  # Overrides appVersion from Chart.yaml
```

**Validation Rules**:
- `repository`: Non-empty string
- `pullPolicy`: One of [Always, IfNotPresent, Never]
- `tag`: String (empty uses appVersion)

### Replica Configuration

```yaml
replicaCount: 1
```

**Validation Rules**:
- `replicaCount`: Integer >= 1, <= 10

### Service Configuration

```yaml
service:
  type: NodePort
  port: 80
  targetPort: 3000
  nodePort: 30080  # Optional: specify NodePort (30000-32767)
```

**Validation Rules**:
- `type`: One of [ClusterIP, NodePort, LoadBalancer]
- `port`: Integer 1-65535
- `targetPort`: Integer 1-65535
- `nodePort`: Integer 30000-32767 (only if type=NodePort)

### Resource Configuration

```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi
```

**Validation Rules**:
- `cpu`: String with unit (m for millicores)
- `memory`: String with unit (Mi, Gi)
- `requests` <= `limits`

### Health Check Configuration

```yaml
livenessProbe:
  enabled: true
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  enabled: true
  httpGet:
    path: /api/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

**Validation Rules**:
- `enabled`: Boolean
- `path`: Non-empty string starting with /
- `port`: Integer 1-65535
- `initialDelaySeconds`: Integer >= 0
- `periodSeconds`: Integer > 0
- `timeoutSeconds`: Integer > 0
- `failureThreshold`: Integer > 0

### Environment Configuration

```yaml
env:
  - name: NODE_ENV
    value: production
  - name: PORT
    value: "3000"
  - name: LOG_LEVEL
    value: info
  - name: NEXT_TELEMETRY_DISABLED
    value: "1"
```

**Validation Rules**:
- Array of objects with `name` and `value` fields
- `name`: Non-empty string
- `value`: String (numbers must be quoted)

### ConfigMap and Secret References

```yaml
configMapName: todo-chatbot-config
secretName: todo-chatbot-secrets
```

**Validation Rules**:
- `configMapName`: Non-empty string (DNS-1123 subdomain)
- `secretName`: Non-empty string (DNS-1123 subdomain)

### Autoscaling Configuration (Optional)

```yaml
autoscaling:
  enabled: false
  minReplicas: 1
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80
```

**Validation Rules**:
- `enabled`: Boolean
- `minReplicas`: Integer >= 1
- `maxReplicas`: Integer > minReplicas
- `targetCPUUtilizationPercentage`: Integer 1-100
- `targetMemoryUtilizationPercentage`: Integer 1-100

---

## Template Specifications

### _helpers.tpl (Template Helpers)

**Required Helper Functions**:

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "todo-chatbot.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "todo-chatbot.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "todo-chatbot.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "todo-chatbot.labels" -}}
helm.sh/chart: {{ include "todo-chatbot.chart" . }}
{{ include "todo-chatbot.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "todo-chatbot.selectorLabels" -}}
app.kubernetes.io/name: {{ include "todo-chatbot.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

### deployment.yaml Template

**Template Structure**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "todo-chatbot.fullname" . }}
  labels:
    {{- include "todo-chatbot.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "todo-chatbot.selectorLabels" . | nindent 6 }}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        {{- include "todo-chatbot.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - name: http
          containerPort: {{ .Values.service.targetPort }}
          protocol: TCP
        {{- if .Values.livenessProbe.enabled }}
        livenessProbe:
          httpGet:
            path: {{ .Values.livenessProbe.httpGet.path }}
            port: {{ .Values.livenessProbe.httpGet.port }}
          initialDelaySeconds: {{ .Values.livenessProbe.initialDelaySeconds }}
          periodSeconds: {{ .Values.livenessProbe.periodSeconds }}
          timeoutSeconds: {{ .Values.livenessProbe.timeoutSeconds }}
          failureThreshold: {{ .Values.livenessProbe.failureThreshold }}
        {{- end }}
        {{- if .Values.readinessProbe.enabled }}
        readinessProbe:
          httpGet:
            path: {{ .Values.readinessProbe.httpGet.path }}
            port: {{ .Values.readinessProbe.httpGet.port }}
          initialDelaySeconds: {{ .Values.readinessProbe.initialDelaySeconds }}
          periodSeconds: {{ .Values.readinessProbe.periodSeconds }}
          timeoutSeconds: {{ .Values.readinessProbe.timeoutSeconds }}
          failureThreshold: {{ .Values.readinessProbe.failureThreshold }}
        {{- end }}
        envFrom:
        - configMapRef:
            name: {{ .Values.configMapName }}
        - secretRef:
            name: {{ .Values.secretName }}
        resources:
          {{- toYaml .Values.resources | nindent 12 }}
```

### service.yaml Template

**Template Structure**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: {{ include "todo-chatbot.fullname" . }}
  labels:
    {{- include "todo-chatbot.labels" . | nindent 4 }}
spec:
  type: {{ .Values.service.type }}
  ports:
  - port: {{ .Values.service.port }}
    targetPort: {{ .Values.service.targetPort }}
    protocol: TCP
    name: http
    {{- if and (eq .Values.service.type "NodePort") .Values.service.nodePort }}
    nodePort: {{ .Values.service.nodePort }}
    {{- end }}
  selector:
    {{- include "todo-chatbot.selectorLabels" . | nindent 4 }}
```

### configmap.yaml Template

**Template Structure**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Values.configMapName }}
  labels:
    {{- include "todo-chatbot.labels" . | nindent 4 }}
data:
  {{- range .Values.env }}
  {{ .name }}: {{ .value | quote }}
  {{- end }}
```

### secret.yaml Template (Example Only)

**Template Structure**:
```yaml
# NOTE: This is a template example only
# Actual secrets should be created manually before Helm install
# DO NOT include real secrets in this file

apiVersion: v1
kind: Secret
metadata:
  name: {{ .Values.secretName }}
  labels:
    {{- include "todo-chatbot.labels" . | nindent 4 }}
type: Opaque
data:
  # Base64 encoded values
  # Create actual secret with:
  # kubectl create secret generic todo-chatbot-secrets \
  #   --from-literal=DATABASE_URL="your-connection-string" \
  #   --from-literal=AUTH_SECRET="your-secret" \
  #   --from-literal=BETTER_AUTH_SECRET="your-secret"
```

### NOTES.txt Template

**Post-Install Instructions**:
```
Thank you for installing {{ .Chart.Name }}!

Your release is named {{ .Release.Name }}.

To access your application:

{{- if eq .Values.service.type "NodePort" }}
  export NODE_PORT=$(kubectl get --namespace {{ .Release.Namespace }} -o jsonpath="{.spec.ports[0].nodePort}" services {{ include "todo-chatbot.fullname" . }})
  export NODE_IP=$(minikube ip)
  echo "Visit http://$NODE_IP:$NODE_PORT to access your application"

  Or use: minikube service {{ include "todo-chatbot.fullname" . }}
{{- else if eq .Values.service.type "LoadBalancer" }}
  export SERVICE_IP=$(kubectl get svc --namespace {{ .Release.Namespace }} {{ include "todo-chatbot.fullname" . }} -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
  echo "Visit http://$SERVICE_IP:{{ .Values.service.port }} to access your application"
{{- else }}
  kubectl port-forward --namespace {{ .Release.Namespace }} svc/{{ include "todo-chatbot.fullname" . }} 8080:{{ .Values.service.port }}
  echo "Visit http://localhost:8080 to access your application"
{{- end }}

To check the status of your deployment:
  kubectl get pods --namespace {{ .Release.Namespace }} -l "app.kubernetes.io/name={{ include "todo-chatbot.name" . }},app.kubernetes.io/instance={{ .Release.Name }}"
```

---

## Helm Commands

### Chart Development

**Lint Chart**:
```bash
helm lint helm/todo-chatbot
```

**Template Rendering** (dry-run):
```bash
helm template my-release helm/todo-chatbot
```

**Template with Values**:
```bash
helm template my-release helm/todo-chatbot --values helm/todo-chatbot/values-dev.yaml
```

### Chart Installation

**Install Chart**:
```bash
helm install todo-chatbot helm/todo-chatbot
```

**Install with Custom Values**:
```bash
helm install todo-chatbot helm/todo-chatbot \
  --set replicaCount=2 \
  --set image.tag=v1.0.0
```

**Install with Values File**:
```bash
helm install todo-chatbot helm/todo-chatbot \
  --values helm/todo-chatbot/values-dev.yaml
```

**Install with Dry-Run**:
```bash
helm install todo-chatbot helm/todo-chatbot --dry-run --debug
```

### Chart Management

**List Releases**:
```bash
helm list
```

**Get Release Status**:
```bash
helm status todo-chatbot
```

**Get Release Values**:
```bash
helm get values todo-chatbot
```

**Upgrade Release**:
```bash
helm upgrade todo-chatbot helm/todo-chatbot
```

**Rollback Release**:
```bash
helm rollback todo-chatbot 1
```

**Uninstall Release**:
```bash
helm uninstall todo-chatbot
```

---

## Validation Criteria

### Pre-Installation

- ✅ Chart passes `helm lint`
- ✅ Templates render without errors
- ✅ All required values have defaults
- ✅ Secret exists (created manually)
- ✅ Container image exists in Minikube

### Post-Installation

- ✅ All resources created successfully
- ✅ Deployment reaches desired replica count
- ✅ Pods pass readiness checks
- ✅ Service has endpoints
- ✅ Application is accessible
- ✅ NOTES.txt displays correctly

### Validation Commands

```bash
# Lint chart
helm lint helm/todo-chatbot

# Dry-run install
helm install todo-chatbot helm/todo-chatbot --dry-run --debug

# Install chart
helm install todo-chatbot helm/todo-chatbot

# Check release status
helm status todo-chatbot

# Check Kubernetes resources
kubectl get all -l app.kubernetes.io/instance=todo-chatbot

# Test application
minikube service todo-chatbot-service
```

---

## AI Tool Integration

### Helm Chart Generation

**Approach**: Helm charts are typically created using `helm create` command and then customized. AI tools can assist with:
1. Generating custom templates
2. Optimizing values.yaml structure
3. Creating helper functions
4. Writing NOTES.txt instructions

**Initial Scaffold**:
```bash
helm create helm/todo-chatbot
```

**AI-Assisted Customization**:
Use Claude Code to:
- Generate deployment template with specific requirements
- Create values.yaml with all configuration options
- Write helper functions in _helpers.tpl
- Generate NOTES.txt with access instructions

### Audit Trail Requirements

For Helm chart creation, log:
- Chart scaffold command executed
- Templates generated (full content)
- Values.yaml structure and defaults
- Any AI-assisted customizations
- Lint results
- Test installation results

Store in: `logs/deployment-audit.md`

---

## Troubleshooting

### Issue: Helm lint fails

**Diagnosis**:
```bash
helm lint helm/todo-chatbot
```

**Common Causes**:
- Invalid YAML syntax
- Missing required fields in Chart.yaml
- Template rendering errors

**Solutions**:
- Fix YAML syntax errors
- Ensure Chart.yaml has all required fields
- Test template rendering: `helm template`

### Issue: Template rendering fails

**Diagnosis**:
```bash
helm template my-release helm/todo-chatbot --debug
```

**Common Causes**:
- Undefined values referenced in templates
- Invalid template syntax
- Missing helper functions

**Solutions**:
- Ensure all values have defaults
- Check template syntax ({{ }} vs {{- }})
- Verify helper functions are defined

### Issue: Installation fails

**Diagnosis**:
```bash
helm install todo-chatbot helm/todo-chatbot --debug
kubectl get events --sort-by=.metadata.creationTimestamp
```

**Common Causes**:
- Secret doesn't exist
- Container image not found
- Insufficient cluster resources

**Solutions**:
- Create secret before install
- Build image in Minikube
- Check cluster resources: `kubectl top nodes`

---

## Best Practices

1. **Version Everything**: Increment chart version on every change
2. **Provide Defaults**: All values should have sensible defaults
3. **Document Values**: Comment each value in values.yaml
4. **Use Helpers**: Reduce duplication with _helpers.tpl
5. **Test Thoroughly**: Lint, dry-run, and test install before release
6. **Keep Secrets Separate**: Never include real secrets in chart
7. **Write Clear NOTES**: Provide clear post-install instructions
8. **Follow Conventions**: Use standard Helm chart structure

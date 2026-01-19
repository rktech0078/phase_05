# Docker Contracts: Container Image Specifications

**Feature**: 001-k8s-ai-deployment
**Date**: 2026-01-15
**Phase**: Phase 1 - Design

## Overview

This document specifies the contract for Docker container images used in the Kubernetes deployment. These specifications guide AI-assisted image generation using Gordon or Claude Code.

## Container Image: todo-chatbot

### Image Metadata

**Name**: `todo-chatbot`
**Tags**:
- `latest` (development)
- `v1.0.0` (versioned release)

**Base Image**: `node:18-alpine`
**Build Method**: Multi-stage Docker build
**Target Size**: < 200MB (optimized)

### Build Stages

#### Stage 1: Dependencies (deps)

**Purpose**: Install production dependencies only

**Base**: `node:18-alpine`
**Working Directory**: `/app`
**Operations**:
1. Install libc6-compat (Alpine compatibility)
2. Copy package.json and package-lock.json
3. Run `npm ci --only=production`

**Output**: node_modules/ with production dependencies

#### Stage 2: Builder

**Purpose**: Build Next.js application with standalone output

**Base**: `node:18-alpine`
**Working Directory**: `/app`
**Operations**:
1. Copy node_modules from deps stage
2. Copy all source code
3. Set `NEXT_TELEMETRY_DISABLED=1`
4. Run `npm run build`

**Requirements**:
- next.config.js must have `output: 'standalone'`
- Build must complete without errors
- .next/standalone directory must be created

**Output**:
- .next/standalone/ (minimal runtime bundle)
- .next/static/ (static assets)
- public/ (public assets)

#### Stage 3: Runner (Production)

**Purpose**: Minimal runtime image with only necessary files

**Base**: `node:18-alpine`
**Working Directory**: `/app`
**Operations**:
1. Set environment variables:
   - `NODE_ENV=production`
   - `NEXT_TELEMETRY_DISABLED=1`
2. Create non-root user (nextjs:1001)
3. Copy artifacts from builder:
   - public/
   - .next/standalone/
   - .next/static/
4. Set ownership to nextjs user
5. Switch to non-root user
6. Expose port 3000
7. Set startup command: `node server.js`

**Security Requirements**:
- ✅ Run as non-root user (nextjs:1001)
- ✅ Minimal attack surface (Alpine base)
- ✅ No dev dependencies included
- ✅ No source code included (only built artifacts)

### Environment Variables

#### Build-Time Variables

**NEXT_TELEMETRY_DISABLED**: `1`
- Disables Next.js telemetry during build
- Reduces build output noise

#### Runtime Variables (Injected by Kubernetes)

**Required**:
- `NODE_ENV`: "production"
- `PORT`: "3000"
- `DATABASE_URL`: PostgreSQL connection string (from Secret)
- `AUTH_SECRET`: Authentication secret (from Secret)
- `BETTER_AUTH_SECRET`: Better Auth secret (from Secret)

**Optional**:
- `LOG_LEVEL`: "info" (from ConfigMap)
- `NEXT_PUBLIC_*`: Any client-side variables

### Port Exposure

**Container Port**: 3000
**Protocol**: TCP
**Purpose**: HTTP server for Next.js application

### Health Check Endpoints

**Liveness**: `GET /api/health`
- Returns: 200 OK with `{"status": "healthy"}`
- Purpose: Verify application is running

**Readiness**: `GET /api/ready`
- Returns: 200 OK with `{"status": "ready"}` if database connected
- Returns: 503 Service Unavailable if database unreachable
- Purpose: Verify application is ready to serve traffic

### .dockerignore Specification

**Must Exclude**:
```
node_modules
.next
.git
.env
.env.local
.env.*.local
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.DS_Store
*.swp
*.swo
.vscode
.idea
coverage
.nyc_output
dist
build
```

### Build Command

**Using Gordon (Docker AI)**:
```
Prompt: "Generate a multi-stage Dockerfile for a Next.js 16+ application with standalone output mode. Use node:18-alpine base, create non-root user, optimize for production, and expose port 3000."
```

**Fallback (Claude Code)**:
```bash
# Generate Dockerfile content via Claude Code
# Build image
docker build -t todo-chatbot:latest .
```

**Minikube Build** (recommended):
```bash
# Point to Minikube Docker daemon
eval $(minikube docker-env)

# Build inside Minikube
docker build -t todo-chatbot:latest .
```

### Image Validation

**Pre-Deployment Checks**:
- ✅ Image builds without errors
- ✅ Image size < 200MB
- ✅ Image contains server.js in /app
- ✅ Image runs as non-root user
- ✅ Container starts successfully: `docker run -p 3000:3000 todo-chatbot:latest`
- ✅ Health endpoint responds: `curl http://localhost:3000/api/health`

**Validation Commands**:
```bash
# Check image size
docker images todo-chatbot:latest

# Inspect image layers
docker history todo-chatbot:latest

# Verify user
docker run --rm todo-chatbot:latest whoami
# Expected: nextjs

# Test container startup
docker run -d -p 3000:3000 --name test-todo todo-chatbot:latest
sleep 5
curl http://localhost:3000/api/health
docker stop test-todo && docker rm test-todo
```

### Image Tagging Strategy

**Development**:
- `todo-chatbot:latest` - Always points to most recent build

**Versioned Releases**:
- `todo-chatbot:v1.0.0` - Semantic versioning
- `todo-chatbot:v1.0.0-rc.1` - Release candidates
- `todo-chatbot:commit-abc123` - Git commit SHA

**Minikube Usage**:
- Use `imagePullPolicy: Never` in Kubernetes manifests
- No need to push to registry (local build)

### Security Considerations

**Image Scanning** (optional for hackathon):
```bash
# Scan for vulnerabilities
docker scan todo-chatbot:latest
```

**Best Practices Applied**:
- ✅ Multi-stage build (minimal final image)
- ✅ Non-root user execution
- ✅ Alpine base (minimal attack surface)
- ✅ No secrets in image layers
- ✅ Explicit version pinning (node:18-alpine)

### Troubleshooting

**Issue**: Image size too large (> 200MB)
- **Solution**: Verify standalone output is enabled in next.config.js
- **Solution**: Check .dockerignore excludes node_modules and .next

**Issue**: Container fails to start
- **Solution**: Check server.js exists in .next/standalone/
- **Solution**: Verify all dependencies are in production node_modules

**Issue**: Health check fails
- **Solution**: Ensure /api/health endpoint exists in application
- **Solution**: Check container port 3000 is accessible

**Issue**: Permission denied errors
- **Solution**: Verify files are owned by nextjs user in Dockerfile
- **Solution**: Check COPY --chown=nextjs:nodejs syntax

## AI Tool Integration

### Gordon (Docker AI) Prompt Template

```
Generate a production-ready Dockerfile for a Next.js 16+ full-stack application with the following requirements:

1. Multi-stage build with three stages: deps, builder, runner
2. Base image: node:18-alpine
3. Install production dependencies only in deps stage
4. Build with standalone output mode in builder stage
5. Create non-root user (nextjs:1001) in runner stage
6. Copy only necessary runtime files to runner stage
7. Expose port 3000
8. Set NODE_ENV=production
9. Disable Next.js telemetry
10. Start with: node server.js

Optimize for minimal image size and security best practices.
```

### Fallback (Claude Code) Approach

If Gordon is unavailable:
1. Request Dockerfile generation from Claude Code with same requirements
2. Document fallback reasoning in audit log
3. Validate generated Dockerfile against contract specifications
4. Test build before proceeding to Kubernetes deployment

### Audit Trail Requirements

For each image build, log:
- Tool used (Gordon or Claude Code)
- Prompt sent (exact wording)
- Dockerfile generated (full content)
- Build command executed
- Build output (success/failure, warnings)
- Image size and layers
- Validation results
- Any modifications made to generated Dockerfile

Store in: `logs/deployment-audit.md`

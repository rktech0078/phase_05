# Multi-stage build for sync-service

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/sync-service/package*.json ./services/sync-service/
COPY services/sync-service/tsconfig.json ./services/sync-service/

# Copy package files to root for dependency installation
COPY services/sync-service/package*.json ./
RUN npm install

# Copy shared and service code
COPY services/shared ./services/shared
COPY services/sync-service ./services/sync-service

# Set working directory for build
WORKDIR /app/services/sync-service

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY services/sync-service/package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder
COPY --from=builder /app/services/sync-service/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports (HTTP and WebSocket)
EXPOSE 3005 3006

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "dist/index.js"]

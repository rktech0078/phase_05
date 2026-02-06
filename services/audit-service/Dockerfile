# Multi-stage build for audit-service

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/audit-service/package*.json ./services/audit-service/
COPY services/audit-service/tsconfig.json ./services/audit-service/

# Copy package files to root for dependency installation
COPY services/audit-service/package*.json ./
RUN npm install

# Copy shared and service code
COPY services/shared ./services/shared
COPY services/audit-service ./services/audit-service

# Set working directory for build
WORKDIR /app/services/audit-service

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY services/audit-service/package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder
COPY --from=builder /app/services/audit-service/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "dist/index.js"]

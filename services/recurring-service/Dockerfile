# Multi-stage build for recurring-service

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY services/recurring-service/package*.json ./services/recurring-service/
COPY services/recurring-service/tsconfig.json ./services/recurring-service/

# Copy package files to root for dependency installation
COPY services/recurring-service/package*.json ./
RUN npm install

# Copy shared and service code
COPY services/shared ./services/shared
COPY services/recurring-service ./services/recurring-service

# Set working directory for build
WORKDIR /app/services/recurring-service

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY services/recurring-service/package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy built files from builder
COPY --from=builder /app/services/recurring-service/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start service
CMD ["node", "dist/index.js"]

# Multi-stage Docker Build für DressForPleasure Backend
# Optimiert für Cloud-Deployment (Railway, Render, Heroku)

# ========================
# Base Stage
# ========================
FROM node:18-alpine AS base

# Metadata
LABEL maintainer="DressForPleasure <admin@dressforp.com>"
LABEL description="DressForPleasure Backend API - Node.js/Express/TypeScript"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Install system dependencies und Security Updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user early
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# ========================
# Dependencies Stage
# ========================
FROM base AS dependencies

# Set npm cache directory
RUN npm config set cache /app/.npm-cache --global

# Install all dependencies (including dev dependencies)
# Use npm ci for reproducible builds
RUN npm install --silent || npm ci --frozen-lockfile --silent

# Copy source code
COPY src ./src
COPY drizzle.config.ts ./

# ========================
# Build Stage
# ========================
FROM dependencies AS build

# Build the application
RUN npm run build

# Verify build output
RUN test -d ./dist || (echo "Build failed - dist directory not found" && exit 1)

# Clean install production dependencies only
RUN npm install --production --silent || npm ci --frozen-lockfile --production --silent && \
    npm cache clean --force

# ========================
# Production Stage
# ========================
FROM node:18-alpine AS production

# Install system dependencies und Tools für Cloud-Monitoring
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application with proper ownership
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=build --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=backend:nodejs /app/package*.json ./

# Copy scripts for Cloud-Deployment
COPY --chown=backend:nodejs scripts ./scripts
RUN chmod +x ./scripts/*.sh

# Create necessary directories
RUN mkdir -p /app/logs /app/temp /app/uploads && \
    chown -R backend:nodejs /app/logs /app/temp /app/uploads

# Switch to non-root user
USER backend

# Expose port (Cloud-Provider setzen meist PORT Environment Variable)
EXPOSE ${PORT:-3000}

# Enhanced Health check für Cloud-Provider
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Cloud-Provider spezifische Optimierungen
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
ENV NPM_CONFIG_LOGLEVEL=warn

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/app.js"]

# ========================
# Development Stage
# ========================
FROM dependencies AS development

# Install nodemon globally
RUN npm install -g nodemon

# Switch to non-root user
USER node

# Expose port and debugger port
EXPOSE 3000 9229

# Start with nodemon for development
CMD ["npm", "run", "dev"]

# Labels for metadata
LABEL maintainer="DressForPleasure <admin@dressforp.com>"
LABEL description="DressForPleasure Backend API - Node.js/Express/TypeScript"
LABEL version="1.0.0"

# Multi-stage Docker Build für DressForPleasure Backend

# ========================
# Base Stage
# ========================
FROM node:18-alpine AS base
WORKDIR /app

# Install dumb-init für besseres Signal-Handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./

# ========================
# Dependencies Stage
# ========================
FROM base AS dependencies

# Install all dependencies (including dev dependencies)
RUN npm ci --frozen-lockfile

# Copy source code
COPY src ./src
COPY drizzle.config.ts ./

# ========================
# Build Stage
# ========================
FROM dependencies AS build

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm ci --frozen-lockfile --production && npm cache clean --force

# ========================
# Production Stage
# ========================
FROM node:18-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S backend -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=build --chown=backend:nodejs /app/dist ./dist
COPY --from=build --chown=backend:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=backend:nodejs /app/package*.json ./

# Create logs directory
RUN mkdir -p /app/logs && chown backend:nodejs /app/logs

# Switch to non-root user
USER backend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

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

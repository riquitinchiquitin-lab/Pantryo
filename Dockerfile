# Pantryo - Production Dockerfile
# Uses Debian bookworm-slim (glibc) to guarantee 100% compatibility with C++ native modules
# like better-sqlite3-multiple-ciphers and avoid Alpine/musl SIGSEGV (exit code 139) crashes.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native build tools required for compiling C++ addons on any architecture (x86_64, arm64)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install all dependencies
COPY package*.json ./
RUN npm install

# Copy application source files
COPY . .

# Build Vite frontend and bundle Express backend
RUN npm run build

# Prune dev dependencies so node_modules contains only compiled production packages
RUN npm prune --omit=dev

# Production runtime stage
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies (curl for container healthcheck and ca-certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Pre-create data and application directories and set ownership to built-in 'node' user (UID 1000)
RUN mkdir -p /app/server/data && chown -R node:node /app

# Copy production dependencies and package.json from builder with node ownership
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copy compiled backend bundle and frontend dist from builder with node ownership
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/public ./public

# Ensure write permissions for node user on server data directory
RUN chown -R node:node /app/server/data && chmod -R 777 /app/server/data

# Switch to non-root user
USER node

EXPOSE 3000

# Healthcheck to verify the server is responding to HTTP requests
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start compiled standalone Express server
CMD ["node", "dist/server.cjs"]

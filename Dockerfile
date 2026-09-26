# Pantryo - Production Dockerfile
# Uses Debian bookworm-slim (glibc) to guarantee 100% compatibility with C++ native modules
# like better-sqlite3-multiple-ciphers and avoid Alpine/musl SIGSEGV (exit code 139) crashes.
FROM node:20-bookworm-slim AS builder

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

# Production runtime stage
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install runtime dependencies (curl for container healthcheck and ca-certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled backend bundle and frontend dist from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

# Ensure database directory exists with read/write access
RUN mkdir -p /app/server/data

EXPOSE 3000

# Healthcheck to verify the server is responding to HTTP requests
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start compiled standalone Express server
CMD ["node", "dist/server.cjs"]

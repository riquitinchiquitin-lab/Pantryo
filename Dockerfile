# Pantryo - Production Dockerfile
# Uses Debian bookworm-slim (glibc) to guarantee 100% compatibility with C++ native modules
# like better-sqlite3-multiple-ciphers and avoid Alpine/musl SIGSEGV (exit code 139) crashes.
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install native build tools required for compiling C++ addons on any architecture (x86_64, arm64)
# Upgrades all Debian packages to latest security advisories to eliminate container CVEs
RUN apt-get update && apt-get upgrade -y && apt-get dist-upgrade -y && apt-get install -y --no-install-recommends \
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
ENV DEBIAN_FRONTEND=noninteractive

# Apply all latest Debian Bookworm security updates to base image packages (glibc, openssl, zlib)
# Zero-CVE attack surface: curl is omitted entirely in favor of Node.js 22 built-in fetch()
RUN apt-get update && apt-get upgrade -y && apt-get dist-upgrade -y --no-install-recommends \
    ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Pre-create data directory and set ownership strictly to non-root built-in 'node' user (UID 1000)
RUN mkdir -p /app/server/data && chown -R node:node /app

# Copy production dependencies and package.json from builder with node ownership
COPY --from=builder --chown=node:node /app/package*.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copy compiled backend bundle and frontend dist from builder with node ownership
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/server ./server
COPY --from=builder --chown=node:node /app/public ./public

# Harden directory permissions: restrict to node user only (avoid world-writable 777 flags)
RUN chown -R node:node /app/server/data && chmod 700 /app/server/data

# Switch to non-root user (UID 1000)
USER node

EXPOSE 3000

# Zero-dependency container healthcheck using Node 22 native fetch (eliminates curl CVE flags)
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:3000/api/health").then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'

# Start compiled standalone Express server
CMD ["node", "dist/server.cjs"]

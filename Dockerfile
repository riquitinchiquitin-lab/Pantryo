# Kitchen Komrade - Production Dockerfile for Containerized / Proxmox Deployment
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build Vite frontend and bundle Express server with esbuild
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled backend bundle and frontend dist
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server ./server

EXPOSE 3000

# Start compiled standalone Express server
CMD ["node", "dist/server.cjs"]

# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=20.18-alpine
# ---- build stage ----
FROM node:${NODE_VERSION} AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build  # should produce build/

# ---- runtime stage ----
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

# Copy only what we need to run
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package*.json ./

# Default env-safe runtime settings
ENV NODE_ENV=production
# If you want default DRY run on first deploy, uncomment:
# ENV DRY_RUN=true

# Start the one-shot job
CMD ["node", "build/jobs/syncDiffsOnce.js"]

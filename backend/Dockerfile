# Remit-Scout Backend (placeholder image for ECS/Fargate)
# Build from repo root:
#   docker build -f backend/Dockerfile -t remit-scout-backend:latest .

FROM node:18-alpine AS deps
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
RUN pnpm install --filter remit-scout-backend... --frozen-lockfile

FROM deps AS build
COPY backend backend
RUN pnpm -C backend build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG BUILD_VERSION=dev
LABEL org.opencontainers.image.revision=$BUILD_VERSION

COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/pnpm-lock.yaml pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml pnpm-workspace.yaml

# Default entrypoint is Plane B ingestion. Override for other tasks.
CMD ["node", "backend/dist/plane-b/ingest.js"]

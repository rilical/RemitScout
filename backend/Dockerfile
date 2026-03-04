# Remit-Scout Backend (placeholder image for ECS/Fargate)
# Build from repo root:
#   docker build -f backend/Dockerfile -t remit-scout-backend:latest .

FROM public.ecr.aws/docker/library/node:20-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8 AS deps
WORKDIR /app
RUN corepack enable

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY backend/package.json backend/
RUN pnpm install --filter remit-scout-backend... --frozen-lockfile

FROM deps AS build
ARG SKIP_BACKEND_BUILD=0
COPY backend backend
COPY .remit-scout .remit-scout
RUN if [ "$SKIP_BACKEND_BUILD" != "1" ]; then pnpm -C backend build; else echo "Skipping backend build"; fi

FROM public.ecr.aws/docker/library/node:20-alpine@sha256:09e2b3d9726018aecf269bd35325f46bf75046a643a66d28360ec71132750ec8 AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache ca-certificates
ARG BUILD_VERSION=dev
LABEL org.opencontainers.image.revision=$BUILD_VERSION

COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/db/migrations backend/dist/db/migrations
COPY --from=build /app/backend/dist/shared backend/shared
COPY --from=build /app/backend/dist/plane-a backend/dist/plane-a/src
COPY --from=build /app/backend/dist/plane-b backend/dist/plane-b/src
COPY --from=build /app/backend/dist/plane-c backend/dist/plane-c/src
COPY --from=build /app/backend/dist/scripts backend/dist/scripts
COPY --from=build /app/backend/package.json backend/package.json
COPY --from=build /app/.remit-scout .remit-scout
COPY --from=build /app/.remit-scout backend/.remit-scout
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/backend/node_modules backend/node_modules
COPY --from=deps /app/pnpm-lock.yaml pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml pnpm-workspace.yaml

# Ensure root-level module resolution finds backend native deps in smoke checks.
RUN ln -sfn /app/backend/node_modules/sharp /app/node_modules/sharp

# Drop root privileges for runtime.
RUN chown -R node:node /app
USER node

# ECS health checks hit the shared health server.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');const r=http.get('http://localhost:8080/healthz',res=>{process.exit(res.statusCode===200?0:1)});r.on('error',()=>process.exit(1))"

# Default entrypoint is Plane B ingestion. Override for other tasks.
CMD ["node", "backend/dist/plane-b/ingest.js"]

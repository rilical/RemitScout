# Local Dev with Docker

This doc is the fastest path to get the backend running locally using Docker.
It is written so an LLM or a new engineer can follow it step-by-step.

## Prerequisites
- Docker Desktop (or compatible Docker runtime)
- Node.js 18+
- pnpm 10+

## Services and Ports
- Postgres: 5432
- Plane A API: 4000
- Plane C Pulse: 4100

## Quick Start (LLM-safe)
1) Start Postgres:
```
docker-compose up -d
```

2) Create env file for backend:
```
cp backend/.env.example backend/.env
```
If needed, adjust `DATABASE_URL*`, `PLANE_C_BASE_URL`, and auth flags in `backend/.env`.

3) Run migrations and seed data:
```
pnpm -C backend db:migrate
pnpm -C backend db:seed
```

4) Start Plane C and Plane A:
```
pnpm -C backend dev:plane-c
pnpm -C backend dev:plane-a
```
Optionally run ingestion manually (re-seeds data):
```
pnpm -C backend dev:plane-b
```

## Frontend Wiring (Local)
- The frontend defaults to `/api` and proxies through the Nuxt BFF.
- Set `API_BASE=http://localhost:4000` before running the frontend dev server so the proxy forwards to Plane A.

Example:
```
API_BASE=http://localhost:4000 pnpm -C frontend dev
```

## Resetting Local Data
```
docker-compose down -v
```
Then re-run migrate + seed.

## Guardrail Test (Plane A cannot read Bronze)
```
RUN_BRONZE_GUARDRAIL_TEST=1 \
DATABASE_URL_PLANE_A=postgres://plane_a:plane_a@localhost:5432/remit \
pnpm -C backend test
```

## Troubleshooting
- If Plane A fails DB access, verify roles exist (`plane_a`, `plane_b`, `plane_c`) and migrations ran.
- If `/pulse/*` errors, confirm Plane C is running and `PLANE_C_BASE_URL` points to `http://localhost:4100`.

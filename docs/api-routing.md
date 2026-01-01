# API Routing and Base Path (Decision Pending)

## Current state
- Backend routes are defined as `/api/...` paths only.
- The domain and base URL are owned by deployment (for example, `https://api.remit-scout.com/api/...`).

## Decision pending
- We have not locked the public base path yet (options: `/api`, `/api/v1`, or `/remit-scout/api`).
- This will be decided with the gateway or reverse proxy configuration later.

## Implications
- No code change required now. Route paths remain `/api/...`.
- Frontend and clients should treat the base URL as a deployment concern for now.

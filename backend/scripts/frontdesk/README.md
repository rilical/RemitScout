# Slack Front Desk (scripts)

Entrypoint:
- `backend/scripts/frontdesk/slack-frontdesk.ts`

This runner is intentionally minimal: it writes inbox events to `ops/brain/inbox/`.
The Brain owns allowlists, risk gating, and workflow dispatch.

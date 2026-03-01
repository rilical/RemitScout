# Slack Front Desk (Socket Mode)

## What this is
The Slack Front Desk is the operator UI for IssueOps:
- Posts Case cards (via Brain) into a single ops channel.
- Provides buttons and `/issueops` for human-driven actions.
- Writes **durable inbox events** under `ops/brain/inbox/` so the Brain mediates all dispatching.

This keeps Slack as a UI surface only. The Brain remains the policy + execution router.

Inbox filename contract:
- Front desk writes timestamp-first inbox filenames (`inbox-<utc_ts>-<event_type>-<uuid>.json`) so Brain inbox scans can process events in deterministic lexical order.

## Components
- Slack Front Desk runner (Socket Mode):
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/frontdesk/slack-frontdesk.ts`
- Brain (posts cards, handles CaseAction events):
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/brain/brain.ts`
- Inbox/outbox:
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ops/brain/inbox/`
  - `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ops/brain/outbox/`

## Required Slack setup
1. Create a Slack App in your workspace.
2. Enable Socket Mode.
3. Add OAuth scopes:
   - `chat:write`
   - `commands`
4. (Recommended) Add bot to your ops channel.
5. Capture secrets:
   - `SLACK_BOT_TOKEN` (xoxb-...)
   - `SLACK_APP_TOKEN` (xapp-..., Socket Mode token)
   - `SLACK_SIGNING_SECRET`
6. Configure:
   - `SLACK_CASES_CHANNEL_ID`

## Local runtime (Mac mini)
The front desk runner loads `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.env.frontdesk` if present.
Start from `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.env.frontdesk.example`.

Example env file keys:
```bash
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_SIGNING_SECRET=...
SLACK_CASES_CHANNEL_ID=C0123456789

# Optional: default repo root override
# REMIT_SCOUT_REPO_ROOT=/Users/omarghabyen/Desktop/Remit-Scout Production V2
```

Run:
```bash
cd "/Users/omarghabyen/Desktop/Remit-Scout Production V2"
pnpm -C backend frontdesk:slack
```

## launchd
Use:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ops/frontdesk/launchd/remit-scout-frontdesk.plist`

Logs:
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ops/frontdesk/frontdesk.out.log`
- `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ops/frontdesk/frontdesk.err.log`

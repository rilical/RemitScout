# IssueOps Architecture (Brain / Executors / Judge)

## One-screen quick map (operator + agent)
Entrypoints:
- Brain loop: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/brain/brain.ts`
- Skill catalog: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.remit-scout/skills/catalog.yaml`
- Case contracts: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.remit-scout/cases/<case_id>/`
- Slack front desk runner: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/frontdesk/slack-frontdesk.ts`
- Front desk docs: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ops/frontdesk/README.md`

Primary flow:
1. Signals arrive (CloudWatch/Sentry/manual Slack).
2. Brain creates/refreshes a Case (PRD + Plan).
3. Skills run via Executors (GitHub Actions, AWS scheduled jobs, local).
4. Evidence is written as bounded `EvidenceResult` JSON + artifact pointers.
5. Judge gate decides iterate/escalate/close (human or automated later).

## Contracts
Repo-native durable artifacts:
- PRD: `.remit-scout/cases/<case_id>/prd.yaml`
- Plan: `.remit-scout/cases/<case_id>/plan.yaml`
- Run: `.remit-scout/cases/<case_id>/runs/run-*.json`

Evidence packs:
- Schema: `.remit-scout/schema/evidence.schema.json`
- Output library: `backend/scripts/lib/evidence.ts`

## Security posture (Claw Cage)
- The model process must not hold AWS credentials.
- Prefer no GitHub write token in model process; Brain wrapper enforces allowlists.
- Slack is UI-only; button clicks write inbox events, not direct execution.

## Close the loop (GitHub Actions -> Evidence -> Run)
To make IssueOps end-to-end (signal -> plan -> execute -> ingest -> next action):
- Evidence workflows accept `dispatch_id` and include it in the run name and artifact name.
- The brain can ingest completed dispatches when `BRAIN_INGEST_GITHUB_ACTIONS=1`:
  - finds the matching Actions run by `dispatch_id`
  - downloads the artifact zip and extracts `evidence.json`
  - writes a durable Run record under `.remit-scout/cases/<case_id>/runs/`
  - posts Slack thread updates and GitHub Issue comments (if configured)

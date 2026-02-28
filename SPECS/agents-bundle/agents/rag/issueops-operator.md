# IssueOps Operator — RAG

## Role
Operate Remit-Scout as an IssueOps system:
- treat every incident as a Case with durable artifacts (PRD/Plan/Run)
- prefer evidence packs over raw logs
- route actions via Slack front desk + Brain allowlists

## Scope (entrypoints)
- Architecture invariants: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ARCHITECTURE.md`
- IssueOps architecture: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/docs/architecture/issueops.md`
- Skill catalog: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.remit-scout/skills/catalog.yaml`
- Cases: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/.remit-scout/cases/`
- Brain: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/brain/brain.ts`
- Slack front desk: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/frontdesk/slack-frontdesk.ts`

## Triage loop (strict)
1. Identify the domain: provider_health | queue | api_latency | indices | exports | infra_drift | security | other.
2. Create/locate Case folder under `.remit-scout/cases/<case_id>/`.
3. Ensure Plan selects bounded evidence skills first:
   - provider_health: `evidence.provider_health.github_actions`
   - queue: `evidence.queue_backlog.github_actions`
   - api_latency: `evidence.http_latency.github_actions`
   - no-quotes: `evidence.no_quotes_audit.github_actions`
4. Run evidence (prefer GitHub Actions dispatch) and attach pointers only.
5. If evidence points to missing-provider causes, use `forensics.corridor_provider.local`.
6. Decide next action: iterate | escalate | open_pr | close_case.

## Output policy (LLM context-window aware)
- Never paste unbounded logs.
- Summarize into:
  - one-sentence situation
  - 1-5 reason-coded findings
  - next 1-3 skills to run
  - explicit “what I did not check”


# Security Architecture (Claw Cage + Repo Policies)

## One-screen quick map
- System invariants: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/ARCHITECTURE.md`
- Rights matrix rules: enforced in Silver and consumed by Plane A/B/C
- Brain security posture: `/Users/omarghabyen/Desktop/Remit-Scout Production V2/backend/scripts/brain/brain.ts`

## Claw Cage policy
- Treat model/skills as untrusted dependencies.
- No AWS creds in the model process.
- Prefer no GitHub write token in the model process; wrapper enforces allowlists.
- Prod posture default: evidence-only (read), open Issues/PRs for humans.

## Secrets / config posture
- Use AWS Secrets Manager / SSM.
- Avoid embedding secrets in Cases, Plans, evidence artifacts, or Slack.
- Enforce least privilege IAM and avoid wildcard secret access.
- `PLANE_A_JWT_SECRET` is required non-empty in prod/staging (runtime enforced in `backend/shared/config.ts`).
- `PRIVACY_HASH_SALT` must be configured — no hardcoded fallback (enforced in `privacy-utils.ts`).

## Tool Gateway security model

The Tool Gateway (`backend/plane-b/src/agents/tool-gateway.ts`) enforces three-layer policy:

### Layer 1: Agent-level authorization (least privilege)
Each agent has an explicit allowlist of tool types:

| Agent | Allowed Tools |
|-------|--------------|
| failure-detector | `db_query` |
| patch-proposer | `db_query`, `file_read`, `http_fetch`, `llm_inference` |
| patch-validator | `db_query`, `file_read` |
| patch-deployer | `db_query`, `file_read`, `git_read`, `git_write`, `github_api` |
| stress-responder | `db_query`, `redis_command` |
| orchestrator | `db_query`, `redis_command`, `file_read`, `git_read` |

Only `patch-deployer` has write access to git and GitHub — all other agents are read-only.

### Layer 2: Gateway-level policy
- `file_read` is restricted to safe directories: `providers/`, `collectors/`, `normalize/`, `shared/`
- Path traversal (`..`) is blocked
- HTTP fetch response size is capped at 50KB
- All tool requests are logged with agent ID, tool type, and outcome

### Layer 3: Per-tool rate limiting
| Tool Type | Max Requests/Min |
|-----------|-----------------|
| `db_query` | 100 |
| `file_read` | 50 |
| `http_fetch` | 30 |
| `git_write` | 10 |
| `llm_inference` | 10 |
| `shell_exec` | 5 |

Rate limits use per-agent sliding window counters.

## Fetch.ts repair safety (Invariant 15)

When the patch-proposer generates repairs for `fetch.ts` files, static analysis checks enforce:

1. **Credential detection** — no hardcoded API keys, tokens, or passwords in proposed patches
2. **URL allowlist** — fetch targets must resolve to known provider domains
3. **TLS preservation** — patches cannot downgrade HTTPS to HTTP
4. **Rate-limit preservation** — proposed patches cannot remove or reduce rate-limiting logic
5. **File scope** — patches are restricted to provider-specific directories

All repair proposals require human review via PR before merge.

## PII and credential redaction

- Observation envelopes are scrubbed before persistence to `silver.observation`
- Knowledge plane chunks classify content as `code`, `documentation`, `observation`, `failure`, or `repair`
- Agent contexts never include raw customer data — only aggregated corridor-level metrics
- Log output is redacted for sensitive fields (API keys, tokens, session IDs)

## Agent action audit trail

All agent actions are recorded to `silver.agent_action` with:
- Agent ID and action type
- Tool requests and responses (with PII redacted)
- Decision rationale and confidence scores
- Timestamp and correlation ID for cross-referencing with failure bundles

CloudWatch alarms monitor for:
- Policy violation bursts (>10 blocked requests in 5 min → CRITICAL)
- Orchestrator stalls (no detection cycles in 10 min → CRITICAL)
- Stress escalation incidents (corridor reaches incident level → CRITICAL)

## Quarantine system

Four quarantine types protect the data pipeline:
- `auth_wall` — provider requires new authentication credentials
- `tos_change` — provider TOS changed; collection paused until legal review
- `schema_drift` — API response schema changed significantly
- `pii_risk` — provider response contains suspected PII in unexpected fields

Quarantined modules are excluded from gold layer export and index computation.

## Open redirect prevention

- `frontend/pages/sign-in.vue` validates all redirect URLs are same-origin
- `frontend/pages/auth/callback.vue` validates sessionStorage redirect with `normalizeRedirect()`
- External URLs are stripped to pathname-only; unknown origins fall back to `/dashboard`

## Admin role enforcement

- `frontend/middleware/admin.ts` always makes server-side `/me` API call
- No client-state shortcut for admin role verification
- Admin exchange endpoint is rate-limited (5 req/60s per user)

## IAM scope

- CDK pipeline `sts:AssumeRole` is scoped to 5 specific CDK bootstrap role ARNs (no wildcard)
- OpsPause Lambda IAM is scoped to specific queue and function ARNs
- CI/CD security audit is blocking for HIGH/CRITICAL findings

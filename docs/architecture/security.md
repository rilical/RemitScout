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


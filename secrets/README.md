# Secrets Management Policy (No Secrets in Repo)

This directory is a placeholder for local development configuration only. No actual secrets should be stored here in source control. All sensitive credentials and keys must be stored in secure secret managers, not in Git.

## Where to Store Secrets
- **AWS Secrets Manager:** Primary store for high-impact secrets (DB passwords, API keys, etc.). Provides encryption, IAM access control, and can automate rotation. Use this for all production credentials.
- **AWS SSM Parameter Store (SecureString):** Used for certain low-sensitivity configs or when simpler retrieval is needed. Still encrypted with KMS. Good for feature flags or less critical tokens.
- **Never in Git:** No secrets or API keys should ever be hard-coded or committed to this repo. CI and code reviews include scans to catch secrets if someone accidentally commits them.

## Secret Rotation
All secrets must be rotated regularly to reduce risk. We follow a Secret Rotation Runbook for each secret type:
- **Automated Rotation:** Wherever possible, use automated rotation (e.g. AWS RDS can auto-rotate credentials).
- **Manual Rotation Procedure:** If manual steps are needed, follow the documented runbook (e.g. RBK-SEC-001 security procedure for rotating keys) and record the rotation event. Every rotation must be logged in our internal audit logs or runbook notes for compliance.

(RBK-SEC-001 refers to our security incident/rotation procedures; see internal runbook for details.)

## Guidelines for Developers
- **.env Files:** If you use a local `.env` for development, do not check it into Git. This folder is in `.gitignore` to help prevent that. For shared dev/test secrets, use Parameter Store rather than sharing env files.
- **Access Control:** Use IAM roles in code to fetch secrets at runtime. Each service or function should only access the secrets it needs (principle of least privilege). For example, Plane A lambdas fetch only their own DB creds, with no access to Plane B's raw storage creds.
- **Audit and Alerts:** Access to secrets is monitored (CloudTrail logs). Unusual access patterns trigger alerts so we can respond quickly. If you rotate a secret or change permissions, ensure alerts and monitors are updated accordingly.

By following these policies, we maintain a secure posture: secrets stay out of the codebase, use strong encryption in AWS, and every access or change is auditable. This is critical for compliance and limiting exposure in case of credential compromise.

# Runtime Guardrails (Plane A Deny Bronze)

This document describes the runtime controls that must enforce the Golden Rule beyond lint.
Plane A must not be able to access Bronze storage at runtime.

## Required Infrastructure Controls
- **IAM Deny:** Plane A roles must have an explicit deny for Bronze resources (S3 buckets, KMS keys, database credentials).
- **VPC Segmentation:** Plane A services should have no network path to Bronze subnets or endpoints.
- **Security Groups:** Only Plane B roles and subnets should be permitted to reach Bronze storage endpoints.

## Guardrail Integration Test
Use the script in `backend/scripts/bronze-access-check.js` to verify Plane A cannot access Bronze.

### Usage
- Set `BRONZE_TEST_URL` to a Bronze endpoint that should be denied for Plane A.
- Optionally set `BRONZE_EXPECT_STATUS` (default `403`).

Example:
```
BRONZE_TEST_URL=https://bronze.example.internal/health \
BRONZE_EXPECT_STATUS=401,403 \
pnpm -C backend guardrail:test
```

A passing result confirms that Plane A cannot access Bronze at runtime. Any 200-level response is a failure and must be treated as a security regression.

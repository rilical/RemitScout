#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FAILURES=0

require_contains() {
  local file="$1"
  local needle="$2"
  local message="$3"
  if ! grep -Fq "$needle" "$ROOT_DIR/$file"; then
    echo "FAIL: $message"
    echo "  missing: $needle"
    echo "  file: $file"
    FAILURES=1
  fi
}

require_absent() {
  local file="$1"
  local needle="$2"
  local message="$3"
  if grep -Fq "$needle" "$ROOT_DIR/$file"; then
    echo "FAIL: $message"
    echo "  found: $needle"
    echo "  file: $file"
    FAILURES=1
  fi
}

require_absent \
  "backend/plane-a/src/routes/admin.ts" \
  'LIMIT ${limit}' \
  "admin route SQL must not use direct string-interpolated limit values"

require_contains \
  "backend/shared/config.ts" \
  "adminRequireAllowlist" \
  "admin allowlist requirement config must exist"

require_contains \
  "backend/shared/config.ts" \
  "adminAllowlistStrict" \
  "admin allowlist strict config must exist"

require_contains \
  "backend/scripts/seed-launch-users.ts" \
  "SEED_PRINT_PASSWORDS_ENABLED" \
  "seed script must enforce explicit env opt-in before exporting passwords"

require_absent \
  "backend/scripts/seed-launch-users.ts" \
  "...(args.printPasswords ? { password: password.value } : {})," \
  "seed script must not write plaintext passwords to stdout payload"

require_contains \
  "infrastructure/cdk/lib/iam.ts" \
  "arn:aws:ses:*:*:identity/*" \
  "IAM defaults should scope SES to identity ARNs instead of '*'"

require_contains \
  "infrastructure/cdk/lib/iam.ts" \
  "arn:aws:sns:*:*:remit-scout-*" \
  "IAM defaults should scope SNS to remit-scout topic ARNs instead of '*'"

require_absent \
  "infrastructure/cdk/lib/database.ts" \
  "log_statement: 'all'" \
  "database must not log full SQL statements by default"

if [[ "$FAILURES" -ne 0 ]]; then
  echo "Compliance guard checks failed."
  exit 1
fi

echo "Compliance guard checks passed."

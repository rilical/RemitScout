#!/usr/bin/env bash
set -euo pipefail

action="${1:-}"
if [[ "$action" != "pause" && "$action" != "resume" ]]; then
  echo "Usage: $(basename "$0") pause|resume" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir/.."

ACTION="$action" node - <<'NODE'
const fs = require('fs')
const path = require('path')

const action = process.env.ACTION
const filePath = path.join(process.cwd(), 'cdk.json')
const raw = fs.readFileSync(filePath, 'utf8')
const data = JSON.parse(raw)

data.context = data.context || {}

const setValue = (key, value) => {
  data.context[key] = value
}

if (action === 'pause') {
  setValue('devPaused', true)
  setValue('planeBIngestDesiredCount', 0)
  setValue('planeBB2cRefreshDesiredCount', 0)
  setValue('planeBIngestFanoutTier1DesiredCount', 0)
  setValue('planeBIngestFanoutTier2DesiredCount', 0)
  setValue('goldLiveDesiredCount', 0)
  setValue('planeBNotificationsDesiredCount', 0)
  setValue('planeBOpsAlertsDesiredCount', 0)
  setValue('planeBQueueWorkerDesiredCount', 0)
  setValue('planeBQueueWorkerMaxCount', 0)
} else {
  setValue('devPaused', false)
  setValue('planeBIngestDesiredCount', 1)
  setValue('planeBB2cRefreshDesiredCount', 1)
  // Tier 1 fanout stays 0 while tier_1 is disabled.
  setValue('planeBIngestFanoutTier1DesiredCount', 0)
  setValue('planeBIngestFanoutTier2DesiredCount', 1)
  setValue('goldLiveDesiredCount', 1)
  setValue('planeBNotificationsDesiredCount', 1)
  setValue('planeBOpsAlertsDesiredCount', 1)
  setValue('planeBQueueWorkerDesiredCount', 1)
  setValue('planeBQueueWorkerMaxCount', 5)
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n')
NODE

if [[ -z "${CDK_DEFAULT_REGION:-}" ]]; then
  export CDK_DEFAULT_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-1}}"
fi

if [[ -z "${CDK_DEFAULT_ACCOUNT:-}" ]]; then
  if command -v aws >/dev/null 2>&1; then
    profile="${AWS_PROFILE:-rs-dev}"
    account="$(aws sts get-caller-identity --query Account --output text --profile "$profile" 2>/dev/null || true)"
    if [[ -n "$account" && "$account" != "None" ]]; then
      export CDK_DEFAULT_ACCOUNT="$account"
    fi
  fi
fi

if [[ -z "${CDK_DEFAULT_ACCOUNT:-}" ]]; then
  echo "CDK_DEFAULT_ACCOUNT not set; export it or configure AWS_PROFILE." >&2
  exit 1
fi

npx cdk synth -c env=dev

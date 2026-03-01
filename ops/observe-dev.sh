#!/usr/bin/env bash
set -euo pipefail

# Hourly dev observation runner.
# Focus: B2B tier-2 ingestion cadence + worker/queue health.
#
# Requires: AWS CLI auth for AWS_PROFILE (default rs-dev). If auth is missing/expired,
# this script prints a clear error and exits non-zero.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SESSION_FILE="${SESSION_FILE:-ops/observation-session.json}"
AWS_PROFILE="${AWS_PROFILE:-rs-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"

ts_utc() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

echo "== remit-scout dev observe =="
echo "ts_utc=$(ts_utc)"
echo "aws_profile=$AWS_PROFILE aws_region=$AWS_REGION session_file=$SESSION_FILE"
echo

if ! AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws sts get-caller-identity >/dev/null 2>&1; then
  echo "ERROR: AWS auth not available (likely SSO expired). Run: AWS_PROFILE=${AWS_PROFILE} aws sso login" >&2
  exit 2
fi

BASE_URL="$(
  SESSION_FILE="$SESSION_FILE" python3 - <<'PY'
import json
import os

path = os.environ["SESSION_FILE"]
with open(path, "r", encoding="utf-8") as f:
  print(str(json.load(f).get("baseUrl", "")).strip())
PY
)"

echo "-- CloudFormation stack status --"
AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws cloudformation describe-stacks \
  --stack-name remit-scout-dev \
  --query 'Stacks[0].{Status:StackStatus,LastUpdated:LastUpdatedTime}' \
  --output table
echo

echo "-- Runtime status --"
make status-dev || true
echo

echo "-- Alarms (dev, ALARM state) --"
AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws cloudwatch describe-alarms \
  --state-value ALARM \
  --query "MetricAlarms[?contains(AlarmName,'remit-scout-dev')].[AlarmName,StateValue]" \
  --output table || true
echo

echo "-- SQS (tier2 ingest + dlq) --"
for q in remit-scout-dev-ingest-fanout-tier2 remit-scout-dev-ingest-fanout-tier2-dlq; do
  url="$(AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws sqs get-queue-url --queue-name "$q" --query QueueUrl --output text 2>/dev/null || true)"
  echo "queue=$q"
  if [[ -n "$url" && "$url" != "None" ]]; then
    AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws sqs get-queue-attributes \
      --queue-url "$url" \
      --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible ApproximateNumberOfMessagesDelayed \
      --output table
  else
    echo "MISSING queue url"
  fi
  echo
done

echo "-- B2B sweep scheduler logs (last 4h; due + enqueue) --"
START_MS="$(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
print(int((datetime.now(timezone.utc)-timedelta(hours=4)).timestamp()*1000))
PY
)"
AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws logs filter-log-events \
  --log-group-name /remit-scout/dev/b2b-sweep-scheduler \
  --start-time "$START_MS" \
  --filter-pattern 'scheduler_data_loaded || tier_due || b2b_sweep_enqueued || tier_skipped || FATAL' \
  --max-items 60 \
  --query 'events[].message' --output text 2>/dev/null || true
echo

echo "-- Tier2 worker logs (last 30m; completion signals) --"
START_MS_30="$(python3 - <<'PY'
from datetime import datetime, timedelta, timezone
print(int((datetime.now(timezone.utc)-timedelta(minutes=30)).timestamp()*1000))
PY
)"
AWS_PROFILE="$AWS_PROFILE" AWS_REGION="$AWS_REGION" aws logs filter-log-events \
  --log-group-name /remit-scout/dev/ingest-fanout-tier2-worker \
  --start-time "$START_MS_30" \
  --filter-pattern 'quote_attempt_finish || fanout_corridor_done || collector_start || FATAL' \
  --max-items 60 \
  --query 'events[].message' --output text 2>/dev/null || true
echo

if [[ -n "$BASE_URL" ]]; then
  echo "-- API quick checks --"
  curl -fsS "$BASE_URL/healthz" >/dev/null && echo "PASS $BASE_URL/healthz" || echo "FAIL $BASE_URL/healthz"
  curl -fsS "$BASE_URL/readyz"  >/dev/null && echo "PASS $BASE_URL/readyz"  || echo "FAIL $BASE_URL/readyz"
  curl -fsS "$BASE_URL/api/v1/indices/health" >/dev/null && echo "PASS $BASE_URL/api/v1/indices/health" || echo "FAIL $BASE_URL/api/v1/indices/health"
  echo
fi

PAUSE_AT_END="$(
  SESSION_FILE="$SESSION_FILE" python3 - <<'PY'
import json
import os

path = os.environ["SESSION_FILE"]
with open(path, "r", encoding="utf-8") as f:
  print('true' if json.load(f).get('pauseAtEnd', True) else 'false')
PY
)"
DURATION_HOURS="$(
  SESSION_FILE="$SESSION_FILE" python3 - <<'PY'
import json
import os

path = os.environ["SESSION_FILE"]
with open(path, "r", encoding="utf-8") as f:
  print(int(json.load(f).get('durationHours', 4)))
PY
)"

# Best-effort: use the file mtime as session start (avoids persisting extra state).
START_EPOCH="$(
  SESSION_FILE="$SESSION_FILE" python3 - <<'PY'
import os

path = os.environ["SESSION_FILE"]
print(int(os.stat(path).st_mtime))
PY
)"
NOW_EPOCH="$(date +%s)"
ELAPSED_SEC="$((NOW_EPOCH - START_EPOCH))"
LIMIT_SEC="$((DURATION_HOURS * 3600))"

echo "session_elapsed_sec=$ELAPSED_SEC session_limit_sec=$LIMIT_SEC pause_at_end=$PAUSE_AT_END"

if [[ "$PAUSE_AT_END" == "true" && "$ELAPSED_SEC" -ge "$LIMIT_SEC" ]]; then
  echo "== Observation window complete; pausing dev =="
  make ops-pause-dev || true
  echo "== Final status =="
  make status-dev || true
fi

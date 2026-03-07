#!/usr/bin/env bash
set -euo pipefail

: "${AWS_PROFILE:=rs-dev}"
: "${AWS_REGION:=us-east-1}"

export AWS_PROFILE AWS_REGION

CLUSTER="remit-scout-dev"
SVC_INGEST="remit-scout-dev-PlaneBIngestService1875B86C-GvPxzOjhVr3h" # pragma: allowlist secret
SVC_FANOUT_T2="remit-scout-dev-IngestFanoutTier2WorkerService1EAB902A-yE1wRlBaWy2A" # pragma: allowlist secret

# Used for CloudWatch DatabaseConnections sampling (best-effort).
DB_CLUSTER_ID="remit-scout-dev-remitscoutauroracluster4aa33bab-am3xjbcrzsnh"

PLANE_A_BASE_URL="${PLANE_A_BASE_URL:-}"
if [[ -z "${PLANE_A_BASE_URL}" ]]; then
  # Use JMESPath literal string via backticks to avoid shell quoting issues.
  PLANE_A_BASE_URL="$(aws cloudformation describe-stacks --stack-name remit-scout-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`PlaneAApiUrl`].OutputValue | [0]' \
    --output text 2>/dev/null || true)"
  if [[ "${PLANE_A_BASE_URL}" == "None" ]]; then
    PLANE_A_BASE_URL=""
  fi
fi

queue_snapshot() {
  local q="$1"
  local url
  url="$(aws sqs get-queue-url --queue-name "$q" --query 'QueueUrl' --output text 2>/dev/null || true)"
  if [[ -z "${url}" ]]; then
    echo "${q}  {\"error\":\"missing_queue\"}"
    return
  fi
  aws sqs get-queue-attributes \
    --queue-url "$url" \
    --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
    --query 'Attributes' \
    --output json 2>/dev/null \
    | awk -v q="$q" '{print q "  " $0}'
}

log_count() {
  local group="$1"
  local start_ms="$2"
  local pattern="$3"
  local label="$4"
  local n
  n="$(aws logs filter-log-events \
    --no-paginate \
    --log-group-name "$group" \
    --start-time "$start_ms" \
    --filter-pattern "$pattern" \
    --query 'length(events)' \
    --output text 2>/dev/null || true)"
  if [[ -z "${n}" || "${n}" == "None" ]]; then
    n="0"
  fi
  echo "${label}=${n}"
}

cw_queue_age_max_seconds() {
  local queue_name="$1"
  local start end age
  # CloudWatch can be delayed; use a ~20m window and take the most recent datapoint's Max.
  start="$(date -u -v-20M +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '20 minutes ago' +%Y-%m-%dT%H:%M:%SZ)"
  end="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  age="$(aws cloudwatch get-metric-statistics \
    --namespace AWS/SQS \
    --metric-name ApproximateAgeOfOldestMessage \
    --dimensions "Name=QueueName,Value=${queue_name}" \
    --start-time "$start" \
    --end-time "$end" \
    --period 300 \
    --statistics Maximum \
    --query 'sort_by(Datapoints,&Timestamp)[-1].Maximum' \
    --output text 2>/dev/null || true)"
  if [[ -z "${age}" || "${age}" == "None" ]]; then
    age=""
  fi
  echo "${age}"
}

plane_a_probe() {
  local label="$1"
  local url="$2"
  local resp status
  resp="$(curl -sS --max-time 15 -w $'\n__HTTP_STATUS:%{http_code}__\n' "$url" 2>/dev/null || true)"
  status="$(printf '%s' "$resp" | awk -F'__HTTP_STATUS:' 'NF>1{print $2}' | tr -d '_' | tr -d '\n' | tail -n 1)"
  if [[ -z "${status}" ]]; then
    status="000"
  fi
  if printf '%s' "$resp" | rg -q 'quotes_unavailable|collecting'; then
    echo "${label}=status_${status}_collecting"
  else
    echo "${label}=status_${status}_ok"
  fi
}

for i in $(seq 1 24); do
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo ""
  echo "=== ${ts} (tick ${i}/24) ==="

  aws ecs describe-services \
    --cluster "$CLUSTER" \
    --services "$SVC_INGEST" "$SVC_FANOUT_T2" \
    --query 'services[].{name:serviceName,desired:desiredCount,running:runningCount,pending:pendingCount}' \
    --output table 2>/dev/null || true

  queue_snapshot "remit-scout-dev-ingest-fanout-tier2"
  queue_snapshot "remit-scout-dev-ingest-fanout-tier2-dlq"
  queue_snapshot "remit-scout-dev-ingest-fanout"
  queue_snapshot "remit-scout-dev-ingest-fanout-dlq"
  age_t2="$(cw_queue_age_max_seconds remit-scout-dev-ingest-fanout-tier2)"
  if [[ -n "${age_t2}" ]]; then
    echo "cw t2_age_oldest_seconds_max(last~20m)=${age_t2}"
  else
    echo "cw t2_age_oldest_seconds_max(last~20m)=unknown"
  fi

  start_ms="$(( ($(date +%s) - 300) * 1000 ))"

  if [[ -n "${PLANE_A_BASE_URL}" ]]; then
    echo -n "plane_a "
    plane_a_probe "healthz" "${PLANE_A_BASE_URL}/healthz"
    plane_a_probe "readyz" "${PLANE_A_BASE_URL}/readyz"
    # Tier-2 corridors (non-US) for B2B-oriented warming checks.
    plane_a_probe "providers_GB_NG" "${PLANE_A_BASE_URL}/api/v1/providers?amount=500&from=GB&fromCurrency=GBP&method=bank&to=NG&toCurrency=NGN"
    plane_a_probe "providers_AE_IN" "${PLANE_A_BASE_URL}/api/v1/providers?amount=500&from=AE&fromCurrency=AED&method=bank&to=IN&toCurrency=INR"
    plane_a_probe "providers_DE_TR" "${PLANE_A_BASE_URL}/api/v1/providers?amount=500&from=DE&fromCurrency=EUR&method=bank&to=TR&toCurrency=TRY"
  fi

  # Key error signatures (5m window)
  echo -n "fanout_tier2 "
  log_count "/remit-scout/dev/ingest-fanout-tier2-worker" "$start_ms" '"too many clients"' "too_many_clients"
  log_count "/remit-scout/dev/ingest-fanout-tier2-worker" "$start_ms" '"remaining connection slots"' "remaining_slots"
  log_count "/remit-scout/dev/ingest-fanout-tier2-worker" "$start_ms" '"Config validation failed"' "config_validation_failed"

  echo -n "b2b_scheduler "
  log_count "/remit-scout/dev/b2b-sweep-scheduler" "$start_ms" '"scheduler_complete"' "complete"
  log_count "/remit-scout/dev/b2b-sweep-scheduler" "$start_ms" '"tier_skipped"' "tier_skipped"
  log_count "/remit-scout/dev/b2b-sweep-scheduler" "$start_ms" '"scheduler_error"' "error"

  # DB connections sample every 15 minutes (best-effort; CloudWatch is delayed).
  if [[ $((i % 3)) -eq 0 ]]; then
    start="$(date -u -v-20M +%Y-%m-%dT%H:%M:%SZ)"
    end="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    conn_max="$(aws cloudwatch get-metric-statistics \
      --namespace AWS/RDS \
      --metric-name DatabaseConnections \
      --dimensions "Name=DBClusterIdentifier,Value=${DB_CLUSTER_ID}" \
      --start-time "$start" \
      --end-time "$end" \
      --period 300 \
      --statistics Maximum \
      --query 'sort_by(Datapoints,&Timestamp)[-1].Maximum' \
      --output text 2>/dev/null || true)"
    echo "rds DatabaseConnections max(last~20m)=${conn_max}"
  fi

  sleep 300
done

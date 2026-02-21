#!/usr/bin/env bash
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-rs-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"
OPS_ENV="${OPS_ENV:-dev}"
TARGET_CLUSTER="${TARGET_CLUSTER:-remit-scout-${OPS_ENV}}"
TARGET_LOG_PREFIX="${TARGET_LOG_PREFIX:-/remit-scout-${OPS_ENV}}"

check_failures=0

echo "Checking AWS identity (profile=${AWS_PROFILE}, region=${AWS_REGION})"
IDENTITY_JSON="$(AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" aws sts get-caller-identity --output json)"

PRINCIPAL_ARN="$(printf '%s' "$IDENTITY_JSON" | jq -r '.Arn')"
ACCOUNT_ID="$(printf '%s' "$IDENTITY_JSON" | jq -r '.Account')"
USER_ID="$(printf '%s' "$IDENTITY_JSON" | jq -r '.UserId')"

if [ -z "$PRINCIPAL_ARN" ] || [ "$PRINCIPAL_ARN" = "null" ] || [ "$PRINCIPAL_ARN" = "None" ]; then
  echo "ERROR: Unable to resolve caller identity. Run 'aws sts get-caller-identity' and fix credentials." >&2
  exit 1
fi

echo "Principal ARN: ${PRINCIPAL_ARN}"
echo "Account: ${ACCOUNT_ID}"
echo "User ID: ${USER_ID}"
echo

POLICY_SOURCE_ARN="$PRINCIPAL_ARN"
if [[ "$PRINCIPAL_ARN" =~ ^arn:aws:sts::([0-9]{12}):assumed-role/(.+)/[^/]+$ ]]; then
  ASSUMED_ACCOUNT_ID="${BASH_REMATCH[1]}"
  ASSUMED_ROLE_NAME="${BASH_REMATCH[2]}"
  POLICY_SOURCE_ARN="arn:aws:iam::${ASSUMED_ACCOUNT_ID}:role/${ASSUMED_ROLE_NAME}"
fi

echo "Policy source ARN: ${POLICY_SOURCE_ARN}"
echo

require_action() {
  local action=$1
  decision="$(AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" aws iam simulate-principal-policy \
    --policy-source-arn "$POLICY_SOURCE_ARN" \
    --action-names "$action" \
    --query 'EvaluationResults[0].EvalDecision' \
    --output text)"

  if [ "$decision" != "allowed" ]; then
    echo "DENY: ${action}"
    ((check_failures += 1))
  else
    echo "ALLOW: ${action}"
  fi
}

echo "Checking required IAM actions via policy simulation"
required_actions=(
  ecs:ListClusters
  ecs:ListServices
  ecs:UpdateService
  cloudformation:ListStacks
  logs:DescribeLogGroups
  logs:DescribeLogStreams
  logs:GetLogEvents
  logs:CreateLogStream
  logs:PutLogEvents
)

for action in "${required_actions[@]}"; do
  require_action "$action"
done

echo
if [ "$check_failures" -ne 0 ]; then
  echo "ERROR: Permission simulation found ${check_failures} denied action(s)."
  echo "Suggestion: assume the dedicated IAM role used by the staging deploy pipeline (often via AWS_ROLE_TO_ASSUME)."
  echo "Then rerun: AWS_PROFILE=<your-assumed-profile> make status-ops-permissions"
  exit 1
fi

echo "Checking ECS cluster visibility for: ${TARGET_CLUSTER}"
if ! AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" aws ecs describe-clusters --clusters "$TARGET_CLUSTER" --output text >/tmp/ops-ecs-describe.out; then
  echo "ERROR: Cannot read ECS cluster '${TARGET_CLUSTER}'."
  echo "This usually means AWS credentials are not bound to the expected role/policy."
  exit 1
fi

SERVICE_ARN_LIST="$(AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" aws ecs list-services --cluster "$TARGET_CLUSTER" --query 'serviceArns[]' --output text || true)"
if [ -n "$SERVICE_ARN_LIST" ]; then
  echo "Cluster services discoverable:"
  printf '%s\n' "$SERVICE_ARN_LIST"
else
  echo "WARN: no services returned for ${TARGET_CLUSTER}; confirm cluster name and IAM permissions."
fi

echo "Checking CloudWatch logs discoverability for prefix: ${TARGET_LOG_PREFIX}"
if ! AWS_PROFILE="${AWS_PROFILE}" AWS_REGION="${AWS_REGION}" aws logs describe-log-groups --log-group-name-prefix "$TARGET_LOG_PREFIX" --max-items 5 >/tmp/ops-logs-prefix.out; then
  echo "WARN: cannot read CloudWatch log groups (log tailing may fail)."
fi

echo
echo "AWS principal permissions check completed."

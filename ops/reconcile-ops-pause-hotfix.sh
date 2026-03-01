#!/usr/bin/env bash
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-rs-staging}"
AWS_REGION="${AWS_REGION:-us-east-1}"
OPS_ENV="${OPS_ENV:-staging}"
HOTFIX_POLICY_NAME="${HOTFIX_POLICY_NAME:-ops-pause-ecs-listservices-hotfix}"
APPLY="${APPLY:-0}"

if [[ "${OPS_ENV}" != "staging" && "${OPS_ENV}" != "prod" && "${OPS_ENV}" != "dev" ]]; then
  echo "ERROR: OPS_ENV must be one of: dev, staging, prod" >&2
  exit 1
fi

resolve_ops_pause_function_name() {
  local primary_prefix="remit-scout-${OPS_ENV}-OpsPauseControllerFunction"
  local fn
  fn="$(AWS_PROFILE="${AWS_PROFILE}" aws lambda list-functions \
    --region "${AWS_REGION}" \
    --output json | jq -r --arg prefix "${primary_prefix}" '.Functions[]? | .FunctionName // empty | select(startswith($prefix))' | head -n1)"

  if [ -z "${fn}" ] || [ "${fn}" = "None" ]; then
    fn="$(AWS_PROFILE="${AWS_PROFILE}" aws lambda list-functions \
      --region "${AWS_REGION}" \
      --output json | jq -r --arg env "remit-scout-${OPS_ENV}" '.Functions[]? | .FunctionName // empty | select(contains($env) and contains("OpsPauseControllerFuncti"))' | head -n1)"
  fi

  if [ -z "${fn}" ] || [ "${fn}" = "None" ]; then
    echo "ERROR: OpsPause controller Lambda not found for ${OPS_ENV}" >&2
    exit 1
  fi

  printf '%s\n' "${fn}"
}

policy_has_listservices() {
  local role_name="$1"
  local policy_name="$2"
  AWS_PROFILE="${AWS_PROFILE}" aws iam get-role-policy \
    --role-name "${role_name}" \
    --policy-name "${policy_name}" \
    --output json \
    --query 'PolicyDocument.Statement' \
  | jq -e '
      def as_array:
        if type == "array" then .
        else [.] end;
      [ .[]? | .Action? | as_array[] | ascii_downcase ] as $actions
      | ($actions | any(. == "ecs:listservices" or . == "ecs:*" or . == "*"))
    ' >/dev/null
}

echo "Resolving OpsPause controller for env=${OPS_ENV} profile=${AWS_PROFILE} region=${AWS_REGION}"
FUNCTION_NAME="$(resolve_ops_pause_function_name)"
ROLE_ARN="$(AWS_PROFILE="${AWS_PROFILE}" aws lambda get-function-configuration \
  --function-name "${FUNCTION_NAME}" \
  --region "${AWS_REGION}" \
  --query 'Role' \
  --output text)"
ROLE_NAME="${ROLE_ARN##*/}"

echo "Function: ${FUNCTION_NAME}"
echo "Role: ${ROLE_NAME}"

POLICIES="$(AWS_PROFILE="${AWS_PROFILE}" aws iam list-role-policies \
  --role-name "${ROLE_NAME}" \
  --query 'PolicyNames' \
  --output json)"

HOTFIX_PRESENT="$(printf '%s' "${POLICIES}" | jq -e --arg p "${HOTFIX_POLICY_NAME}" 'index($p) != null' >/dev/null && echo "1" || echo "0")"

BASE_HAS_LISTSERVICES="0"
while IFS= read -r policy_name; do
  [ -z "${policy_name}" ] && continue
  if [ "${policy_name}" = "${HOTFIX_POLICY_NAME}" ]; then
    continue
  fi
  if policy_has_listservices "${ROLE_NAME}" "${policy_name}"; then
    BASE_HAS_LISTSERVICES="1"
    break
  fi
done < <(printf '%s' "${POLICIES}" | jq -r '.[]?')

HOTFIX_HAS_LISTSERVICES="0"
if [ "${HOTFIX_PRESENT}" = "1" ] && policy_has_listservices "${ROLE_NAME}" "${HOTFIX_POLICY_NAME}"; then
  HOTFIX_HAS_LISTSERVICES="1"
fi

echo
echo "State:"
echo "  hotfix_present=${HOTFIX_PRESENT}"
echo "  base_has_listservices=${BASE_HAS_LISTSERVICES}"
echo "  hotfix_has_listservices=${HOTFIX_HAS_LISTSERVICES}"

if [ "${BASE_HAS_LISTSERVICES}" = "0" ] && [ "${HOTFIX_HAS_LISTSERVICES}" = "0" ]; then
  echo "ERROR: ecs:ListServices not found in base or hotfix policies; OpsPause is broken." >&2
  exit 1
fi

if [ "${BASE_HAS_LISTSERVICES}" = "1" ] && [ "${HOTFIX_PRESENT}" = "1" ]; then
  if [ "${APPLY}" = "1" ]; then
    echo "Removing hotfix policy ${HOTFIX_POLICY_NAME} from ${ROLE_NAME}"
    AWS_PROFILE="${AWS_PROFILE}" aws iam delete-role-policy \
      --role-name "${ROLE_NAME}" \
      --policy-name "${HOTFIX_POLICY_NAME}"
    echo "Hotfix removed. Role is now reconciled to base policy."
  else
    echo "Ready to remove hotfix. Re-run with APPLY=1 to delete inline hotfix policy."
  fi
  exit 0
fi

if [ "${BASE_HAS_LISTSERVICES}" = "1" ] && [ "${HOTFIX_PRESENT}" = "0" ]; then
  echo "Reconciled: base role policy already includes ecs:ListServices, no hotfix present."
  exit 0
fi

echo "Hotfix still required: base role policy does not yet include ecs:ListServices."
echo "Keep hotfix in place until IaC deploy has been applied."

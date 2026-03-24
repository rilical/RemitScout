#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PROFILE="${AWS_PROFILE:-}"
REGION="${AWS_REGION:-us-east-1}"
TARGET_ENVS="${TARGET_ENVS:-dev,staging,prod}"

aws_cli=(aws)
if [ -n "${PROFILE}" ]; then
  aws_cli+=(--profile "${PROFILE}")
fi

REPO_URL="$(git -C "${ROOT_DIR}" remote get-url origin)"
REPO_PATH="$(echo "${REPO_URL}" | sed -E 's#^https://github.com/##; s#^git@github.com:##; s#\\.git$##')"
CANONICAL_REPO_PATH="$(
  gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true
)"
if [ -n "${CANONICAL_REPO_PATH}" ]; then
  REPO_PATH="${CANONICAL_REPO_PATH}"
fi

GITHUB_ORG="$(echo "${REPO_PATH}" | cut -d/ -f1)"
GITHUB_REPO="$(echo "${REPO_PATH}" | cut -d/ -f2)"
GITHUB_REPO="${GITHUB_REPO%.git}"
GITHUB_ORG_LOWER="$(echo "${GITHUB_ORG}" | tr '[:upper:]' '[:lower:]')"
GITHUB_REPO_LOWER="$(echo "${GITHUB_REPO}" | tr '[:upper:]' '[:lower:]')"

ACCOUNT_ID="$("${aws_cli[@]}" sts get-caller-identity --query Account --output text)"
OIDC_ARN="${OIDC_PROVIDER_ARN:-arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com}"

if [ -z "${OIDC_ARN}" ]; then
  echo "ERROR: token.actions.githubusercontent.com OIDC provider not found in account ${ACCOUNT_ID}."
  exit 1
fi

echo "Ensuring GitHub Actions OIDC deploy roles:"
echo "  account: ${ACCOUNT_ID}"
echo "  region:  ${REGION}"
echo "  profile: ${PROFILE:-<env credentials>}"
echo "  repo:    ${GITHUB_ORG}/${GITHUB_REPO}"
echo "  oidc:    ${OIDC_ARN}"
echo "  targets: ${TARGET_ENVS}"

should_manage_env() {
  local env_name="$1"
  case ",${TARGET_ENVS}," in
    *,"${env_name}",*) return 0 ;;
    *) return 1 ;;
  esac
}

assume_policy_json() {
  local patterns_json="$1"
  cat <<JSON
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Principal": { "Federated": "${OIDC_ARN}" },
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": ${patterns_json}
        }
      }
    }
  ]
}
JSON
}

inline_policy_json() {
  cat <<'JSON'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudFormationRead",
      "Effect": "Allow",
      "Action": [
        "cloudformation:Describe*",
        "cloudformation:Get*",
        "cloudformation:List*",
        "cloudformation:DetectStackDrift",
        "cloudformation:CreateChangeSet",
        "cloudformation:ExecuteChangeSet",
        "cloudformation:CreateStack",
        "cloudformation:UpdateStack",
        "cloudformation:CancelUpdateStack",
        "cloudformation:ContinueUpdateRollback"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchDeploySignals",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:DescribeAlarms",
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogsRead",
      "Effect": "Allow",
      "Action": [
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams",
        "logs:GetLogEvents",
        "logs:FilterLogEvents"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SsmDeployState",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:PutParameter",
        "ssm:DeleteParameter"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/remit-scout/*"
    },
    {
      "Sid": "SecretsManagerRead",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:*"
    },
    {
      "Sid": "EventBridgeRead",
      "Effect": "Allow",
      "Action": [
        "events:ListRules"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EventBridgeManage",
      "Effect": "Allow",
      "Action": [
        "events:EnableRule",
        "events:DisableRule"
      ],
      "Resource": "arn:aws:events:*:*:rule/remit-scout-*"
    },
    {
      "Sid": "BootstrapAssume",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::*:role/cdk-hnb659fds-*"
    },
    {
      "Sid": "EcrPushPull",
      "Effect": "Allow",
      "Action": [
        "ecr:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "FrontendS3",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::remit-scout-*"
    },
    {
      "Sid": "FrontendS3Objects",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::remit-scout-*/*"
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    },
    {
      "Sid": "OpsPauseLambdaDiscover",
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions"
      ],
      "Resource": "*"
    },
    {
      "Sid": "OpsPauseLambdaInvoke",
      "Effect": "Allow",
      "Action": [
        "lambda:InvokeFunction"
      ],
      "Resource": [
        "arn:aws:lambda:*:*:function:remit-scout-*OpsPauseControllerFuncti*",
        "arn:aws:lambda:*:*:function:remit-scout-*OpsPauseControllerFuncti*:*"
      ]
    },
    {
      "Sid": "EcsMigrations",
      "Effect": "Allow",
      "Action": [
        "ecs:RegisterTaskDefinition",
        "ecs:DeregisterTaskDefinition",
        "ecs:RunTask",
        "ecs:ListServices",
        "ecs:DescribeTasks",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeClusters",
        "ecs:DescribeServices",
        "ecs:ListTasks",
        "ecs:UpdateService"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RdsClusterAccess",
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBClusters",
        "rds:StartDBCluster"
      ],
      "Resource": "arn:aws:rds:*:*:cluster:remit-scout-*"
    },
    {
      "Sid": "PassRoles",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": [
        "arn:aws:iam::*:role/remit-scout-*",
        "arn:aws:iam::*:role/cdk-hnb659fds-*"
      ]
    }
  ]
}
JSON
}

ensure_role() {
  local role_name="$1"
  local patterns_json="$2"
  local assume_file="/tmp/${role_name}-assume.json"
  local policy_file="/tmp/${role_name}-policy.json"

  assume_policy_json "${patterns_json}" > "${assume_file}"
  inline_policy_json > "${policy_file}"

  if "${aws_cli[@]}" iam get-role --role-name "${role_name}" >/dev/null 2>&1; then
    echo "Updating role: ${role_name}"
    "${aws_cli[@]}" iam update-assume-role-policy \
      --role-name "${role_name}" \
      --policy-document "file://${assume_file}" >/dev/null
  else
    echo "Creating role: ${role_name}"
    "${aws_cli[@]}" iam create-role \
      --role-name "${role_name}" \
      --assume-role-policy-document "file://${assume_file}" >/dev/null
  fi

  "${aws_cli[@]}" iam update-role \
    --role-name "${role_name}" \
    --max-session-duration 21600 >/dev/null

  "${aws_cli[@]}" iam put-role-policy \
    --role-name "${role_name}" \
    --policy-name "${role_name}" \
    --policy-document "file://${policy_file}" >/dev/null

  "${aws_cli[@]}" iam get-role --role-name "${role_name}" --query 'Role.Arn' --output text
}

DEV_SUBS="$(
  jq -cn \
    --arg repo "repo:${GITHUB_ORG}/${GITHUB_REPO}" \
    --arg repoLower "repo:${GITHUB_ORG_LOWER}/${GITHUB_REPO_LOWER}" \
    '[ "\($repo):environment:dev", "\($repo):ref:refs/heads/develop", "\($repoLower):environment:dev", "\($repoLower):ref:refs/heads/develop" ] | unique'
)"
STAGING_SUBS="$(
  jq -cn \
    --arg repo "repo:${GITHUB_ORG}/${GITHUB_REPO}" \
    --arg repoLower "repo:${GITHUB_ORG_LOWER}/${GITHUB_REPO_LOWER}" \
    '[ "\($repo):environment:staging", "\($repo):ref:refs/heads/develop", "\($repo):ref:refs/heads/main", "\($repo):ref:refs/heads/staging", "\($repoLower):environment:staging", "\($repoLower):ref:refs/heads/develop", "\($repoLower):ref:refs/heads/main", "\($repoLower):ref:refs/heads/staging" ] | unique'
)"
PROD_SUBS="$(
  jq -cn \
    --arg repo "repo:${GITHUB_ORG}/${GITHUB_REPO}" \
    --arg repoLower "repo:${GITHUB_ORG_LOWER}/${GITHUB_REPO_LOWER}" \
    '[ "\($repo):environment:prod", "\($repo):ref:refs/tags/v*", "\($repoLower):environment:prod", "\($repoLower):ref:refs/tags/v*" ] | unique'
)"

DEV_ARN=""
STAGING_ARN=""
PROD_ARN=""

if should_manage_env dev; then
  DEV_ARN="$(ensure_role remit-scout-gha-deploy-dev "${DEV_SUBS}")"
fi

if should_manage_env staging; then
  STAGING_ARN="$(ensure_role remit-scout-gha-deploy-staging "${STAGING_SUBS}")"
fi

if should_manage_env prod; then
  PROD_ARN="$(ensure_role remit-scout-gha-deploy-prod "${PROD_SUBS}")"
fi

echo ""
echo "✅ Done"
if [ -n "${DEV_ARN}" ]; then
  echo "dev:     ${DEV_ARN}"
fi
if [ -n "${STAGING_ARN}" ]; then
  echo "staging: ${STAGING_ARN}"
fi
if [ -n "${PROD_ARN}" ]; then
  echo "prod:    ${PROD_ARN}"
fi

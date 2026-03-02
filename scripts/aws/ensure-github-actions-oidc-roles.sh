#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

PROFILE="${AWS_PROFILE:-rs-dev}"
REGION="${AWS_REGION:-us-east-1}"

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

ACCOUNT_ID="$(AWS_PROFILE="${PROFILE}" aws sts get-caller-identity --query Account --output text)"

OIDC_ARN="$(
  AWS_PROFILE="${PROFILE}" aws iam list-open-id-connect-providers --query 'OpenIDConnectProviderList[].Arn' --output text \
    | tr '\t' '\n' \
    | grep -F 'token.actions.githubusercontent.com' \
    | head -n 1 \
    | tr -d '\r'
)"

if [ -z "${OIDC_ARN}" ]; then
  echo "ERROR: token.actions.githubusercontent.com OIDC provider not found in account ${ACCOUNT_ID} (profile ${PROFILE})."
  echo "Create it first in IAM -> Identity providers, then re-run."
  exit 1
fi

echo "Ensuring GitHub Actions OIDC deploy roles:"
echo "  account: ${ACCOUNT_ID}"
echo "  region:  ${REGION}"
echo "  profile: ${PROFILE}"
echo "  repo:    ${GITHUB_ORG}/${GITHUB_REPO}"
echo "  oidc:    ${OIDC_ARN}"

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
        "cloudformation:List*"
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
      "Sid": "SsmDeployState",
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:PutParameter"
      ],
      "Resource": "arn:aws:ssm:*:*:parameter/remit-scout/*"
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
      "Sid": "EcsMigrations",
      "Effect": "Allow",
      "Action": [
        "ecs:RunTask",
        "ecs:DescribeTasks",
        "ecs:DescribeServices",
        "ecs:ListTasks"
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

  if AWS_PROFILE="${PROFILE}" aws iam get-role --role-name "${role_name}" >/dev/null 2>&1; then
    echo "Updating role: ${role_name}"
    AWS_PROFILE="${PROFILE}" aws iam update-assume-role-policy \
      --role-name "${role_name}" \
      --policy-document "file://${assume_file}" >/dev/null
  else
    echo "Creating role: ${role_name}"
    AWS_PROFILE="${PROFILE}" aws iam create-role \
      --role-name "${role_name}" \
      --assume-role-policy-document "file://${assume_file}" >/dev/null
  fi

  AWS_PROFILE="${PROFILE}" aws iam put-role-policy \
    --role-name "${role_name}" \
    --policy-name "${role_name}" \
    --policy-document "file://${policy_file}" >/dev/null

  AWS_PROFILE="${PROFILE}" aws iam get-role --role-name "${role_name}" --query 'Role.Arn' --output text
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
    '[ "\($repo):environment:staging", "\($repo):ref:refs/heads/develop", "\($repo):ref:refs/heads/main", "\($repoLower):environment:staging", "\($repoLower):ref:refs/heads/develop", "\($repoLower):ref:refs/heads/main" ] | unique'
)"
PROD_SUBS="$(
  jq -cn \
    --arg repo "repo:${GITHUB_ORG}/${GITHUB_REPO}" \
    --arg repoLower "repo:${GITHUB_ORG_LOWER}/${GITHUB_REPO_LOWER}" \
    '[ "\($repo):environment:prod", "\($repo):ref:refs/tags/v*", "\($repoLower):environment:prod", "\($repoLower):ref:refs/tags/v*" ] | unique'
)"

DEV_ARN="$(ensure_role remit-scout-gha-deploy-dev "${DEV_SUBS}")"
STAGING_ARN="$(ensure_role remit-scout-gha-deploy-staging "${STAGING_SUBS}")"
PROD_ARN="$(ensure_role remit-scout-gha-deploy-prod "${PROD_SUBS}")"

echo ""
echo "✅ Done"
echo "dev:     ${DEV_ARN}"
echo "staging: ${STAGING_ARN}"
echo "prod:    ${PROD_ARN}"

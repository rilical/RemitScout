#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$CDK_DIR"

ENV_NAME="${1:-dev}"
BACKEND_IMAGE_TAG="${2:-latest}"
APPROVAL="${3:-never}"

if [ -z "${CDK_DEFAULT_ACCOUNT:-}" ] || [ -z "${CDK_DEFAULT_REGION:-}" ]; then
  echo "❌ Error: CDK_DEFAULT_ACCOUNT and CDK_DEFAULT_REGION must be set"
  echo ""
  echo "Set via environment variables:"
  echo "  export CDK_DEFAULT_ACCOUNT=123456789012"
  echo "  export CDK_DEFAULT_REGION=us-east-1"
  echo ""
  echo "Or via AWS CLI:"
  echo "  aws configure set account 123456789012"
  echo "  aws configure set region us-east-1"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run 'pnpm install' first."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
fi

echo "🔍 Pre-deployment validation..."
echo "   Environment: $ENV_NAME"
echo "   Account: $CDK_DEFAULT_ACCOUNT"
echo "   Region: $CDK_DEFAULT_REGION"
echo "   Backend image tag: $BACKEND_IMAGE_TAG"
echo ""

if [ "$ENV_NAME" = "prod" ]; then
  echo "⚠️  WARNING: Deploying to PRODUCTION environment"
  echo "   This will create/modify production resources."
  echo ""
  if [ "$APPROVAL" = "never" ]; then
    read -p "Continue? (yes/no): " -r
    if [ "$REPLY" != "yes" ]; then
      echo "Deployment cancelled."
      exit 1
    fi
  fi
fi

echo "🔍 Validating context..."
pnpm cdk synth \
  -c env="$ENV_NAME" \
  -c backendImageTag="$BACKEND_IMAGE_TAG" \
  --quiet \
  > /dev/null 2>&1 || {
  echo "❌ Context validation failed. Run 'pnpm cdk synth' to see errors."
  exit 1
}

echo "✅ Context validation passed"
echo ""
echo "🚀 Deploying stack..."

APPROVAL_FLAG="--require-approval $APPROVAL"

pnpm cdk deploy \
  -c env="$ENV_NAME" \
  -c backendImageTag="$BACKEND_IMAGE_TAG" \
  $APPROVAL_FLAG

echo ""
echo "✅ Deployment complete!"


#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CDK_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$CDK_DIR"

ENV_NAME="${1:-dev}"
BACKEND_IMAGE_TAG="${2:-latest}"

echo "🔨 Synthesizing CDK stack for environment: $ENV_NAME"
echo "   Backend image tag: $BACKEND_IMAGE_TAG"

if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run 'pnpm install' first."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  pnpm install
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
echo "📝 Synthesizing CloudFormation template..."

pnpm cdk synth \
  -c env="$ENV_NAME" \
  -c backendImageTag="$BACKEND_IMAGE_TAG"

echo ""
echo "✅ Synthesis complete. Template saved to cdk.out/"


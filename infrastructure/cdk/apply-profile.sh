#!/usr/bin/env bash
# Usage: ./apply-profile.sh <profile-name>
# Example: ./apply-profile.sh prod-launch
# Example: ./apply-profile.sh prod-ha
#
# Merges profile values into cdk.json context.
# Run before `cdk deploy` to switch configurations.

set -euo pipefail
PROFILE_NAME="${1:?Usage: $0 <dev|staging|prod-launch|prod-lean|prod-ha>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROFILE_FILE="$SCRIPT_DIR/profiles/${PROFILE_NAME}.json"
CDK_JSON="$SCRIPT_DIR/cdk.json"

if [[ ! -f "$PROFILE_FILE" ]]; then
  echo "Profile not found: $PROFILE_FILE"
  echo "Available: $(ls "$SCRIPT_DIR/profiles/" | sed 's/.json//' | tr '\n' ' ')"
  exit 1
fi

echo "Applying profile: $PROFILE_NAME"
echo "Profile: $(jq -r '._description // "No description"' "$PROFILE_FILE")"

# Merge profile into cdk.json context (profile values override existing)
jq --slurpfile profile "$PROFILE_FILE" '
  .context = (.context // {}) * ($profile[0] | del(._profile, ._description))
' "$CDK_JSON" > "${CDK_JSON}.tmp" && mv "${CDK_JSON}.tmp" "$CDK_JSON"

echo "Updated $CDK_JSON context with $PROFILE_NAME profile"
echo ""
echo "Next steps:"
echo "  cd $SCRIPT_DIR && npx cdk diff    # Preview changes"
echo "  cd $SCRIPT_DIR && npx cdk deploy  # Apply changes"

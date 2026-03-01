#!/usr/bin/env bash
# ralph-claude-adapter.sh — Drop-in adapter that translates Codex exec interface to Claude CLI
#
# Instead of modifying ralph-loop.sh directly, this script wraps the Claude CLI
# so it can be used as RALPH_BACKEND=claude with the existing loop infrastructure.
#
# Usage (called by ralph-loop.sh when RALPH_BACKEND=claude):
#   cat prompt.txt | ralph-claude-adapter.sh --output-last-message /path/to/file [OPTIONS]
#
# Translates:
#   codex exec --cd DIR --sandbox SANDBOX --json --output-last-message FILE --model MODEL
# To:
#   claude --print --model MODEL --permission-mode MODE --output-format text
#
# The adapter:
#   1. Reads prompt from stdin
#   2. Invokes claude --print with the prompt
#   3. Captures the full response to stdout (for logging pipeline)
#   4. Writes the final response to --output-last-message file

set -euo pipefail

# Parse arguments (mimic codex exec interface, extract what we need)
OUTPUT_LAST_MESSAGE=""
MODEL="${RALPH_CLAUDE_MODEL:-claude-opus-4-6}"
PERMISSION_MODE="${RALPH_CLAUDE_PERMISSION_MODE:-acceptEdits}"
WORKING_DIR=""
MAX_BUDGET="${RALPH_CLAUDE_MAX_BUDGET_USD:-5.00}"
ALLOWED_TOOLS="${RALPH_CLAUDE_ALLOWED_TOOLS:-}"
SYSTEM_PROMPT_APPEND="${RALPH_CLAUDE_SYSTEM_PROMPT_APPEND:-}"

while [[ $# -gt 0 ]]; do
  case $1 in
    --output-last-message)
      OUTPUT_LAST_MESSAGE="$2"
      shift 2
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --cd)
      WORKING_DIR="$2"
      shift 2
      ;;
    --sandbox)
      # Map Codex sandbox to Claude permission mode
      case "${2:-}" in
        danger-full-access)
          PERMISSION_MODE="bypassPermissions"
          ;;
        *)
          PERMISSION_MODE="acceptEdits"
          ;;
      esac
      shift 2
      ;;
    --json)
      # Codex --json flag — we use text output for Claude
      shift
      ;;
    -c)
      # Codex config flags (e.g., -c 'mcp_servers={}') — skip
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

if [[ -z "${OUTPUT_LAST_MESSAGE}" ]]; then
  echo "ERROR: --output-last-message is required" >&2
  exit 1
fi

# Read prompt from stdin
PROMPT_CONTENT="$(cat)"

if [[ -z "${PROMPT_CONTENT}" ]]; then
  echo "ERROR: No prompt provided on stdin" >&2
  exit 1
fi

# Build claude command
declare -a claude_cmd=(
  claude
  --print
  --model "${MODEL}"
  --permission-mode "${PERMISSION_MODE}"
  --output-format text
  --max-budget-usd "${MAX_BUDGET}"
)

if [[ -n "${ALLOWED_TOOLS}" ]]; then
  claude_cmd+=(--allowedTools "${ALLOWED_TOOLS}")
fi

if [[ -n "${SYSTEM_PROMPT_APPEND}" ]]; then
  claude_cmd+=(--append-system-prompt "${SYSTEM_PROMPT_APPEND}")
fi

# Change to working directory if specified
if [[ -n "${WORKING_DIR}" ]]; then
  cd "${WORKING_DIR}"
fi

# Create a temp file for capturing the full response
TEMP_RESPONSE="$(mktemp)"
trap 'rm -f "${TEMP_RESPONSE}"' EXIT

# Run claude, capture response, tee to stdout for logging pipeline
echo "${PROMPT_CONTENT}" | "${claude_cmd[@]}" 2>&1 | tee "${TEMP_RESPONSE}"
CLAUDE_EXIT=${PIPESTATUS[1]}

# Write the response to output-last-message file (equivalent to codex --output-last-message)
if [[ -s "${TEMP_RESPONSE}" ]]; then
  cp "${TEMP_RESPONSE}" "${OUTPUT_LAST_MESSAGE}"
fi

exit "${CLAUDE_EXIT}"

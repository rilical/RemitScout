#!/usr/bin/env bash
# Ralph Audit & Fix Loop (OpenAI Codex) - autonomous audit then implement fixes.
# Usage:
#   ./.codex/ralph-audit/ralph.sh [max_iterations] [--search|--no-search] [--skip-security-check]

set -euo pipefail

export CODEX_INTERNAL_ORIGINATOR_OVERRIDE="${CODEX_INTERNAL_ORIGINATOR_OVERRIDE:-Codex Desktop}"

MAX_ITERATIONS=20
MAX_ATTEMPTS_PER_STORY="${MAX_ATTEMPTS_PER_STORY:-5}"
SKIP_SECURITY="${SKIP_SECURITY_CHECK:-false}"
ENABLE_SEARCH="true"
TAIL_N="${TAIL_N:-200}"

# Model defaults tuned for current Codex CLI account compatibility.
REQUESTED_MODEL="${RALPH_AUDIT_MODEL:-gpt-5.3-codex}"
FALLBACK_MODEL="${RALPH_AUDIT_FALLBACK_MODEL:-gpt-5.3-codex}"
REASONING_EFFORT="${RALPH_AUDIT_REASONING_EFFORT:-high}"
DISABLE_MCP="${RALPH_AUDIT_DISABLE_MCP:-1}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-security-check)
      SKIP_SECURITY="true"
      shift
      ;;
    --search)
      ENABLE_SEARCH="true"
      shift
      ;;
    --no-search)
      ENABLE_SEARCH="false"
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

if [[ ! "$MAX_ITERATIONS" =~ ^[0-9]+$ ]] || [[ "$MAX_ITERATIONS" -lt 1 ]]; then
  echo "ERROR: max_iterations must be >= 1"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
RUN_LOG="$SCRIPT_DIR/run.log"
EVENT_LOG="$SCRIPT_DIR/events.log"
MODEL_CHECK_LOG="$SCRIPT_DIR/.model-check.log"
ATTEMPTS_FILE="$SCRIPT_DIR/.story-attempts.json"
PROMPT_FILE="$SCRIPT_DIR/.prompt.md"
LAST_MESSAGE_FILE="$SCRIPT_DIR/.last-message.md"

mkdir -p "$SCRIPT_DIR/audit" "$SCRIPT_DIR/fix-complete"
touch "$RUN_LOG" "$EVENT_LOG"

require_command() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "ERROR: Missing required command: $cmd"
    exit 1
  fi
}

require_command codex
require_command jq
require_command awk

if [[ ! -f "$PRD_FILE" ]]; then
  echo "ERROR: Missing PRD file: $PRD_FILE"
  exit 1
fi

if [[ ! -f "$SCRIPT_DIR/CODEX.md" ]]; then
  echo "ERROR: Missing instruction file: $SCRIPT_DIR/CODEX.md"
  exit 1
fi

if [[ ! -f "$ATTEMPTS_FILE" ]]; then
  echo "{}" > "$ATTEMPTS_FILE"
fi

ts() {
  date '+%Y-%m-%dT%H:%M:%S%z'
}

log_event() {
  echo "[$(ts)] $*" >> "$EVENT_LOG"
}

security_preflight() {
  if [[ "$SKIP_SECURITY" == "true" ]]; then
    return 0
  fi

  local warnings=()
  [[ -n "${AWS_ACCESS_KEY_ID:-}" ]] && warnings+=("AWS_ACCESS_KEY_ID is set")
  [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]] && warnings+=("AWS_SECRET_ACCESS_KEY is set")
  [[ -n "${DATABASE_URL:-}" ]] && warnings+=("DATABASE_URL is set")
  [[ -n "${OPENAI_API_KEY:-}" ]] && warnings+=("OPENAI_API_KEY is set")

  if [[ ${#warnings[@]} -eq 0 ]]; then
    return 0
  fi

  echo "ERROR: Security preflight failed. Sensitive environment variables detected:"
  for w in "${warnings[@]}"; do
    echo "  - $w"
  done
  echo "Unset sensitive env vars or run with --skip-security-check if you accept the risk."
  exit 1
}

get_current_story() {
  jq -r '
    [.userStories[] | select((.passes // false) == false)]
    | sort_by(.priority // 9999)
    | .[0].id // empty
  ' "$PRD_FILE" 2>/dev/null
}

get_story_title() {
  local story_id="$1"
  jq -r --arg id "$story_id" '.userStories[] | select(.id == $id) | .title // ""' "$PRD_FILE"
}

get_story_description() {
  local story_id="$1"
  jq -r --arg id "$story_id" '.userStories[] | select(.id == $id) | .description // ""' "$PRD_FILE"
}

get_story_notes() {
  local story_id="$1"
  jq -r --arg id "$story_id" '.userStories[] | select(.id == $id) | .notes // ""' "$PRD_FILE"
}

get_story_acceptance() {
  local story_id="$1"
  jq -r --arg id "$story_id" '.userStories[] | select(.id == $id) | .acceptanceCriteria[]?' "$PRD_FILE"
}

get_story_output_relpath() {
  local story_id="$1"
  jq -r --arg id "$story_id" '
    .userStories[]
    | select(.id == $id)
    | .acceptanceCriteria[]?
    | select(startswith("Created "))
    | split(" ")[1]
  ' "$PRD_FILE" | head -n 1
}

get_story_attempts() {
  local story_id="$1"
  jq -r --arg id "$story_id" '.[$id] // 0' "$ATTEMPTS_FILE"
}

increment_story_attempts() {
  local story_id="$1"
  local current
  current="$(get_story_attempts "$story_id")"
  local new_count=$((current + 1))
  jq --arg id "$story_id" --argjson count "$new_count" '.[$id] = $count' "$ATTEMPTS_FILE" > "$ATTEMPTS_FILE.tmp"
  mv "$ATTEMPTS_FILE.tmp" "$ATTEMPTS_FILE"
  echo "$new_count"
}

mark_story_passed() {
  local story_id="$1"
  jq --arg id "$story_id" '
    .userStories = [
      .userStories[]
      | if .id == $id then (.passes = true) else . end
    ]
  ' "$PRD_FILE" > "$PRD_FILE.tmp"
  mv "$PRD_FILE.tmp" "$PRD_FILE"
}

mark_story_skipped() {
  local story_id="$1"
  local max_attempts="$2"
  local note="Skipped automatically after ${max_attempts} failed attempts"
  jq --arg id "$story_id" --arg note "$note" '
    .userStories = [
      .userStories[]
      | if .id == $id then
          (.passes = true) | (.skipped = true) | (.notes = ((.notes // "") + "\n" + $note))
        else
          .
        end
    ]
  ' "$PRD_FILE" > "$PRD_FILE.tmp"
  mv "$PRD_FILE.tmp" "$PRD_FILE"
}

mark_progress_checked() {
  local story_id="$1"
  [[ -f "$PROGRESS_FILE" ]] || return 0

  awk -v id="$story_id" '
    {
      if ($0 ~ "^- \\[ \\] " id ":") {
        sub(/^- \[ \]/, "- [x]", $0)
      }
      print
    }
  ' "$PROGRESS_FILE" > "$PROGRESS_FILE.tmp"
  mv "$PROGRESS_FILE.tmp" "$PROGRESS_FILE"
}

remaining_story_count() {
  jq -r '[.userStories[] | select((.passes // false) == false)] | length' "$PRD_FILE"
}

get_audit_file_for_fix() {
  local out_rel="$1"
  case "$out_rel" in
    .codex/ralph-audit/fix-complete/*.done)
      local base
      base="$(basename "$out_rel" .done)"
      echo ".codex/ralph-audit/audit/${base}.md"
      ;;
    *) echo "" ;;
  esac
}

is_fix_story() {
  [[ "$1" == FIX-RS-* ]]
}

audit_file_is_stub() {
  local audit_path="$1"
  [[ ! -f "$audit_path" ]] && return 0
  local content size
  content="$(cat "$audit_path" 2>/dev/null)"
  size="${#content}"
  [[ "$size" -lt 200 ]] && return 0
  [[ "$content" != *"**File:**"* && "$content" != *"**Lines:**"* ]] && return 0
  return 1
}

fix_story_valid_pass() {
  local out_file="$1"
  local done_content
  done_content="$(cat "$out_file" 2>/dev/null)"
  if [[ "$done_content" == *"Deferred:"* ]]; then
    return 0
  fi
  if [[ "$done_content" == *"Completed:"* || "$done_content" == *"Fixed:"* || "$done_content" == *"Implemented:"* ]]; then
    local changed
    changed="$(cd "$REPO_ROOT" && git status --porcelain 2>/dev/null | awk '{print $2}' | grep -E '^(backend|frontend|infrastructure)/' | grep -v '\.codex/' || true)"
    if [[ -n "$changed" ]]; then
      return 0
    fi
  fi
  return 1
}

build_prompt() {
  local story_id="$1"
  local story_title="$2"
  local story_desc="$3"
  local story_notes="$4"
  local out_rel="$5"

  {
    printf '# Ralph Audit & Fix Loop (Remit-Scout)\n\n'
    printf 'Today: %s\n\n' "$(date +%Y-%m-%d)"
    printf 'Story: %s — %s\n' "$story_id" "$story_title"
    printf 'Target output file (relative to repo root): %s\n\n' "$out_rel"

    if is_fix_story "$story_id"; then
      local audit_file
      audit_file="$(get_audit_file_for_fix "$out_rel")"
      local audit_path="$REPO_ROOT/$audit_file"
      if audit_file_is_stub "$audit_path"; then
        printf 'Mode: FIX (stub audit - skip)\n\n'
        printf 'The audit file %s is a stub with no actionable findings.\n\n' "$audit_file"
        printf 'Output EXACTLY this line (nothing else):\n'
        printf 'Deferred: audit file was stub\n\n'
      else
        printf 'Mode: FIX (implement fixes from audit)\n\n'
        printf 'Audit file to implement: %s\n\n' "$audit_file"
        if [[ -n "$audit_file" && -f "$audit_path" ]]; then
          printf '## Audit Findings (implement these fixes)\n\n'
          printf '```\n'
          cat "$audit_path"
          printf '\n```\n\n'
        fi
        printf 'Hard requirements:\n'
        printf -- '- Implement each finding. Edit source files directly. Do NOT output interim status.\n'
        printf -- '- Fix CRITICAL first, then HIGH, then MEDIUM.\n'
        printf -- '- Your FINAL output must be a completion summary saved to %s.\n' "$out_rel"
        printf -- '- Valid final output: "Completed: [N] findings fixed" or "Deferred: [reason]".\n'
        printf -- '- Run typecheck/lint after edits. Fix any new errors.\n\n'
      fi
    else
      printf 'Mode: AUDIT (document findings only)\n\n'
      printf 'Hard requirements:\n'
      printf -- '- Read-only audit only. Do not modify any files.\n'
      printf -- '- Final response must be ONLY the markdown content for the target output file.\n'
      printf -- '- No extra explanation outside the report.\n\n'
    fi

    printf 'Acceptance criteria:\n'
    while IFS= read -r line; do
      printf -- '- %s\n' "$line"
    done < <(get_story_acceptance "$story_id")
    printf '\n'

    printf 'Story description:\n%s\n\n' "$story_desc"
    printf 'Story notes:\n%s\n\n' "$story_notes"
    printf -- '---\n\n'
    cat "$SCRIPT_DIR/CODEX.md"
  } > "$PROMPT_FILE"
}

run_codex_once() {
  local model="$1"
  local preflight_only="$2"

  local -a cmd=(codex -a never)
  if [[ "$ENABLE_SEARCH" == "true" && "$preflight_only" != "true" ]]; then
    cmd+=(--search)
  fi
  cmd+=(exec -C "$REPO_ROOT" -m "$model" -c "model_reasoning_effort=\"$REASONING_EFFORT\"")
  if [[ "$DISABLE_MCP" == "1" ]]; then
    cmd+=(-c 'mcp_servers={}')
  fi

  if [[ "$preflight_only" == "true" ]]; then
    "${cmd[@]}" "Respond with exactly: OK"
  else
    "${cmd[@]}" --output-last-message "$LAST_MESSAGE_FILE" < "$PROMPT_FILE"
  fi
}

resolve_model() {
  local model="$REQUESTED_MODEL"
  if run_codex_once "$model" true > "$MODEL_CHECK_LOG" 2>&1; then
    echo "$model"
    return 0
  fi

  if [[ -n "$FALLBACK_MODEL" && "$FALLBACK_MODEL" != "$model" ]]; then
    if run_codex_once "$FALLBACK_MODEL" true >> "$MODEL_CHECK_LOG" 2>&1; then
      echo "$FALLBACK_MODEL"
      return 0
    fi
  fi

  return 1
}

security_preflight

ACTIVE_MODEL=""
if ! ACTIVE_MODEL="$(resolve_model)"; then
  echo "ERROR: Model preflight failed for '$REQUESTED_MODEL' (fallback: '$FALLBACK_MODEL')."
  echo "See: $MODEL_CHECK_LOG"
  echo "Try: RALPH_AUDIT_MODEL=gpt-5.3-codex ./.codex/ralph-audit/ralph.sh 20"
  exit 1
fi

echo "Starting Ralph Audit & Fix (OpenAI Codex)"
echo "  Max iterations: $MAX_ITERATIONS"
echo "  Max attempts/story: $MAX_ATTEMPTS_PER_STORY"
echo "  Model: $ACTIVE_MODEL (reasoning_effort=$REASONING_EFFORT)"
echo "  Search enabled: $ENABLE_SEARCH"
echo "  Logs:"
echo "    - events: $EVENT_LOG"
echo "    - full:   $RUN_LOG"
echo "  Tail:"
echo "    tail -n $TAIL_N -f $EVENT_LOG"
echo "    tail -n $TAIL_N -f $RUN_LOG"

log_event "RUN START max_iterations=$MAX_ITERATIONS max_attempts_per_story=$MAX_ATTEMPTS_PER_STORY model=$ACTIVE_MODEL search=$ENABLE_SEARCH"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Audit Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  log_event "ITERATION START $i/$MAX_ITERATIONS"

  CURRENT_STORY="$(get_current_story)"
  if [[ -z "$CURRENT_STORY" ]]; then
    log_event "RUN COMPLETE all stories passed"
    echo "All audit and fix tasks are complete."
    echo "<promise>COMPLETE</promise>"
    exit 0
  fi

  ATTEMPTS="$(increment_story_attempts "$CURRENT_STORY")"
  if [[ "$ATTEMPTS" -gt "$MAX_ATTEMPTS_PER_STORY" ]]; then
    log_event "STORY SKIP id=$CURRENT_STORY reason=max-attempts attempts=$ATTEMPTS"
    mark_story_skipped "$CURRENT_STORY" "$MAX_ATTEMPTS_PER_STORY"
    mark_progress_checked "$CURRENT_STORY"
    continue
  fi

  STORY_TITLE="$(get_story_title "$CURRENT_STORY")"
  STORY_DESC="$(get_story_description "$CURRENT_STORY")"
  STORY_NOTES="$(get_story_notes "$CURRENT_STORY")"
  OUT_REL="$(get_story_output_relpath "$CURRENT_STORY")"

  if [[ -z "$OUT_REL" || "$OUT_REL" == "null" ]]; then
    log_event "ERROR story=$CURRENT_STORY missing-output-path"
    echo "ERROR: Could not determine output path from acceptanceCriteria for $CURRENT_STORY"
    exit 1
  fi

  case "$OUT_REL" in
    .codex/ralph-audit/audit/*|.codex/ralph-audit/fix-complete/*) ;;
    *)
      log_event "ERROR story=$CURRENT_STORY invalid-output-path=$OUT_REL"
      echo "ERROR: Refusing to write outside .codex/ralph-audit/: $OUT_REL"
      exit 1
      ;;
  esac

  OUT_FILE="$REPO_ROOT/$OUT_REL"
  mkdir -p "$(dirname "$OUT_FILE")"

  log_event "STORY START id=$CURRENT_STORY attempt=$ATTEMPTS out=$OUT_REL"

  build_prompt "$CURRENT_STORY" "$STORY_TITLE" "$STORY_DESC" "$STORY_NOTES" "$OUT_REL"

  : > "$LAST_MESSAGE_FILE"
  if ! run_codex_once "$ACTIVE_MODEL" false 2>&1 | tee -a "$RUN_LOG"; then
    log_event "ERROR story=$CURRENT_STORY codex-exec-failed"
    echo "Iteration $i: Codex execution failed for $CURRENT_STORY"
    sleep 2
    continue
  fi

  if [[ ! -s "$LAST_MESSAGE_FILE" ]]; then
    log_event "ERROR story=$CURRENT_STORY empty-last-message"
    echo "Iteration $i: Empty Codex output for $CURRENT_STORY"
    sleep 2
    continue
  fi

  cat "$LAST_MESSAGE_FILE" > "$OUT_FILE"

  if is_fix_story "$CURRENT_STORY"; then
    if ! fix_story_valid_pass "$OUT_FILE"; then
      log_event "FIX_REJECT id=$CURRENT_STORY reason=no-valid-completion"
      echo "Iteration $i: FIX story $CURRENT_STORY rejected (no Deferred/Completed or no code changes)"
      echo "  Output must contain 'Deferred:' or 'Completed:'/Fixed/Implemented with git changes."
      sleep 2
      continue
    fi
  fi

  mark_story_passed "$CURRENT_STORY"
  mark_progress_checked "$CURRENT_STORY"

  BYTES="$(wc -c < "$OUT_FILE" | tr -d ' ')"
  log_event "STORY COMPLETE id=$CURRENT_STORY out=$OUT_REL bytes=$BYTES"

  REMAINING="$(remaining_story_count)"
  if [[ "$REMAINING" == "0" ]]; then
    log_event "RUN COMPLETE all stories passed"
    echo "All audit and fix tasks are marked passes:true."
    echo "<promise>COMPLETE</promise>"
    exit 0
  fi

  echo "Iteration $i complete. Remaining stories: $REMAINING"
  sleep 2
done

log_event "RUN STOPPED reached-max-iterations=$MAX_ITERATIONS"
echo "Reached max iterations ($MAX_ITERATIONS) before all stories passed."
exit 1

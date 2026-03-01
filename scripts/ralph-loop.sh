#!/usr/bin/env bash
set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly PLAN_SCRIPT="${RALPH_PLAN_SCRIPT:-${ROOT_DIR}/scripts/ralph/plan.mjs}"
readonly PLAN_PATH="${RALPH_PLAN_FILE:-${ROOT_DIR}/IMPLEMENTATION_PLAN.md}"
readonly PROGRESS_PATH="${RALPH_PROGRESS_FILE:-${ROOT_DIR}/progress.txt}"
readonly LOG_DIR="${RALPH_LOG_DIR:-${ROOT_DIR}/.ralph/loop}"
readonly LOG_RETENTION_DAYS="${RALPH_LOG_RETENTION_DAYS:-14}"
readonly LOG_REDACTION_ENABLED="${RALPH_LOG_REDACTION_ENABLED:-1}"
readonly PROMISE_VALIDATION_HARD_FAIL="${RALPH_PROMISE_VALIDATION_HARD_FAIL:-1}"
readonly MAX_ITERATIONS="${RALPH_MAX_ITERATIONS:-100}"
readonly LOOP_SLEEP_SECONDS="${RALPH_LOOP_SLEEP_SECONDS:-0}"
readonly LOOP_BACKOFF_ON_BLOCKED="${RALPH_LOOP_BACKOFF_ON_BLOCKED:-1}"
readonly LOOP_BACKOFF_INITIAL_SECONDS="${RALPH_LOOP_BACKOFF_INITIAL_SECONDS:-2}"
readonly LOOP_BACKOFF_MAX_SECONDS="${RALPH_LOOP_BACKOFF_MAX_SECONDS:-30}"
readonly LOOP_BACKOFF_MULTIPLIER="${RALPH_LOOP_BACKOFF_MULTIPLIER:-2}"
readonly RALPH_BACKEND="${RALPH_BACKEND:-codex}"
readonly CODEX_TIMEOUT_SECONDS="${RALPH_CODEX_TIMEOUT_SECONDS:-1800}"
readonly CODEX_SANDBOX="${CODEX_SANDBOX:-danger-full-access}"
readonly CODEX_MODEL="${RALPH_CODEX_MODEL:-gpt-5.3-codex}"
readonly CODEX_FALLBACK_MODEL="${RALPH_CODEX_FALLBACK_MODEL:-gpt-5.3-codex}"
readonly CODEX_ALLOW_MODEL_FALLBACK="${RALPH_CODEX_ALLOW_MODEL_FALLBACK:-1}"
readonly CODEX_DISABLE_MCP="${RALPH_CODEX_DISABLE_MCP:-1}"
readonly CLAUDE_ADAPTER="${ROOT_DIR}/scripts/ralph-claude-adapter.sh"
readonly CODEX_TRANSIENT_RETRIES="${RALPH_CODEX_TRANSIENT_RETRIES:-1}"
readonly CODEX_RETRY_BACKOFF_SECONDS="${RALPH_CODEX_RETRY_BACKOFF_SECONDS:-2}"
readonly GATE_CMD="${RALPH_GATE_CMD:-}"
readonly GATE_SCRIPT="${RALPH_GATE_SCRIPT:-}"
readonly AUTO_COMMIT="${RALPH_AUTO_COMMIT:-0}"
readonly COMMIT_PREFIX="${RALPH_COMMIT_PREFIX:-ralph}"
readonly LOCK_DIR="${RALPH_LOCK_DIR:-${ROOT_DIR}/.ralph/lock/iteration.lock}"
readonly RUN_START_HOOK_CMD="${RALPH_RUN_START_HOOK:-}"
readonly RUN_STOP_HOOK_CMD="${RALPH_RUN_STOP_HOOK:-}"
readonly STOP_FILE="${RALPH_STOP_FILE:-${ROOT_DIR}/.ralph/stop}"
readonly STALE_LOCK_MAX_AGE_SECONDS="${RALPH_STALE_LOCK_MAX_AGE_SECONDS:-7200}"

ACTIVE_TASK_ID=""
ACTIVE_TASK_ITERATION=""
ACTIVE_EXIT_SIGNAL=""
LOCK_HELD="0"
LAST_TASK_OUTCOME=""
NEXT_TASK_BACKOFF_SECONDS="0"
CODEX_LAST_FAILURE_CLASSIFICATION=""
CODEX_LAST_FAILURE_ATTEMPTS="0"
CODEX_LAST_FAILURE_RETRIES_USED="0"
CODEX_LAST_FAILURE_EXIT_CODE="0"
RUN_MODE=""
RUN_STARTED_AT_UTC=""
RUN_STARTED_AT_EPOCH=""
RUN_LAST_ITERATION="0"
RUN_COMPLETED_ITERATIONS="0"
RUN_START_EVENT_EMITTED="0"
RUN_STOP_EVENT_EMITTED="0"
RUN_TRACEABILITY_TOTAL_TASKS="0"
RUN_TRACEABILITY_TASKS_WITH_TAG="0"
RUN_TRACEABILITY_DISTINCT_TAGS="0"
RUN_TRACEABILITY_MISSING_TAGS="0"
RUN_TRACEABILITY_MISSING_BOUNDED_EVIDENCE="0"
RUN_TRACEABILITY_MISSING_ROLLBACK_EVIDENCE="0"
CURRENT_TASK_FEEDBACK_SOURCE=""
CURRENT_TASK_ONE_LINE_GOAL=""
CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE=""
CURRENT_TASK_CONFIRMED_USER_GOAL=""
PROMISE_VALIDATION_ERROR=""

print_usage() {
  cat <<'USAGE'
Usage:
  ./scripts/ralph-loop.sh plan
  ./scripts/ralph-loop.sh [run]

Actions:
  plan  Refresh SPECS and regenerate IMPLEMENTATION_PLAN.md from prd.json/progress.
  run   (default) Run continuous iterations until todo tasks complete.
USAGE
}

log() {
  local level="$1"
  local message="$2"
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [${level}] ${message}"
}

collect_traceability_visibility_metrics() {
  RUN_TRACEABILITY_TOTAL_TASKS="0"
  RUN_TRACEABILITY_TASKS_WITH_TAG="0"
  RUN_TRACEABILITY_DISTINCT_TAGS="0"
  RUN_TRACEABILITY_MISSING_TAGS="0"
  RUN_TRACEABILITY_MISSING_BOUNDED_EVIDENCE="0"
  RUN_TRACEABILITY_MISSING_ROLLBACK_EVIDENCE="0"

  local metrics=""
  metrics="$(node -e 'const fs = require("node:fs"); const planPath = process.argv[1]; const zero = () => ({ total_tasks: 0, tasks_with_tag: 0, distinct_tags: 0, missing_tags: 0, missing_bounded_evidence: 0, missing_rollback_evidence: 0 }); const parse = () => { if (!fs.existsSync(planPath)) return zero(); const lines = fs.readFileSync(planPath, "utf8").split(/\r?\n/); const counts = zero(); const distinct = new Set(); let headerMap = null; const fallbackTraceabilityIndex = (cellCount) => { if (cellCount >= 10) return 7; if (cellCount === 9) return 6; if (cellCount === 8) return 5; return -1; }; for (const line of lines) { const trimmed = line.trim(); if (!trimmed.startsWith("|")) continue; if (trimmed.includes("---")) continue; const cells = trimmed.slice(1, -1).split("|").map((value) => value.trim().replace(/\\\|/g, "|")); if (!headerMap) { const lower = cells.map((value) => value.toLowerCase()); if (lower.includes("id") && lower.includes("status")) { headerMap = Object.create(null); lower.forEach((value, index) => { if (!(value in headerMap)) headerMap[value] = index; }); } continue; } const idIndex = Number.isInteger(headerMap.id) ? headerMap.id : 0; const id = String(cells[idIndex] || "").trim(); if (!id || id === "__RALPH_NO_TASKS__") continue; counts.total_tasks += 1; const traceabilityIndex = Number.isInteger(headerMap.traceability_tag) ? headerMap.traceability_tag : fallbackTraceabilityIndex(cells.length); const tag = traceabilityIndex >= 0 ? String(cells[traceabilityIndex] || "").trim() : ""; if (!tag) { counts.missing_tags += 1; counts.missing_bounded_evidence += 1; counts.missing_rollback_evidence += 1; continue; } counts.tasks_with_tag += 1; distinct.add(tag); const normalized = tag.toLowerCase(); if (!normalized.includes("bounded_evidence")) counts.missing_bounded_evidence += 1; if (!normalized.includes("rollback_evidence")) counts.missing_rollback_evidence += 1; } counts.distinct_tags = distinct.size; return counts; }; const result = parse(); for (const [key, value] of Object.entries(result)) { process.stdout.write(`${key}=${value}\n`); }' "${PLAN_PATH}" 2>/dev/null || true)"

  if [[ -z "${metrics}" ]]; then
    return 0
  fi

  while IFS='=' read -r key value; do
    case "${key}" in
      total_tasks)
        RUN_TRACEABILITY_TOTAL_TASKS="${value}"
        ;;
      tasks_with_tag)
        RUN_TRACEABILITY_TASKS_WITH_TAG="${value}"
        ;;
      distinct_tags)
        RUN_TRACEABILITY_DISTINCT_TAGS="${value}"
        ;;
      missing_tags)
        RUN_TRACEABILITY_MISSING_TAGS="${value}"
        ;;
      missing_bounded_evidence)
        RUN_TRACEABILITY_MISSING_BOUNDED_EVIDENCE="${value}"
        ;;
      missing_rollback_evidence)
        RUN_TRACEABILITY_MISSING_ROLLBACK_EVIDENCE="${value}"
        ;;
    esac
  done <<< "${metrics}"
}

emit_run_observability_event() {
  local event="$1"
  local exit_code="${2:-0}"
  local hook_cmd=""
  local hook_label=""
  local now_epoch=""
  local runtime_seconds="0"
  local active_task="${ACTIVE_TASK_ID:-none}"
  local active_iteration="${ACTIVE_TASK_ITERATION:-none}"
  local exit_signal="${ACTIVE_EXIT_SIGNAL:-none}"

  collect_traceability_visibility_metrics

  case "${event}" in
    start)
      if [[ "${RUN_START_EVENT_EMITTED}" == "1" ]]; then
        return 0
      fi
      RUN_START_EVENT_EMITTED="1"
      hook_cmd="${RUN_START_HOOK_CMD}"
      hook_label="RALPH_RUN_START_HOOK"
      ;;
    stop)
      if [[ "${RUN_STOP_EVENT_EMITTED}" == "1" ]]; then
        return 0
      fi
      RUN_STOP_EVENT_EMITTED="1"
      hook_cmd="${RUN_STOP_HOOK_CMD}"
      hook_label="RALPH_RUN_STOP_HOOK"
      ;;
    *)
      log "ERROR" "Unknown run observability event: ${event}"
      return 1
      ;;
  esac

  if [[ -n "${RUN_STARTED_AT_EPOCH}" ]]; then
    now_epoch="$(date +%s)"
    if [[ "${now_epoch}" =~ ^[0-9]+$ ]] && [[ "${RUN_STARTED_AT_EPOCH}" =~ ^[0-9]+$ ]]; then
      runtime_seconds=$((now_epoch - RUN_STARTED_AT_EPOCH))
      if [[ "${runtime_seconds}" -lt 0 ]]; then
        runtime_seconds="0"
      fi
    fi
  fi

  log "INFO" "Run observability event=${event} mode=${RUN_MODE:-unknown} exit_code=${exit_code} active_task=${active_task} completed_iterations=${RUN_COMPLETED_ITERATIONS} last_iteration=${RUN_LAST_ITERATION} traceability_total=${RUN_TRACEABILITY_TOTAL_TASKS} traceability_with_tag=${RUN_TRACEABILITY_TASKS_WITH_TAG} traceability_distinct=${RUN_TRACEABILITY_DISTINCT_TAGS} traceability_missing=${RUN_TRACEABILITY_MISSING_TAGS} traceability_missing_bounded=${RUN_TRACEABILITY_MISSING_BOUNDED_EVIDENCE} traceability_missing_rollback=${RUN_TRACEABILITY_MISSING_ROLLBACK_EVIDENCE}"

  if [[ -z "${hook_cmd}" ]]; then
    return 0
  fi

  local hook_status=0
  (
    export RALPH_HOOK_EVENT="${event}"
    export RALPH_HOOK_MODE="${RUN_MODE:-unknown}"
    export RALPH_HOOK_ROOT_DIR="${ROOT_DIR}"
    export RALPH_HOOK_PID="$$"
    export RALPH_HOOK_STARTED_AT_UTC="${RUN_STARTED_AT_UTC}"
    export RALPH_HOOK_RUNTIME_SECONDS="${runtime_seconds}"
    export RALPH_HOOK_EXIT_CODE="${exit_code}"
    export RALPH_HOOK_EXIT_SIGNAL="${exit_signal}"
    export RALPH_HOOK_ACTIVE_TASK_ID="${active_task}"
    export RALPH_HOOK_ACTIVE_TASK_ITERATION="${active_iteration}"
    export RALPH_HOOK_COMPLETED_ITERATIONS="${RUN_COMPLETED_ITERATIONS}"
    export RALPH_HOOK_LAST_ITERATION="${RUN_LAST_ITERATION}"
    export RALPH_HOOK_TRACEABILITY_TOTAL_TASKS="${RUN_TRACEABILITY_TOTAL_TASKS}"
    export RALPH_HOOK_TRACEABILITY_TASKS_WITH_TAG="${RUN_TRACEABILITY_TASKS_WITH_TAG}"
    export RALPH_HOOK_TRACEABILITY_DISTINCT_TAGS="${RUN_TRACEABILITY_DISTINCT_TAGS}"
    export RALPH_HOOK_TRACEABILITY_MISSING_TAGS="${RUN_TRACEABILITY_MISSING_TAGS}"
    export RALPH_HOOK_TRACEABILITY_MISSING_BOUNDED_EVIDENCE="${RUN_TRACEABILITY_MISSING_BOUNDED_EVIDENCE}"
    export RALPH_HOOK_TRACEABILITY_MISSING_ROLLBACK_EVIDENCE="${RUN_TRACEABILITY_MISSING_ROLLBACK_EVIDENCE}"
    cd "${ROOT_DIR}"
    sh -c "${hook_cmd}"
  ) || hook_status=$?

  if [[ "${hook_status}" -ne 0 ]]; then
    log "WARN" "Run observability hook failed (${hook_label}, exit=${hook_status}); continuing."
    return 0
  fi

  log "INFO" "Run observability hook succeeded (${hook_label})."
  return 0
}

mark_run_started() {
  if [[ "${RUN_START_EVENT_EMITTED}" == "1" ]]; then
    return 0
  fi
  RUN_STARTED_AT_UTC="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  RUN_STARTED_AT_EPOCH="$(date +%s)"
  emit_run_observability_event "start" "0"
}

relative_to_root() {
  local target_path="$1"
  if [[ "${target_path}" == "${ROOT_DIR}/"* ]]; then
    printf '.%s' "${target_path#${ROOT_DIR}}"
    return 0
  fi
  printf '%s' "${target_path}"
}

normalize_handoff_value() {
  local value="$1"
  value="${value//$'\r'/ }"
  value="${value//$'\n'/ }"
  printf '%s' "${value}"
}

normalize_task_state_note() {
  local value="$1"
  local max_length=280

  value="${value//$'\r'/ }"
  value="${value//$'\n'/ }"
  value="$(printf '%s' "${value}" | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//')"

  if [[ "${#value}" -gt "${max_length}" ]]; then
    value="${value:0:$((max_length - 3))}..."
  fi

  printf '%s' "${value}"
}

build_task_feedback_source() {
  local plan_ref="$(relative_to_root "${PLAN_PATH}")"
  if [[ -n "${CURRENT_TASK_ID}" ]]; then
    printf 'file path: %s (task_id=%s)' "${plan_ref}" "${CURRENT_TASK_ID}"
    return 0
  fi
  printf 'file path: %s' "${plan_ref}"
}

build_task_one_line_goal() {
  local candidate="$(normalize_task_state_note "${CURRENT_TASK_TITLE}")"
  if [[ -n "${candidate}" ]]; then
    printf '%s' "${candidate}"
    return 0
  fi
  printf 'Complete task %s from IMPLEMENTATION_PLAN.md' "${CURRENT_TASK_ID}"
}

extract_protocol_confirmation() {
  local message_file="$1"
  local separator=$'\x1f'

  CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE=""
  CURRENT_TASK_CONFIRMED_USER_GOAL=""

  if [[ ! -s "${message_file}" ]]; then
    return 1
  fi

  IFS="${separator}" read -r CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE CURRENT_TASK_CONFIRMED_USER_GOAL < <(
    node -e 'const fs = require("node:fs"); const file = process.argv[1]; const sep = "\u001f"; let text = ""; try { text = fs.readFileSync(file, "utf8"); } catch { process.exit(1); } const lines = text.split(/\r?\n/); let inFence = false; let feedbackSource = ""; let userGoal = ""; for (const rawLine of lines) { const trimmed = rawLine.trim(); if (!trimmed) continue; if (/^```/.test(trimmed)) { inFence = !inFence; continue; } if (inFence) continue; const normalized = trimmed.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "").trim(); let match = normalized.match(/^feedback(?:[_ ]+source)?\s*:\s*(.+)$/i); if (match && !feedbackSource) { feedbackSource = String(match[1] || "").trim(); continue; } match = normalized.match(/^user(?:[_ ]+goal)?\s*:\s*(.+)$/i); if (match && !userGoal) { userGoal = String(match[1] || "").trim(); continue; } } if (!feedbackSource || !userGoal) { process.exit(1); } process.stdout.write(`${feedbackSource}${sep}${userGoal}`);' "${message_file}" 2>/dev/null || true
  )

  CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE="$(normalize_task_state_note "${CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE}")"
  CURRENT_TASK_CONFIRMED_USER_GOAL="$(normalize_task_state_note "${CURRENT_TASK_CONFIRMED_USER_GOAL}")"

  [[ -n "${CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE}" && -n "${CURRENT_TASK_CONFIRMED_USER_GOAL}" ]]
}

extract_task_comment() {
  local message_file="$1"

  if [[ ! -s "${message_file}" ]]; then
    return 1
  fi

  local task_comment=""
  task_comment="$(node -e 'const fs = require("node:fs"); const file = process.argv[1]; let text = ""; try { text = fs.readFileSync(file, "utf8"); } catch { process.exit(1); } const lines = text.split(/\r?\n/); let inFence = false; const candidates = []; for (const rawLine of lines) { const trimmed = rawLine.trim(); if (!trimmed) continue; if (/^```/.test(trimmed)) { inFence = !inFence; continue; } if (inFence) continue; if (/^<promise>(DONE|BLOCKED)<\/promise>/i.test(trimmed)) continue; if (/^\*\*[^*]+\*\*:?$/.test(trimmed)) continue; let value = trimmed; value = value.replace(/^[-*]\s+/, ""); value = value.replace(/^\d+[.)]\s+/, ""); value = value.replace(/^#+\s*/, ""); value = value.replace(/^`([^`]+)`$/, "$1"); value = value.replace(/^\*\*(.+)\*\*$/, "$1"); value = value.trim(); if (!value) continue; if (/^<promise>/i.test(value)) continue; candidates.push(value); } if (candidates.length === 0) { process.exit(1); } const preferred = candidates.find((entry) => entry.split(/\s+/).length >= 3) || candidates[0]; process.stdout.write(preferred);' "${message_file}" 2>/dev/null || true)"
  task_comment="$(normalize_task_state_note "${task_comment}")"

  if [[ -z "${task_comment}" ]]; then
    return 1
  fi

  printf '%s' "${task_comment}"
}

default_promise_note() {
  local status="$1"
  if [[ "${status}" == "DONE" ]]; then
    printf 'DONE completed'
    return 0
  fi
  printf 'BLOCKED reported'
}

build_missing_promise_note() {
  local message_file="$1"
  local task_comment=""
  local validation_error=""

  validation_error="$(normalize_task_state_note "${PROMISE_VALIDATION_ERROR}")"
  if [[ -z "${validation_error}" ]]; then
    validation_error="No <promise> token found in codex response"
  fi

  task_comment="$(extract_task_comment "${message_file}" || true)"
  if [[ -z "${task_comment}" ]]; then
    printf '%s' "${validation_error}"
    return 0
  fi

  printf '%s; task comment: %s' "${validation_error}" "${task_comment}"
}

write_iteration_handoff() {
  local iteration="$1"
  local task_status="$2"
  local status_note="$3"
  local iteration_log="$4"
  local last_message="$5"

  local handoff_file="${LOG_DIR}/iteration-${iteration}.handoff.md"
  local generated_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  local relative_handoff_file="$(relative_to_root "${handoff_file}")"
  local relative_iteration_log="$(relative_to_root "${iteration_log}")"
  local relative_last_message="$(relative_to_root "${last_message}")"
  local task_title="$(normalize_handoff_value "${CURRENT_TASK_TITLE}")"
  local parallelizable_tag="$(normalize_handoff_value "${CURRENT_TASK_PARALLELIZABLE_TAG}")"
  local ownership_tag="$(normalize_handoff_value "${CURRENT_TASK_OWNERSHIP_TAG}")"
  local traceability_tag="$(normalize_handoff_value "${CURRENT_TASK_TRACEABILITY_TAG}")"
  local spec_refs="$(normalize_handoff_value "${CURRENT_TASK_SPEC_REFS}")"
  local feedback_source="$(normalize_handoff_value "${CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE:-${CURRENT_TASK_FEEDBACK_SOURCE}}")"
  local user_goal="$(normalize_handoff_value "${CURRENT_TASK_CONFIRMED_USER_GOAL:-${CURRENT_TASK_ONE_LINE_GOAL}}")"
  local normalized_note="$(normalize_handoff_value "${status_note}")"
  local rollback_evidence="none (no rollback executed in this iteration)"

  if [[ "$(printf '%s' "${normalized_note}" | tr '[:upper:]' '[:lower:]')" == *"rollback evidence"* ]]; then
    rollback_evidence="${normalized_note}"
  fi

  cat > "${handoff_file}" <<EOF
# Ralph Iteration Handoff
- generated_at_utc: ${generated_at}
- iteration: ${iteration}
- task_id: ${CURRENT_TASK_ID}
- task_title: ${task_title}
- task_status: ${task_status}
- parallelizable_tag: ${parallelizable_tag}
- ownership_tag: ${ownership_tag}
- traceability_tag: ${traceability_tag}
- spec_refs: ${spec_refs}
- feedback_source: ${feedback_source}
- user_goal: ${user_goal}
- completion_note: ${normalized_note}

## Bounded Evidence
- iteration_log: ${relative_iteration_log}
- last_message: ${relative_last_message}
- inspect_iteration_log: tail -n 120 "${relative_iteration_log}"
- inspect_last_message: tail -n 40 "${relative_last_message}"

## Rollback Evidence
- rollback: ${rollback_evidence}
EOF

  redact_file_in_place "${handoff_file}" || true
  log "INFO" "Iteration ${iteration} handoff: ${relative_handoff_file}"
  log "INFO" "Bounded evidence: ${relative_iteration_log} | ${relative_last_message}"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR" "Missing command: $1"
    return 1
  fi
}

require_non_negative_integer() {
  local value="$1"
  local label="$2"
  if [[ ! "${value}" =~ ^[0-9]+$ ]]; then
    log "ERROR" "${label} must be a non-negative integer, got: ${value}"
    return 1
  fi
  return 0
}

require_positive_integer() {
  local value="$1"
  local label="$2"
  if [[ ! "${value}" =~ ^[1-9][0-9]*$ ]]; then
    log "ERROR" "${label} must be a positive integer, got: ${value}"
    return 1
  fi
  return 0
}

require_binary_flag() {
  local value="$1"
  local label="$2"
  if [[ "${value}" != "0" && "${value}" != "1" ]]; then
    log "ERROR" "${label} must be either 0 or 1, got: ${value}"
    return 1
  fi
  return 0
}

ensure_clean_worktree() {
  if ! git -C "${ROOT_DIR}" diff --quiet || ! git -C "${ROOT_DIR}" diff --cached --quiet || [[ -n "$(git -C "${ROOT_DIR}" ls-files --others --exclude-standard)" ]]; then
    log "ERROR" "RALPH_AUTO_COMMIT=1 requires a clean git worktree (no staged/unstaged/untracked files)."
    return 1
  fi
  return 0
}

lock_metadata_value() {
  local key="$1"
  local metadata_file="${LOCK_DIR}/owner"

  if [[ ! -f "${metadata_file}" ]]; then
    return 0
  fi

  grep -E "^${key}=" "${metadata_file}" | head -n 1 | cut -d'=' -f2-
}

remove_iteration_lock_dir() {
  local metadata_file="${LOCK_DIR}/owner"

  if [[ -f "${metadata_file}" ]]; then
    rm -f "${metadata_file}" || return 1
  fi

  if [[ ! -d "${LOCK_DIR}" ]]; then
    return 0
  fi

  if ! rmdir "${LOCK_DIR}" 2>/dev/null; then
    rm -rf "${LOCK_DIR}" || return 1
  fi

  return 0
}

write_iteration_lock_metadata() {
  local mode="$1"
  local metadata_file="${LOCK_DIR}/owner"

  cat > "${metadata_file}" <<EOF
pid=$$
mode=${mode}
started_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)
root_dir=${ROOT_DIR}
EOF
}

acquire_iteration_lock() {
  local mode="$1"

  if [[ "${LOCK_HELD}" == "1" ]]; then
    return 0
  fi

  if [[ -z "${LOCK_DIR}" || "${LOCK_DIR}" == "/" ]]; then
    log "ERROR" "RALPH_LOCK_DIR must be a safe non-root path."
    return 1
  fi

  mkdir -p "$(dirname "${LOCK_DIR}")"

  if mkdir "${LOCK_DIR}" 2>/dev/null; then
    write_iteration_lock_metadata "${mode}"
    LOCK_HELD="1"
    log "INFO" "Iteration lock acquired: $(relative_to_root "${LOCK_DIR}") (pid=$$, mode=${mode})"
    return 0
  fi

  local owner_pid="$(lock_metadata_value pid)"
  local owner_mode="$(lock_metadata_value mode)"
  local owner_started_at="$(lock_metadata_value started_at_utc)"
  if [[ -n "${owner_pid}" && "${owner_pid}" =~ ^[0-9]+$ ]] && ps -p "${owner_pid}" >/dev/null 2>&1; then
    log "ERROR" "Concurrent runner prevented: lock held at $(relative_to_root "${LOCK_DIR}") by pid ${owner_pid} (mode=${owner_mode:-unknown}, started_at=${owner_started_at:-unknown})"
    return 1
  fi

  # If the lock owner PID is gone, check if it is also age-stale for extra safety
  if ! is_lock_stale_by_age; then
    log "ERROR" "Lock owner pid ${owner_pid:-unknown} is gone but lock age is within threshold; refusing to reclaim. Remove manually: rm -rf $(relative_to_root "${LOCK_DIR}")"
    return 1
  fi

  local stale_note="rollback evidence: reclaimed stale iteration lock at $(relative_to_root "${LOCK_DIR}")"
  if [[ -n "${owner_pid}" ]]; then
    stale_note+=" (previous pid ${owner_pid})"
  fi
  log "WARN" "${stale_note}"

  if ! remove_iteration_lock_dir; then
    log "ERROR" "Failed to clear stale iteration lock at $(relative_to_root "${LOCK_DIR}")."
    return 1
  fi

  if ! mkdir "${LOCK_DIR}" 2>/dev/null; then
    owner_pid="$(lock_metadata_value pid)"
    owner_mode="$(lock_metadata_value mode)"
    owner_started_at="$(lock_metadata_value started_at_utc)"
    log "ERROR" "Concurrent runner prevented after stale lock reclaim attempt: lock held at $(relative_to_root "${LOCK_DIR}") by pid ${owner_pid:-unknown} (mode=${owner_mode:-unknown}, started_at=${owner_started_at:-unknown})"
    return 1
  fi

  write_iteration_lock_metadata "${mode}"
  LOCK_HELD="1"
  log "INFO" "Iteration lock acquired: $(relative_to_root "${LOCK_DIR}") (pid=$$, mode=${mode}, recovered_stale_lock=1)"
  return 0
}

release_iteration_lock() {
  if [[ "${LOCK_HELD}" != "1" ]]; then
    return 0
  fi

  if [[ ! -d "${LOCK_DIR}" ]]; then
    LOCK_HELD="0"
    return 0
  fi

  local owner_pid="$(lock_metadata_value pid)"
  if [[ -n "${owner_pid}" && "${owner_pid}" != "$$" ]]; then
    log "WARN" "Iteration lock owner changed before release; skipping unlock for $(relative_to_root "${LOCK_DIR}") (owner_pid=${owner_pid}, current_pid=$$)"
    LOCK_HELD="0"
    return 0
  fi

  if ! remove_iteration_lock_dir; then
    log "ERROR" "Failed to release iteration lock at $(relative_to_root "${LOCK_DIR}")."
    return 1
  fi

  LOCK_HELD="0"
  log "INFO" "Iteration lock released: $(relative_to_root "${LOCK_DIR}") (pid=$$)"
  return 0
}

check_stop_file() {
  if [[ -f "${STOP_FILE}" ]]; then
    local stop_reason=""
    stop_reason="$(head -n 1 "${STOP_FILE}" 2>/dev/null || true)"
    stop_reason="$(normalize_task_state_note "${stop_reason}")"
    if [[ -z "${stop_reason}" ]]; then
      stop_reason="stop file present"
    fi
    log "INFO" "Stop file detected at $(relative_to_root "${STOP_FILE}"): ${stop_reason}"
    return 0
  fi
  return 1
}

is_lock_stale_by_age() {
  local metadata_file="${LOCK_DIR}/owner"
  if [[ ! -f "${metadata_file}" ]]; then
    return 0
  fi

  local lock_started_at=""
  lock_started_at="$(lock_metadata_value started_at_utc)"
  if [[ -z "${lock_started_at}" ]]; then
    return 0
  fi

  local lock_epoch=""
  lock_epoch="$(date -j -f '%Y-%m-%dT%H:%M:%SZ' "${lock_started_at}" '+%s' 2>/dev/null || date -d "${lock_started_at}" '+%s' 2>/dev/null || true)"
  if [[ -z "${lock_epoch}" || ! "${lock_epoch}" =~ ^[0-9]+$ ]]; then
    return 1
  fi

  local now_epoch=""
  now_epoch="$(date +%s)"
  local age_seconds=$((now_epoch - lock_epoch))

  if [[ "${age_seconds}" -gt "${STALE_LOCK_MAX_AGE_SECONDS}" ]]; then
    log "WARN" "Lock age ${age_seconds}s exceeds max stale threshold ${STALE_LOCK_MAX_AGE_SECONDS}s; treating as stale."
    return 0
  fi

  return 1
}

run_plan() {
  node "$PLAN_SCRIPT" sync
  node "$PLAN_SCRIPT" reconcile-progress "plan refresh"
  node "$PLAN_SCRIPT" build
  recover_stale_in_progress_tasks "plan refresh"
}

clear_active_task() {
  ACTIVE_TASK_ID=""
  ACTIVE_TASK_ITERATION=""
  CURRENT_TASK_FEEDBACK_SOURCE=""
  CURRENT_TASK_ONE_LINE_GOAL=""
  CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE=""
  CURRENT_TASK_CONFIRMED_USER_GOAL=""
}

sleep_between_tasks() {
  local outcome="$1"
  local total_sleep_seconds="${LOOP_SLEEP_SECONDS}"

  if [[ "${LOOP_BACKOFF_ON_BLOCKED}" == "1" && "${LOOP_BACKOFF_INITIAL_SECONDS}" -gt 0 ]]; then
    if [[ "${outcome}" == "blocked" ]]; then
      if [[ "${NEXT_TASK_BACKOFF_SECONDS}" -eq 0 ]]; then
        NEXT_TASK_BACKOFF_SECONDS="${LOOP_BACKOFF_INITIAL_SECONDS}"
      else
        NEXT_TASK_BACKOFF_SECONDS=$((NEXT_TASK_BACKOFF_SECONDS * LOOP_BACKOFF_MULTIPLIER))
      fi

      if [[ "${NEXT_TASK_BACKOFF_SECONDS}" -gt "${LOOP_BACKOFF_MAX_SECONDS}" ]]; then
        NEXT_TASK_BACKOFF_SECONDS="${LOOP_BACKOFF_MAX_SECONDS}"
      fi
    else
      NEXT_TASK_BACKOFF_SECONDS="0"
    fi
  else
    NEXT_TASK_BACKOFF_SECONDS="0"
  fi

  total_sleep_seconds=$((total_sleep_seconds + NEXT_TASK_BACKOFF_SECONDS))
  if [[ "${total_sleep_seconds}" -le 0 ]]; then
    return 0
  fi

  log "INFO" "Throttling ${total_sleep_seconds}s before next task (outcome=${outcome}, base=${LOOP_SLEEP_SECONDS}s, backoff=${NEXT_TASK_BACKOFF_SECONDS}s)."
  sleep "${total_sleep_seconds}"
}

rollback_active_task() {
  local exit_code="$1"

  if [[ -z "${ACTIVE_TASK_ID}" ]]; then
    return 0
  fi

  local exit_context="exit ${exit_code}"
  if [[ -n "${ACTIVE_EXIT_SIGNAL}" ]]; then
    exit_context="signal ${ACTIVE_EXIT_SIGNAL} (exit ${exit_code})"
  fi

  local rollback_note="rollback evidence: recovered stale in_progress after unexpected loop exit (iteration ${ACTIVE_TASK_ITERATION:-unknown}, ${exit_context})"
  log "WARN" "Loop exited unexpectedly; reverting ${ACTIVE_TASK_ID} from in_progress to todo."

  set +e
  set_task_state "${ACTIVE_TASK_ID}" "todo" "${rollback_note}"
  local rollback_status=$?
  set -e

  if [[ "${rollback_status}" -ne 0 ]]; then
    log "ERROR" "Failed to revert stale in_progress task ${ACTIVE_TASK_ID}; manual recovery required."
    return 1
  fi

  clear_active_task
  return 0
}

on_exit() {
  local exit_code="$1"
  log "INFO" "Exit handler invoked: exit_code=${exit_code} signal=${ACTIVE_EXIT_SIGNAL:-none} pid=$$ active_task=${ACTIVE_TASK_ID:-none} iteration=${ACTIVE_TASK_ITERATION:-none} completed=${RUN_COMPLETED_ITERATIONS}"
  rollback_active_task "${exit_code}" || true
  if [[ "${RUN_START_EVENT_EMITTED}" == "1" ]]; then
    emit_run_observability_event "stop" "${exit_code}" || true
  fi
  release_iteration_lock || true
  # Write crash breadcrumb for post-mortem debugging
  if [[ "${exit_code}" -ne 0 && -n "${LOG_DIR}" ]]; then
    mkdir -p "${LOG_DIR}" 2>/dev/null || true
    local crash_file="${LOG_DIR}/last-crash.txt"
    {
      echo "timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
      echo "exit_code=${exit_code}"
      echo "signal=${ACTIVE_EXIT_SIGNAL:-none}"
      echo "pid=$$"
      echo "active_task=${ACTIVE_TASK_ID:-none}"
      echo "iteration=${ACTIVE_TASK_ITERATION:-none}"
      echo "completed_iterations=${RUN_COMPLETED_ITERATIONS}"
      echo "mode=${RUN_MODE:-unknown}"
    } > "${crash_file}" 2>/dev/null || true
  fi
}

on_signal() {
  local signal="$1"
  ACTIVE_EXIT_SIGNAL="${signal}"
  log "WARN" "Caught signal ${signal} (pid=$$, active_task=${ACTIVE_TASK_ID:-none}, iteration=${ACTIVE_TASK_ITERATION:-none})"
  case "${signal}" in
    INT)
      exit 130
      ;;
    TERM)
      exit 143
      ;;
    HUP)
      exit 129
      ;;
    *)
      exit 1
      ;;
  esac
}

list_in_progress_tasks() {
  node -e 'const fs = require("node:fs"); const planPath = process.argv[1]; if (!fs.existsSync(planPath)) { process.exit(0); } const lines = fs.readFileSync(planPath, "utf8").split(/\r?\n/); for (const line of lines) { const trimmed = line.trim(); if (!trimmed.startsWith("|")) continue; if (trimmed.includes("---") || trimmed.toLowerCase().includes("id | title")) continue; const cells = trimmed.slice(1, -1).split("|").map((value) => value.trim()); if (cells.length < 3) continue; const id = cells[0]; const status = (cells[2] || "").toLowerCase(); if (id && id !== "__RALPH_NO_TASKS__" && status === "in_progress") { process.stdout.write(`${id}\n`); } }' "${PLAN_PATH}"
}

count_todo_tasks() {
  node -e 'const fs = require("node:fs"); const planPath = process.argv[1]; if (!fs.existsSync(planPath)) { process.stdout.write("0"); process.exit(0); } const lines = fs.readFileSync(planPath, "utf8").split(/\r?\n/); let count = 0; for (const line of lines) { const trimmed = line.trim(); if (!trimmed.startsWith("|")) continue; if (trimmed.includes("---") || trimmed.toLowerCase().includes("id | title")) continue; const cells = trimmed.slice(1, -1).split("|").map((value) => value.trim()); if (cells.length < 3) continue; const id = cells[0]; const status = (cells[2] || "").toLowerCase(); if (id && id !== "__RALPH_NO_TASKS__" && status === "todo") { count += 1; } } process.stdout.write(String(count));' "${PLAN_PATH}"
}

redact_stream() {
  if [[ "${LOG_REDACTION_ENABLED}" != "1" ]]; then
    cat
    return 0
  fi

  sed -E \
    -e 's#([Aa]uthorization:[[:space:]]*[Bb]earer[[:space:]]+)[^[:space:]]+#\1[REDACTED]#g' \
    -e 's#([Xx]-[Aa][Pp][Ii]-[Kk]ey:[[:space:]]*)[^[:space:]]+#\1[REDACTED]#g' \
    -e 's#([?&](token|api_key|apikey|access_token|client_secret)=)[^&[:space:]]+#\1[REDACTED]#g' \
    -e 's#("?(api[_-]?key|access[_-]?token|client[_-]?secret|password|secret)"?[[:space:]]*[:=][[:space:]]*"?)[^",[:space:]]+#\1[REDACTED]#g' \
    -e 's#AKIA[0-9A-Z]{16}#AKIA[REDACTED]#g' \
    -e 's#ASIA[0-9A-Z]{16}#ASIA[REDACTED]#g' \
    -e 's#gh[pousr]_[A-Za-z0-9]{20,}#gh_[REDACTED]#g' \
    -e 's#sk-[A-Za-z0-9]{20,}#sk-[REDACTED]#g'
}

redact_file_in_place() {
  local file_path="$1"
  local tmp_file=""

  if [[ "${LOG_REDACTION_ENABLED}" != "1" || ! -f "${file_path}" ]]; then
    return 0
  fi

  tmp_file="$(mktemp)"
  if ! redact_stream < "${file_path}" > "${tmp_file}"; then
    rm -f "${tmp_file}"
    return 1
  fi
  mv "${tmp_file}" "${file_path}"
}

prune_log_retention() {
  if [[ "${LOG_RETENTION_DAYS}" == "0" || ! -d "${LOG_DIR}" ]]; then
    return 0
  fi

  local removed_count="0"
  removed_count="$(node -e 'const fs = require("node:fs"); const path = require("node:path"); const logDir = process.argv[1]; const retentionDays = Number(process.argv[2]); if (!fs.existsSync(logDir) || !Number.isFinite(retentionDays) || retentionDays <= 0) { process.stdout.write("0"); process.exit(0); } const now = Date.now(); const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000; const iterationPattern = /^iteration-\d+\.(log|last-message\.txt|handoff\.md)$/; let removed = 0; for (const entry of fs.readdirSync(logDir)) { if (!iterationPattern.test(entry)) continue; const filePath = path.join(logDir, entry); let stats; try { stats = fs.statSync(filePath); } catch { continue; } if (!stats.isFile()) continue; if (now - stats.mtimeMs > maxAgeMs) { try { fs.unlinkSync(filePath); removed += 1; } catch {} } } process.stdout.write(String(removed));' "${LOG_DIR}" "${LOG_RETENTION_DAYS}")"

  if [[ "${removed_count}" != "0" ]]; then
    log "INFO" "Pruned ${removed_count} stale loop log file(s) older than ${LOG_RETENTION_DAYS} day(s)."
  fi
}

run_codex_with_log() {
  local prompt_file="$1"
  local log_file="$2"
  local append_mode="$3"
  local timeout_seconds="$4"
  local attempt_log_file="$5"
  shift 5
  local -a codex_args=("$@")
  local -a tee_cmd=(tee "${log_file}")
  local -a attempt_capture_cmd=()

  if [[ "${append_mode}" == "1" ]]; then
    tee_cmd=(tee -a "${log_file}")
  fi

  if [[ -n "${attempt_log_file}" ]]; then
    : > "${attempt_log_file}"
    attempt_capture_cmd=(tee "${attempt_log_file}")
  fi

  if (( timeout_seconds > 0 )); then
    if [[ -n "${attempt_log_file}" ]]; then
      cat "${prompt_file}" | node -e 'const { spawn } = require("node:child_process"); const timeoutSeconds = Number(process.argv[1]); const command = process.argv[2]; const args = process.argv.slice(3); if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 0) { process.exit(2); } const detached = process.platform !== "win32"; const child = spawn(command, args, { stdio: "inherit", detached }); const killChild = (signal) => { try { if (detached) { process.kill(-child.pid, signal); } else { child.kill(signal); } } catch {} }; let timedOut = false; let forceKillTimer = null; const timeoutTimer = setTimeout(() => { timedOut = true; killChild("SIGTERM"); forceKillTimer = setTimeout(() => killChild("SIGKILL"), 10000); forceKillTimer.unref(); }, timeoutSeconds * 1000); child.on("error", () => { clearTimeout(timeoutTimer); if (forceKillTimer) clearTimeout(forceKillTimer); process.exit(1); }); child.on("exit", (code, signal) => { clearTimeout(timeoutTimer); if (forceKillTimer) clearTimeout(forceKillTimer); if (timedOut) { process.exit(124); } if (code !== null) { process.exit(code); } if (signal) { process.exit(128); } process.exit(1); });' "${timeout_seconds}" "${codex_args[@]}" 2>&1 | redact_stream | "${attempt_capture_cmd[@]}" | "${tee_cmd[@]}"
    else
      cat "${prompt_file}" | node -e 'const { spawn } = require("node:child_process"); const timeoutSeconds = Number(process.argv[1]); const command = process.argv[2]; const args = process.argv.slice(3); if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 0) { process.exit(2); } const detached = process.platform !== "win32"; const child = spawn(command, args, { stdio: "inherit", detached }); const killChild = (signal) => { try { if (detached) { process.kill(-child.pid, signal); } else { child.kill(signal); } } catch {} }; let timedOut = false; let forceKillTimer = null; const timeoutTimer = setTimeout(() => { timedOut = true; killChild("SIGTERM"); forceKillTimer = setTimeout(() => killChild("SIGKILL"), 10000); forceKillTimer.unref(); }, timeoutSeconds * 1000); child.on("error", () => { clearTimeout(timeoutTimer); if (forceKillTimer) clearTimeout(forceKillTimer); process.exit(1); }); child.on("exit", (code, signal) => { clearTimeout(timeoutTimer); if (forceKillTimer) clearTimeout(forceKillTimer); if (timedOut) { process.exit(124); } if (code !== null) { process.exit(code); } if (signal) { process.exit(128); } process.exit(1); });' "${timeout_seconds}" "${codex_args[@]}" 2>&1 | redact_stream | "${tee_cmd[@]}"
    fi
  else
    if [[ -n "${attempt_log_file}" ]]; then
      cat "${prompt_file}" | "${codex_args[@]}" 2>&1 | redact_stream | "${attempt_capture_cmd[@]}" | "${tee_cmd[@]}"
    else
      cat "${prompt_file}" | "${codex_args[@]}" 2>&1 | redact_stream | "${tee_cmd[@]}"
    fi
  fi

  local -a pipeline_status=("${PIPESTATUS[@]}")
  return "${pipeline_status[1]}"
}

classify_codex_failure() {
  local exit_code="$1"
  local attempt_log_file="$2"

  if [[ "${exit_code}" -eq 124 ]]; then
    printf 'timeout'
    return 0
  fi

  if [[ ! -s "${attempt_log_file}" ]]; then
    printf 'fatal'
    return 0
  fi

  if grep -Eiq 'model is not supported when using Codex with a ChatGPT account|unknown model|unsupported model' "${attempt_log_file}"; then
    printf 'model_unsupported'
    return 0
  fi

  if grep -Eiq 'rate limit|429|too many requests|ECONNRESET|ENOTFOUND|ETIMEDOUT|EAI_AGAIN|socket hang up|network error|connection reset|temporarily unavailable|service unavailable|upstream connect error' "${attempt_log_file}"; then
    printf 'transient'
    return 0
  fi

  if grep -Eiq 'unauthorized|forbidden|authentication failed|invalid api key|permission denied|authentication required' "${attempt_log_file}"; then
    printf 'auth'
    return 0
  fi

  printf 'fatal'
}

run_codex_with_retry_policy() {
  local prompt_file="$1"
  local log_file="$2"
  local append_mode="$3"
  local timeout_seconds="$4"
  shift 4
  local -a codex_args=("$@")

  local retries_remaining="${CODEX_TRANSIENT_RETRIES}"
  local attempt=1
  local attempt_log_file=""

  CODEX_LAST_FAILURE_CLASSIFICATION=""
  CODEX_LAST_FAILURE_ATTEMPTS="0"
  CODEX_LAST_FAILURE_RETRIES_USED="0"
  CODEX_LAST_FAILURE_EXIT_CODE="0"

  while true; do
    attempt_log_file="$(mktemp)"
    local run_status=0
    if run_codex_with_log "${prompt_file}" "${log_file}" "${append_mode}" "${timeout_seconds}" "${attempt_log_file}" "${codex_args[@]}"; then
      run_status=0
    else
      run_status=$?
    fi

    if [[ "${run_status}" -eq 0 ]]; then
      rm -f "${attempt_log_file}"
      CODEX_LAST_FAILURE_CLASSIFICATION="success"
      CODEX_LAST_FAILURE_ATTEMPTS="${attempt}"
      CODEX_LAST_FAILURE_RETRIES_USED="$((attempt - 1))"
      CODEX_LAST_FAILURE_EXIT_CODE="0"
      return 0
    fi

    local classification=""
    classification="$(classify_codex_failure "${run_status}" "${attempt_log_file}")"
    rm -f "${attempt_log_file}"

    if [[ "${classification}" == "transient" ]] && [[ "${retries_remaining}" -gt 0 ]]; then
      local retry_number=$((CODEX_TRANSIENT_RETRIES - retries_remaining + 1))
      local retry_sleep_seconds=$((CODEX_RETRY_BACKOFF_SECONDS * retry_number))
      log "WARN" "Transient Codex failure (exit ${run_status}) on attempt ${attempt}; retry ${retry_number}/${CODEX_TRANSIENT_RETRIES} in ${retry_sleep_seconds}s."
      if (( retry_sleep_seconds > 0 )); then
        sleep "${retry_sleep_seconds}"
      fi
      retries_remaining=$((retries_remaining - 1))
      append_mode="1"
      attempt=$((attempt + 1))
      continue
    fi

    CODEX_LAST_FAILURE_CLASSIFICATION="${classification}"
    CODEX_LAST_FAILURE_ATTEMPTS="${attempt}"
    CODEX_LAST_FAILURE_RETRIES_USED="$((attempt - 1))"
    CODEX_LAST_FAILURE_EXIT_CODE="${run_status}"
    return "${run_status}"
  done
}

recover_stale_in_progress_tasks() {
  local lifecycle_stage="${1:-bootstrap}"
  local stale_task_id=""
  local recovered=0

  if [[ ! -f "${PLAN_PATH}" ]]; then
    return 0
  fi

  while IFS= read -r stale_task_id; do
    if [[ -z "${stale_task_id}" ]]; then
      continue
    fi
    log "WARN" "Recovered stale in_progress task ${stale_task_id} during ${lifecycle_stage}."
    set_task_state "${stale_task_id}" "todo" "rollback evidence: recovered stale in_progress during ${lifecycle_stage}"
    recovered=$((recovered + 1))
  done < <(list_in_progress_tasks)

  if [[ "${recovered}" -gt 0 ]]; then
    log "INFO" "Recovered ${recovered} stale in_progress task(s) during ${lifecycle_stage}."
  fi
}

run_quality_gate() {
  if [[ -z "${GATE_SCRIPT}" && -z "${GATE_CMD}" ]]; then
    return 0
  fi

  if [[ -n "${GATE_SCRIPT}" ]]; then
    if [[ ! -f "${GATE_SCRIPT}" ]]; then
      log "ERROR" "Quality gate script not found: ${GATE_SCRIPT}"
      return 1
    fi
    log "INFO" "Running quality gate script: ${GATE_SCRIPT}"
    if ! (cd "${ROOT_DIR}" && bash "${GATE_SCRIPT}"); then
      return 1
    fi
    return 0
  fi

  if [[ -n "${GATE_CMD}" ]]; then
    log "INFO" "Running quality gate command: ${GATE_CMD}"
    if ! (cd "${ROOT_DIR}" && eval "${GATE_CMD}"); then
      return 1
    fi
  fi

  return 0
}

commit_iteration_changes() {
  local iteration="$1"
  local task_id="$2"

  if [[ "${AUTO_COMMIT}" != "1" ]]; then
    return 0
  fi

  if ! git -C "${ROOT_DIR}" diff --quiet || ! git -C "${ROOT_DIR}" diff --cached --quiet; then
    git -C "${ROOT_DIR}" add -A
    if ! git -C "${ROOT_DIR}" diff --cached --quiet; then
      git -C "${ROOT_DIR}" commit -m "${COMMIT_PREFIX}: iteration ${iteration} (${task_id})" >/dev/null
      log "INFO" "Committed iteration ${iteration} changes for ${task_id}"
    fi
  fi
}

get_next_task() {
  node "$PLAN_SCRIPT" next
}

set_task_state() {
  local task_id="$1"
  local state="$2"
  local note="${3:-}"
  note="$(normalize_task_state_note "${note}")"
  if [[ -n "${note}" ]]; then
    node "$PLAN_SCRIPT" mark "${task_id}" "${state}" "${note}" >/dev/null
  else
    node "$PLAN_SCRIPT" mark "${task_id}" "${state}" >/dev/null
  fi
}

parse_task_payload() {
  local payload="$1"
  local separator=$'\x1f'
  IFS="${separator}" read -r CURRENT_TASK_ID CURRENT_TASK_TITLE CURRENT_TASK_PRIORITY CURRENT_TASK_RUN_ORDER CURRENT_TASK_PARALLELIZABLE_TAG CURRENT_TASK_OWNERSHIP_TAG CURRENT_TASK_TRACEABILITY_TAG CURRENT_TASK_SPEC_REFS CURRENT_TASK_NOTES < <(
    node -e 'const task = JSON.parse(process.argv[1]); const sep = "\u001f"; const clean = (value) => String(value ?? "").replace(/[\u0000\u001f]/g, " "); process.stdout.write([clean(task.id), clean(task.title), String(task.priority || 100), String(task.run_order ?? task.runOrder ?? ""), clean(task.parallelizable_tag || task.parallelization_tag || task.parallel_tag || "parallel.serial_only@v1"), clean(task.ownership_tag), clean(task.traceability_tag), clean(task.spec_refs), clean(task.notes)].join(sep));' "${payload}"
  )

  CURRENT_TASK_FEEDBACK_SOURCE="$(build_task_feedback_source)"
  CURRENT_TASK_ONE_LINE_GOAL="$(build_task_one_line_goal)"
  CURRENT_TASK_CONFIRMED_FEEDBACK_SOURCE="${CURRENT_TASK_FEEDBACK_SOURCE}"
  CURRENT_TASK_CONFIRMED_USER_GOAL="${CURRENT_TASK_ONE_LINE_GOAL}"

  [[ -n "${CURRENT_TASK_ID}" ]]
}

build_task_prompt() {
  local prompt_file="$1"

  cat > "${prompt_file}" <<EOF
You are a senior software engineer running one iteration in Remit-Scout.

Goal:
- Implement exactly one task from IMPLEMENTATION_PLAN.md.

Task context:
- id: ${CURRENT_TASK_ID}
- title: ${CURRENT_TASK_TITLE}
- priority: ${CURRENT_TASK_PRIORITY}
- run_order: ${CURRENT_TASK_RUN_ORDER}
- parallelizable_tag: ${CURRENT_TASK_PARALLELIZABLE_TAG}
- ownership_tag: ${CURRENT_TASK_OWNERSHIP_TAG}
- traceability_tag: ${CURRENT_TASK_TRACEABILITY_TAG}
- spec_refs: ${CURRENT_TASK_SPEC_REFS}
- notes: ${CURRENT_TASK_NOTES}

Required AGENTS protocol confirmations:
- feedback source: ${CURRENT_TASK_FEEDBACK_SOURCE}
- user goal (one phrase): ${CURRENT_TASK_ONE_LINE_GOAL}

Rules:
- Use instructions in these files first:
  - AGENTS.md
  - .remit-scout/AGENTS.md
  - agents/AGENT-MATCH.md
  - ARCHITECTURE.md
  - SPECS/agents-bundle/**/*.md for component-level AGENTS
  - SPECS/agent-match.md plus matched AGENTS/RAG docs under SPECS/agents-bundle/agents/rag/
- Do not start or execute more than one task in this iteration.
- Update code for this task only, then run relevant checks.
- Confirm the feedback source (chat transcript or file path) in the final response.
- Confirm the user goal in one phrase in the final response.
- If blocked, report the blocker clearly.
- Do not send interim/progress updates. Return one final response only.
- End response with one completion token:
  - <promise>DONE</promise> if the task is complete.
  - <promise>BLOCKED</promise> if the task is blocked.

Response format addendum (required before completion token):
- Feedback source: <chat transcript or file path>
- User goal: <one phrase>

  For each iteration, use SPECS/ as the authoritative copied specs bundle.
EOF
}

extract_promise() {
  local message_file="$1"
  local task_comment
  local separator=$'\x1f'
  local parsed_promise=""

  PROMISE_VALIDATION_ERROR=""

  if [[ ! -s "${message_file}" ]]; then
    PROMISE_VALIDATION_ERROR="No <promise> token found in codex response"
    return 1
  fi

  parsed_promise="$(node -e 'const fs = require("node:fs"); const file = process.argv[1]; const sep = "\u001f"; const clean = (value) => String(value ?? "").replace(/[\u0000\u001f]/g, " ").replace(/\r?\n/g, " ").trim(); let text = ""; try { text = fs.readFileSync(file, "utf8"); } catch { process.stdout.write(["", "", "Unable to read codex last-message artifact"].map(clean).join(sep)); process.exit(0); } const lines = text.split(/\r?\n/); const tokenPattern = /^\s*<promise>(DONE|BLOCKED)<\/promise>(?:\s+(.*?))?\s*$/; const tokens = []; const malformed = []; let inFence = false; let finalContentLine = 0; for (let index = 0; index < lines.length; index += 1) { const raw = String(lines[index] ?? ""); const trimmed = raw.trim(); if (/^```/.test(trimmed)) { inFence = !inFence; continue; } if (inFence || !trimmed) continue; finalContentLine = index + 1; if (!trimmed.includes("<promise")) continue; const match = trimmed.match(tokenPattern); if (!match) { malformed.push(index + 1); continue; } tokens.push({ status: clean(match[1]), note: clean(match[2] || ""), line: index + 1 }); } let status = ""; let note = ""; let error = ""; if (malformed.length > 0) { error = "Malformed <promise> token line(s): " + malformed.join(", "); } else if (tokens.length === 0) { error = "No <promise> token found in codex response"; } else if (tokens.length > 1) { error = "Multiple <promise> tokens found (" + tokens.length + ")"; } else { const token = tokens[0]; if (token.line !== finalContentLine) { error = "<promise> token must be final non-empty line (token line " + token.line + ", final line " + finalContentLine + ")"; } else { status = token.status; note = token.note; } } process.stdout.write([status, note, clean(error)].join(sep));' "${message_file}" 2>/dev/null || true)"

  if [[ -z "${parsed_promise}" ]]; then
    PROMISE_VALIDATION_ERROR="Unable to validate <promise> token"
    return 1
  fi

  IFS="${separator}" read -r promise_status promise_note PROMISE_VALIDATION_ERROR <<<"${parsed_promise}"
  PROMISE_VALIDATION_ERROR="$(normalize_task_state_note "${PROMISE_VALIDATION_ERROR}")"

  if [[ -n "${PROMISE_VALIDATION_ERROR}" ]]; then
    return 1
  fi

  promise_status="$(normalize_task_state_note "${promise_status}")"
  promise_note="$(normalize_task_state_note "${promise_note}")"

  if [[ "${promise_status}" != "DONE" && "${promise_status}" != "BLOCKED" ]]; then
    PROMISE_VALIDATION_ERROR="Unknown promise token: ${promise_status}"
    return 1
  fi

  if [[ -z "${promise_note}" ]]; then
    promise_note="$(default_promise_note "${promise_status}")"
    task_comment="$(extract_task_comment "${message_file}" || true)"
    if [[ -n "${task_comment}" ]]; then
      promise_note="$(normalize_task_state_note "${promise_note}; task comment: ${task_comment}")"
    fi
  fi

  return 0
}

run_iteration() {
  local iteration="$1"
  local iteration_prompt
  local iteration_log
  local last_message
  local task_payload
  local promise_status
  local promise_note
  local task_state_note

  LAST_TASK_OUTCOME=""

  mkdir -p "${LOG_DIR}"
  iteration_prompt="$(mktemp)"
  iteration_log="${LOG_DIR}/iteration-${iteration}.log"
  last_message="${LOG_DIR}/iteration-${iteration}.last-message.txt"
  : > "${last_message}"

  if ! task_payload="$(get_next_task)"; then
    local remaining_todo=""
    if ! remaining_todo="$(count_todo_tasks)"; then
      LAST_TASK_OUTCOME="error"
      rm -f "${iteration_prompt}" "${last_message}"
      log "ERROR" "Failed to fetch next task and failed to count remaining TODO tasks."
      return 1
    fi

    if [[ "${remaining_todo}" =~ ^[0-9]+$ ]] && [[ "${remaining_todo}" -eq 0 ]]; then
      LAST_TASK_OUTCOME="no_tasks"
      rm -f "${iteration_prompt}" "${last_message}"
      return 2
    fi

    LAST_TASK_OUTCOME="error"
    rm -f "${iteration_prompt}" "${last_message}"
    log "ERROR" "Failed to fetch next task while ${remaining_todo:-unknown} TODO task(s) remain."
    return 1
  fi

  if ! parse_task_payload "${task_payload}"; then
    LAST_TASK_OUTCOME="error"
    rm -f "${iteration_prompt}" "${last_message}"
    log "ERROR" "Unable to parse task payload: ${task_payload}"
    return 1
  fi

  set_task_state "${CURRENT_TASK_ID}" "in_progress" "iteration ${iteration} started"
  log "INFO" "Iteration ${iteration} task tags parallelizable=${CURRENT_TASK_PARALLELIZABLE_TAG:-unknown} ownership=${CURRENT_TASK_OWNERSHIP_TAG:-unknown} traceability=${CURRENT_TASK_TRACEABILITY_TAG:-unknown}"
  ACTIVE_TASK_ID="${CURRENT_TASK_ID}"
  ACTIVE_TASK_ITERATION="${iteration}"
  build_task_prompt "${iteration_prompt}"

  local -a codex_cmd=()
  if [[ "${RALPH_BACKEND}" == "claude" ]]; then
    codex_cmd=("${CLAUDE_ADAPTER}" --cd "${ROOT_DIR}" --sandbox "${CODEX_SANDBOX}" --output-last-message "${last_message}")
    if [[ -n "${RALPH_CLAUDE_MODEL:-claude-opus-4-6}" ]]; then
      codex_cmd+=(--model "${RALPH_CLAUDE_MODEL:-claude-opus-4-6}")
    fi
  else
    codex_cmd=(codex exec --cd "${ROOT_DIR}" --sandbox "${CODEX_SANDBOX}" --json --output-last-message "${last_message}")
    if [[ -n "${CODEX_MODEL}" ]]; then
      codex_cmd+=(--model "${CODEX_MODEL}")
    fi
    if [[ "${CODEX_DISABLE_MCP}" == "1" ]]; then
      codex_cmd+=(-c 'mcp_servers={}')
    fi
  fi

  local codex_status=0
  if run_codex_with_retry_policy "${iteration_prompt}" "${iteration_log}" "0" "${CODEX_TIMEOUT_SECONDS}" "${codex_cmd[@]}"; then
    codex_status=0
  else
    codex_status=$?
  fi
  redact_file_in_place "${last_message}" || true
  if [[ "${codex_status}" -ne 0 ]]; then
    local codex_failure_classification="${CODEX_LAST_FAILURE_CLASSIFICATION:-fatal}"

    if [[ "${codex_failure_classification}" == "timeout" ]]; then
      task_state_note="Codex execution timed out after ${CODEX_TIMEOUT_SECONDS}s (classification=timeout, attempts=${CODEX_LAST_FAILURE_ATTEMPTS})"
      set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
      write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
      clear_active_task
      LAST_TASK_OUTCOME="blocked"
      log "WARN" "Task ${CURRENT_TASK_ID} timed out after ${CODEX_TIMEOUT_SECONDS}s; marked blocked and continuing."
      rm -f "${iteration_prompt}"
      return 0
    fi

    if [[ "${codex_failure_classification}" == "model_unsupported" ]] && [[ "${CODEX_ALLOW_MODEL_FALLBACK}" == "1" ]]; then
      log "WARN" "Model ${CODEX_MODEL} unsupported for current auth. Retrying with fallback model/default."
      local -a fallback_cmd=()
      if [[ "${RALPH_BACKEND}" == "claude" ]]; then
        fallback_cmd=("${CLAUDE_ADAPTER}" --cd "${ROOT_DIR}" --sandbox "${CODEX_SANDBOX}" --output-last-message "${last_message}")
        fallback_cmd+=(--model "${RALPH_CLAUDE_FALLBACK_MODEL:-claude-sonnet-4-6}")
      else
        fallback_cmd=(codex exec --cd "${ROOT_DIR}" --sandbox "${CODEX_SANDBOX}" --json --output-last-message "${last_message}")
        if [[ -n "${CODEX_FALLBACK_MODEL}" ]]; then
          fallback_cmd+=(--model "${CODEX_FALLBACK_MODEL}")
        fi
        if [[ "${CODEX_DISABLE_MCP}" == "1" ]]; then
          fallback_cmd+=(-c 'mcp_servers={}')
        fi
      fi
      local fallback_status=0
      if run_codex_with_retry_policy "${iteration_prompt}" "${iteration_log}" "1" "${CODEX_TIMEOUT_SECONDS}" "${fallback_cmd[@]}"; then
        fallback_status=0
      else
        fallback_status=$?
      fi
      redact_file_in_place "${last_message}" || true
      if [[ "${fallback_status}" -ne 0 ]]; then
        local fallback_failure_classification="${CODEX_LAST_FAILURE_CLASSIFICATION:-fatal}"

        if [[ "${fallback_failure_classification}" == "timeout" ]]; then
          task_state_note="Codex execution timed out after ${CODEX_TIMEOUT_SECONDS}s (fallback model, attempts=${CODEX_LAST_FAILURE_ATTEMPTS})"
          set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
          write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
          clear_active_task
          LAST_TASK_OUTCOME="blocked"
          log "WARN" "Task ${CURRENT_TASK_ID} timed out on fallback model after ${CODEX_TIMEOUT_SECONDS}s; marked blocked and continuing."
          rm -f "${iteration_prompt}"
          return 0
        fi

        if [[ "${fallback_failure_classification}" == "transient" ]]; then
          task_state_note="Codex transient failure after fallback retries exhausted (attempts=${CODEX_LAST_FAILURE_ATTEMPTS}, retries=${CODEX_LAST_FAILURE_RETRIES_USED})"
          set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
          write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
          clear_active_task
          LAST_TASK_OUTCOME="blocked"
          log "WARN" "Task ${CURRENT_TASK_ID} hit transient Codex failure after fallback retries; marked blocked and continuing."
          rm -f "${iteration_prompt}"
          return 0
        fi

        task_state_note="Codex execution failed after fallback (classification=${fallback_failure_classification}, exit=${fallback_status}, attempts=${CODEX_LAST_FAILURE_ATTEMPTS}, retries=${CODEX_LAST_FAILURE_RETRIES_USED})"
        set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
        write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
        clear_active_task
        LAST_TASK_OUTCOME="error"
        rm -f "${iteration_prompt}"
        return 1
      fi
    elif [[ "${codex_failure_classification}" == "transient" ]]; then
      task_state_note="Codex transient failure after retries exhausted (attempts=${CODEX_LAST_FAILURE_ATTEMPTS}, retries=${CODEX_LAST_FAILURE_RETRIES_USED})"
      set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
      write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
      clear_active_task
      LAST_TASK_OUTCOME="blocked"
      log "WARN" "Task ${CURRENT_TASK_ID} hit transient Codex failure after retries; marked blocked and continuing."
      rm -f "${iteration_prompt}"
      return 0
    else
      task_state_note="Codex execution failed (classification=${codex_failure_classification}, exit=${codex_status}, attempts=${CODEX_LAST_FAILURE_ATTEMPTS}, retries=${CODEX_LAST_FAILURE_RETRIES_USED})"
      set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
      write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
      clear_active_task
      LAST_TASK_OUTCOME="error"
      rm -f "${iteration_prompt}"
      return 1
    fi
  fi

  if ! extract_promise "${last_message}"; then
    task_state_note="$(build_missing_promise_note "${last_message}")"
    set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
    write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
    clear_active_task
    if [[ "${PROMISE_VALIDATION_HARD_FAIL}" == "1" ]]; then
      LAST_TASK_OUTCOME="error"
      log "ERROR" "Task ${CURRENT_TASK_ID} failed promise token validation; hard-fail enabled, stopping loop."
      rm -f "${iteration_prompt}"
      return 1
    fi
    LAST_TASK_OUTCOME="blocked"
    log "WARN" "Task ${CURRENT_TASK_ID} blocked due to invalid promise token; continuing."
    rm -f "${iteration_prompt}"
    return 0
  fi

  if ! extract_protocol_confirmation "${last_message}"; then
    task_state_note="Missing AGENTS protocol confirmation: include 'Feedback source:' and 'User goal:' in final response"
    set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
    write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
    clear_active_task
    LAST_TASK_OUTCOME="blocked"
    log "BLOCK" "Task ${CURRENT_TASK_ID} blocked by missing feedback source/user goal confirmation."
    rm -f "${iteration_prompt}"
    return 0
  fi

  if [[ "${promise_status}" == "DONE" ]]; then
    if ! run_quality_gate; then
      task_state_note="Quality gate failed: ${GATE_CMD}"
      set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
      write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
      clear_active_task
      LAST_TASK_OUTCOME="error"
      log "ERROR" "Quality gate failed after task ${CURRENT_TASK_ID}; stopping loop."
      rm -f "${iteration_prompt}"
      return 1
    fi

    if ! commit_iteration_changes "${iteration}" "${CURRENT_TASK_ID}"; then
      task_state_note="Auto-commit failed"
      set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
      write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
      clear_active_task
      LAST_TASK_OUTCOME="error"
      log "ERROR" "Auto-commit failed after task ${CURRENT_TASK_ID}; stopping loop."
      rm -f "${iteration_prompt}"
      return 1
    fi

    task_state_note="${promise_note}"
    set_task_state "${CURRENT_TASK_ID}" "done" "${task_state_note}"
    write_iteration_handoff "${iteration}" "done" "${task_state_note}" "${iteration_log}" "${last_message}"
    LAST_TASK_OUTCOME="done"
    log "DONE" "Task ${CURRENT_TASK_ID} completed."
  elif [[ "${promise_status}" == "BLOCKED" ]]; then
    task_state_note="${promise_note}"
    set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
    write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
    LAST_TASK_OUTCOME="blocked"
    log "BLOCK" "Task ${CURRENT_TASK_ID} blocked."
  else
    task_state_note="Unknown promise token: ${promise_status}"
    set_task_state "${CURRENT_TASK_ID}" "blocked" "${task_state_note}"
    write_iteration_handoff "${iteration}" "blocked" "${task_state_note}" "${iteration_log}" "${last_message}"
    clear_active_task
    LAST_TASK_OUTCOME="error"
    rm -f "${iteration_prompt}"
    return 1
  fi

  clear_active_task

  rm -f "${iteration_prompt}"
  return 0
}

run_loop() {
  local iteration=0
  mkdir -p "${LOG_DIR}"

  while true; do
    iteration=$((iteration + 1))
    RUN_LAST_ITERATION="${iteration}"
    if (( MAX_ITERATIONS > 0 && iteration > MAX_ITERATIONS )); then
      break
    fi

    # Check for operator stop file before each iteration
    if check_stop_file; then
      log "INFO" "Stopping loop at iteration ${iteration} due to stop file at $(relative_to_root "${STOP_FILE}")."
      log "INFO" "To resume, remove the stop file: rm -f $(relative_to_root "${STOP_FILE}")"
      return 0
    fi

    prune_log_retention
    run_plan

    if run_iteration "${iteration}"; then
      RUN_COMPLETED_ITERATIONS=$((RUN_COMPLETED_ITERATIONS + 1))
      sleep_between_tasks "${LAST_TASK_OUTCOME:-done}"
      local exit_code=0
    else
      local exit_code=$?
      if [[ "${exit_code}" -eq 2 ]]; then
        log "DONE" "No TODO tasks remain. <promise>DONE</promise>"
        echo "<promise>DONE</promise>"
        return 0
      fi
      log "ERROR" "Iteration ${iteration} did not complete."
      return "${exit_code}"
    fi
  done

  if (( MAX_ITERATIONS > 0 )); then
    local remaining_todo=0
    remaining_todo="$(count_todo_tasks)"
    if [[ "${remaining_todo}" == "0" ]]; then
      log "DONE" "Reached max iterations (${MAX_ITERATIONS}) with no TODO tasks remaining. <promise>DONE</promise>"
      echo "<promise>DONE</promise>"
      return 0
    fi
    log "WARN" "Reached max iterations (${MAX_ITERATIONS}) with ${remaining_todo} TODO task(s) remaining."
  else
    log "WARN" "Stopped due to non-zero exit condition."
  fi
  return 2
}

main() {
  local mode="${1:-run}"
  RUN_MODE="${mode}"

  trap 'on_exit "$?"' EXIT
  trap 'on_signal INT' INT
  trap 'on_signal TERM' TERM
  trap 'on_signal HUP' HUP

  require_command node || exit 1
  if [[ "${RALPH_BACKEND}" == "claude" ]]; then
    require_command claude || exit 1
    if [[ ! -x "${CLAUDE_ADAPTER}" ]]; then
      log "ERROR" "Claude adapter not found or not executable: ${CLAUDE_ADAPTER}"
      exit 1
    fi
  else
    require_command codex || exit 1
  fi
  require_non_negative_integer "${MAX_ITERATIONS}" "RALPH_MAX_ITERATIONS" || exit 1
  require_non_negative_integer "${LOOP_SLEEP_SECONDS}" "RALPH_LOOP_SLEEP_SECONDS" || exit 1
  require_binary_flag "${LOOP_BACKOFF_ON_BLOCKED}" "RALPH_LOOP_BACKOFF_ON_BLOCKED" || exit 1
  require_non_negative_integer "${LOOP_BACKOFF_INITIAL_SECONDS}" "RALPH_LOOP_BACKOFF_INITIAL_SECONDS" || exit 1
  require_non_negative_integer "${LOOP_BACKOFF_MAX_SECONDS}" "RALPH_LOOP_BACKOFF_MAX_SECONDS" || exit 1
  require_positive_integer "${LOOP_BACKOFF_MULTIPLIER}" "RALPH_LOOP_BACKOFF_MULTIPLIER" || exit 1
  if [[ "${LOOP_BACKOFF_INITIAL_SECONDS}" -gt "${LOOP_BACKOFF_MAX_SECONDS}" ]]; then
    log "ERROR" "RALPH_LOOP_BACKOFF_MAX_SECONDS must be >= RALPH_LOOP_BACKOFF_INITIAL_SECONDS."
    exit 1
  fi
  require_non_negative_integer "${CODEX_TIMEOUT_SECONDS}" "RALPH_CODEX_TIMEOUT_SECONDS" || exit 1
  require_non_negative_integer "${CODEX_TRANSIENT_RETRIES}" "RALPH_CODEX_TRANSIENT_RETRIES" || exit 1
  require_non_negative_integer "${CODEX_RETRY_BACKOFF_SECONDS}" "RALPH_CODEX_RETRY_BACKOFF_SECONDS" || exit 1
  require_non_negative_integer "${LOG_RETENTION_DAYS}" "RALPH_LOG_RETENTION_DAYS" || exit 1
  require_binary_flag "${LOG_REDACTION_ENABLED}" "RALPH_LOG_REDACTION_ENABLED" || exit 1
  require_binary_flag "${PROMISE_VALIDATION_HARD_FAIL}" "RALPH_PROMISE_VALIDATION_HARD_FAIL" || exit 1
  if [[ -n "${GATE_SCRIPT}" || -n "${GATE_CMD}" ]]; then
    require_command sh || exit 1
  fi
  if [[ "${AUTO_COMMIT}" == "1" ]]; then
    require_command git || exit 1
    ensure_clean_worktree || exit 1
  fi

  # Pre-flight stop file check
  if check_stop_file; then
    log "INFO" "Refusing to start: stop file present at $(relative_to_root "${STOP_FILE}"). Remove it to proceed."
    exit 0
  fi

  case "${mode}" in
    plan)
      acquire_iteration_lock "${mode}" || exit 1
      mark_run_started
      run_plan
      cat "${PLAN_PATH}"
      ;;
    run)
      acquire_iteration_lock "${mode}" || exit 1
      mark_run_started
      run_loop
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi

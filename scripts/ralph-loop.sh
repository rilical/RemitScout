#!/usr/bin/env bash
set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly PLAN_SCRIPT="${RALPH_PLAN_SCRIPT:-${ROOT_DIR}/scripts/ralph/plan.mjs}"
readonly PLAN_PATH="${RALPH_PLAN_FILE:-${ROOT_DIR}/IMPLEMENTATION_PLAN.md}"
readonly PROGRESS_PATH="${RALPH_PROGRESS_FILE:-${ROOT_DIR}/progress.txt}"
readonly LOG_DIR="${RALPH_LOG_DIR:-${ROOT_DIR}/.ralph/loop}"
readonly MAX_ITERATIONS="${RALPH_MAX_ITERATIONS:-100}"
readonly LOOP_SLEEP_SECONDS="${RALPH_LOOP_SLEEP_SECONDS:-0}"
readonly CODEX_SANDBOX="${CODEX_SANDBOX:-danger-full-access}"

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

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR" "Missing command: $1"
    return 1
  fi
}

run_plan() {
  node "$PLAN_SCRIPT" sync
  node "$PLAN_SCRIPT" build
}

get_next_task() {
  node "$PLAN_SCRIPT" next
}

set_task_state() {
  local task_id="$1"
  local state="$2"
  local note="${3:-}"
  if [[ -n "${note}" ]]; then
    node "$PLAN_SCRIPT" mark "${task_id}" "${state}" "${note}"
  else
    node "$PLAN_SCRIPT" mark "${task_id}" "${state}"
  fi
}

parse_task_payload() {
  local payload="$1"
  IFS=$'\0' read -r CURRENT_TASK_ID CURRENT_TASK_TITLE CURRENT_TASK_PRIORITY CURRENT_TASK_SPEC_REFS CURRENT_TASK_NOTES < <(
    node -e 'const task = JSON.parse(process.argv[1]); const safe = (value) => String(value || "").replace(/\\u0000/g, " "); process.stdout.write([safe(task.id), safe(task.title), String(task.priority || 100), safe(task.spec_refs), safe(task.notes)].join("\\u0000"));' "${payload}"
  )

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
- spec_refs: ${CURRENT_TASK_SPEC_REFS}
- notes: ${CURRENT_TASK_NOTES}

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
- If blocked, report the blocker clearly.
- End response with one completion token:
  - <promise>DONE</promise> if the task is complete.
  - <promise>BLOCKED</promise> if the task is blocked.

  For each iteration, use SPECS/ as the authoritative copied specs bundle.
EOF
}

extract_promise() {
  local message_file="$1"
  local line

  line="$(grep -Eo '<promise>(DONE|BLOCKED)</promise>([[:space:]].*)?$' "${message_file}" | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    return 1
  fi

  promise_status="$(printf '%s' "${line}" | sed -E 's/.*<promise>([^<]+)<\\/promise>.*/\\1/')"
  promise_note="$(printf '%s' "${line}" | sed -E 's/.*<\\/promise>[[:space:]]*(.*)/\\1/' | sed 's/[[:space:]]*$//' | sed 's/^[[:space:]]*//')"
  if [[ -z "${promise_note}" ]]; then
    promise_note="${promise_status} completed"
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

  mkdir -p "${LOG_DIR}"
  iteration_prompt="$(mktemp)"
  iteration_log="${LOG_DIR}/iteration-${iteration}.log"
  last_message="${LOG_DIR}/iteration-${iteration}.last-message.txt"

  if ! task_payload="$(get_next_task)"; then
    rm -f "${iteration_prompt}" "${last_message}"
    return 2
  fi

  if ! parse_task_payload "${task_payload}"; then
    rm -f "${iteration_prompt}" "${last_message}"
    log "ERROR" "Unable to parse task payload: ${task_payload}"
    return 1
  fi

  set_task_state "${CURRENT_TASK_ID}" "in_progress" "iteration ${iteration} started"
  build_task_prompt "${iteration_prompt}"

  if ! cat "${iteration_prompt}" | codex exec --cd "${ROOT_DIR}" --sandbox "${CODEX_SANDBOX}" --json --output-last-message "${last_message}" 2>&1 | tee "${iteration_log}"; then
    set_task_state "${CURRENT_TASK_ID}" "blocked" "Codex execution failed"
    rm -f "${iteration_prompt}" "${last_message}"
    return 1
  fi

  if ! extract_promise "${last_message}"; then
    set_task_state "${CURRENT_TASK_ID}" "blocked" "No <promise> token found in codex response"
    rm -f "${iteration_prompt}"
    return 1
  fi

  if [[ "${promise_status}" == "DONE" ]]; then
    set_task_state "${CURRENT_TASK_ID}" "done" "${promise_note}"
    log "DONE" "Task ${CURRENT_TASK_ID} completed."
  elif [[ "${promise_status}" == "BLOCKED" ]]; then
    set_task_state "${CURRENT_TASK_ID}" "blocked" "${promise_note}"
    log "BLOCK" "Task ${CURRENT_TASK_ID} blocked."
  else
    set_task_state "${CURRENT_TASK_ID}" "blocked" "Unknown promise token: ${promise_status}"
    rm -f "${iteration_prompt}"
    return 1
  fi

  if [[ "${LOOP_SLEEP_SECONDS}" -gt 0 ]]; then
    sleep "${LOOP_SLEEP_SECONDS}"
  fi

  rm -f "${iteration_prompt}"
  return 0
}

run_loop() {
  local iteration=0
  mkdir -p "${LOG_DIR}"

  while true; do
    iteration=$((iteration + 1))
    if (( MAX_ITERATIONS > 0 && iteration > MAX_ITERATIONS )); then
      break
    fi
    run_plan

    if run_iteration "${iteration}"; then
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
    log "WARN" "Reached max iterations (${MAX_ITERATIONS})."
  else
    log "WARN" "Stopped due to non-zero exit condition."
  fi
  return 2
}

main() {
  local mode="${1:-run}"

  require_command node || exit 1
  require_command codex || exit 1

  case "${mode}" in
    plan)
      run_plan
      cat "${PLAN_PATH}"
      ;;
    run)
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

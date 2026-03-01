#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GATE_MODE="${RALPH_GATE_MODE:-changed}" # changed|strict
RUN_LINT="${RALPH_GATE_RUN_LINT:-1}"
RUN_TESTS="${RALPH_GATE_RUN_TESTS:-1}"
RUN_VERIFIER="${RALPH_GATE_RUN_VERIFIER:-1}"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [GATE] $*"
}

run_cmd() {
  log "run: $*"
  (cd "${ROOT_DIR}" && "$@")
}

collect_changed_files() {
  (
    cd "${ROOT_DIR}"
    {
      git diff --name-only --diff-filter=ACMR
      git diff --cached --name-only --diff-filter=ACMR
      git ls-files --others --exclude-standard
    } | sed '/^$/d' | sort -u
  )
}

collect_lint_targets() {
  collect_changed_files | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|vue)$' | grep -Ev '^(node_modules|backend/node_modules|frontend/node_modules|SPECS/|infrastructure/cdk/cdk\.out)'
}

run_eslint_changed() {
  local lint_targets=()
  while IFS= read -r file; do
    [[ -z "${file}" ]] && continue
    lint_targets+=("${file}")
  done < <(collect_lint_targets)

  if [[ ${#lint_targets[@]} -eq 0 ]]; then
    log "no changed lint targets; skipping eslint"
    return 0
  fi

  log "changed lint targets: ${#lint_targets[@]}"
  (
    cd "${ROOT_DIR}"
    pnpm exec eslint "${lint_targets[@]}"
  )
}

has_changes_in() {
  local prefix="$1"
  collect_changed_files | grep -q "^${prefix}/"
}

run_verifier_layer() {
  run_cmd pnpm verifier:contract
  run_cmd pnpm verifier:workflow-consumer-contract
}

run_lint_layer_strict() {
  run_cmd pnpm lint
  run_cmd pnpm -C backend lint
  run_cmd pnpm -C frontend lint
  run_cmd pnpm -C frontend type-check
}

run_lint_layer_changed() {
  run_eslint_changed
  if has_changes_in frontend; then
    run_cmd pnpm -C frontend type-check
  else
    log "no frontend changes; skipping frontend type-check"
  fi
}

run_test_layer_strict() {
  run_cmd pnpm -C backend test
  run_cmd pnpm -C frontend test
}

run_test_layer_changed() {
  if has_changes_in backend; then
    run_cmd pnpm -C backend test
  else
    log "no backend changes; skipping backend tests"
  fi

  if has_changes_in frontend; then
    run_cmd pnpm -C frontend test
  else
    log "no frontend changes; skipping frontend tests"
  fi
}

log "starting checker/verifier/tester gate mode=${GATE_MODE} lint=${RUN_LINT} tests=${RUN_TESTS} verifier=${RUN_VERIFIER}"

if [[ "${RUN_VERIFIER}" == "1" ]]; then
  run_verifier_layer
else
  log "verifier disabled"
fi

if [[ "${RUN_LINT}" == "1" ]]; then
  if [[ "${GATE_MODE}" == "strict" ]]; then
    run_lint_layer_strict
  else
    run_lint_layer_changed
  fi
else
  log "lint disabled"
fi

if [[ "${RUN_TESTS}" == "1" ]]; then
  if [[ "${GATE_MODE}" == "strict" ]]; then
    run_test_layer_strict
  else
    run_test_layer_changed
  fi
else
  log "tests disabled"
fi

log "quality gate passed"

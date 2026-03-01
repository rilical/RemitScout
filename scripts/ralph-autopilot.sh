#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIT_MAX_ITERATIONS="${1:-100000}"
IMPLEMENT_MAX_ITERATIONS="${2:-0}"

RUN_AUDIT="${RALPH_RUN_AUDIT:-1}"
RUN_IMPLEMENT="${RALPH_RUN_IMPLEMENT:-1}"

echo "[RALPH] Autopilot starting"
echo "[RALPH] Audit max iterations: ${AUDIT_MAX_ITERATIONS}"
echo "[RALPH] Implementation max iterations: ${IMPLEMENT_MAX_ITERATIONS}"
echo "[RALPH] Root PRD (implementation): ${ROOT_DIR}/prd.json"
echo "[RALPH] Audit PRD: ${ROOT_DIR}/.codex/ralph-audit/prd.json"

if [[ "${RUN_AUDIT}" == "1" ]]; then
  echo "[RALPH] Phase 1/2: audit loop"
  (cd "${ROOT_DIR}" && bash .codex/ralph-audit/ralph.sh "${AUDIT_MAX_ITERATIONS}")
else
  echo "[RALPH] Skipping audit loop (RALPH_RUN_AUDIT=${RUN_AUDIT})"
fi

if [[ "${RUN_IMPLEMENT}" == "1" ]]; then
  echo "[RALPH] Phase 2/2: implementation loop"
  (cd "${ROOT_DIR}" && bash scripts/ralph-implement.sh "${IMPLEMENT_MAX_ITERATIONS}")
else
  echo "[RALPH] Skipping implementation loop (RALPH_RUN_IMPLEMENT=${RUN_IMPLEMENT})"
fi

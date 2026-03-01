#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAX_ITERATIONS="${1:-0}"

export RALPH_MAX_ITERATIONS="${RALPH_MAX_ITERATIONS:-${MAX_ITERATIONS}}"
export RALPH_GATE_SCRIPT="${RALPH_GATE_SCRIPT:-${ROOT_DIR}/scripts/ralph-quality-gate.sh}"
export RALPH_GATE_MODE="${RALPH_GATE_MODE:-changed}"
export RALPH_GATE_RUN_VERIFIER="${RALPH_GATE_RUN_VERIFIER:-1}"
export RALPH_GATE_RUN_LINT="${RALPH_GATE_RUN_LINT:-0}"
export RALPH_GATE_RUN_TESTS="${RALPH_GATE_RUN_TESTS:-0}"

echo "[RALPH] Implementation loop starting"
echo "[RALPH] PRD source: ${ROOT_DIR}/prd.json (items[])"
echo "[RALPH] Max iterations: ${RALPH_MAX_ITERATIONS}"
echo "[RALPH] Quality gate script: ${RALPH_GATE_SCRIPT}"
echo "[RALPH] Quality gate mode: ${RALPH_GATE_MODE}"
echo "[RALPH] Quality gate toggles: verifier=${RALPH_GATE_RUN_VERIFIER} lint=${RALPH_GATE_RUN_LINT} tests=${RALPH_GATE_RUN_TESTS}"

exec "${ROOT_DIR}/scripts/ralph-loop.sh" run

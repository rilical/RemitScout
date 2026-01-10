#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

RUN_FRONTEND="${RUN_FRONTEND:-1}"
RUN_PLANE_A="${RUN_PLANE_A:-1}"
RUN_PLANE_B="${RUN_PLANE_B:-1}"
RUN_PLANE_C="${RUN_PLANE_C:-1}"

pids=()
names=()

start_process() {
  local name="$1"
  shift
  echo "Starting ${name}..."
  "$@" &
  pids+=("$!")
  names+=("$name")
}

cleanup() {
  echo "Stopping local stack..."
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
}

trap cleanup EXIT INT TERM

if [[ "$RUN_PLANE_A" == "1" ]]; then
  start_process "plane-a" pnpm -C "$ROOT_DIR/backend" dev:plane-a
fi

if [[ "$RUN_PLANE_B" == "1" ]]; then
  start_process "plane-b" pnpm -C "$ROOT_DIR/backend" dev:plane-b
fi

if [[ "$RUN_PLANE_C" == "1" ]]; then
  start_process "plane-c" pnpm -C "$ROOT_DIR/backend" dev:plane-c
fi

if [[ "$RUN_FRONTEND" == "1" ]]; then
  start_process "frontend" pnpm -C "$ROOT_DIR/frontend" dev
fi

echo "Local stack running. Ctrl+C to stop."

while true; do
  for i in "${!pids[@]}"; do
    pid="${pids[$i]}"
    if ! kill -0 "$pid" 2>/dev/null; then
      echo "${names[$i]} exited. Shutting down..."
      exit 1
    fi
  done
  sleep 1
done

#!/usr/bin/env bash
set -euo pipefail

# Airlock lint script — runs linters/formatters on changed files only.
# Env vars: AIRLOCK_BASE_SHA, AIRLOCK_HEAD_SHA (defaults to HEAD vs parent)

BASE_SHA="${AIRLOCK_BASE_SHA:-$(git merge-base HEAD origin/main 2>/dev/null || git rev-parse HEAD^)}"
HEAD_SHA="${AIRLOCK_HEAD_SHA:-HEAD}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Get changed files
CHANGED_FILES=$(git diff --name-only "$BASE_SHA" "$HEAD_SHA" 2>/dev/null || git diff --name-only HEAD 2>/dev/null || true)

if [ -z "$CHANGED_FILES" ]; then
  echo "No changed files detected — skipping lint."
  exit 0
fi

echo "Changed files:"
echo "$CHANGED_FILES"
echo ""

LINT_FAILED=0

# ── YAML validation ──────────────────────────────────────────────────────────
YAML_FILES=""
while IFS= read -r f; do
  case "$f" in
    *.yml|*.yaml)
      if [ -f "$f" ]; then
        YAML_FILES="$YAML_FILES $f"
      fi
      ;;
  esac
done <<< "$CHANGED_FILES"

if [ -n "$YAML_FILES" ]; then
  echo "==> Validating YAML files..."
  YAML_ERRORS=0
  for f in $YAML_FILES; do
    if ! python3 -c "import sys, yaml; yaml.safe_load(open('$f'))" 2>/dev/null; then
      echo "  FAIL: $f — invalid YAML"
      YAML_ERRORS=$((YAML_ERRORS + 1))
    else
      echo "  OK:   $f"
    fi
  done
  if [ "$YAML_ERRORS" -gt 0 ]; then
    LINT_FAILED=1
  fi
  echo ""
fi

# ── Backend ESLint (TS/JS files in backend/) ─────────────────────────────────
BACKEND_FILES=""
while IFS= read -r f; do
  case "$f" in
    backend/*.ts|backend/*.js|backend/**/*.ts|backend/**/*.js)
      if [ -f "$f" ]; then
        BACKEND_FILES="$BACKEND_FILES $f"
      fi
      ;;
  esac
done <<< "$CHANGED_FILES"

# Also catch files matching backend/ prefix without glob
BACKEND_FILES_LIST=""
while IFS= read -r f; do
  if [[ "$f" == backend/* ]] && [[ "$f" == *.ts || "$f" == *.js ]] && [ -f "$f" ]; then
    BACKEND_FILES_LIST="$BACKEND_FILES_LIST $f"
  fi
done <<< "$CHANGED_FILES"

if [ -n "$BACKEND_FILES_LIST" ]; then
  echo "==> Running ESLint on backend files (auto-fix)..."
  if npx --prefix . eslint --fix $BACKEND_FILES_LIST 2>&1; then
    echo "  ESLint auto-fix: OK"
  else
    echo "  ESLint auto-fix encountered issues (checking...)"
  fi

  echo "==> Running ESLint on backend files (check)..."
  if ! npx --prefix . eslint $BACKEND_FILES_LIST 2>&1; then
    echo "  FAIL: ESLint errors remain in backend files"
    LINT_FAILED=1
  else
    echo "  ESLint: PASS"
  fi
  echo ""
fi

# ── Frontend ESLint + Prettier (files in frontend/) ──────────────────────────
FRONTEND_TS_FILES=""
FRONTEND_PRETTIER_FILES=""
while IFS= read -r f; do
  if [[ "$f" == frontend/* ]] && [ -f "$f" ]; then
    case "$f" in
      *.ts|*.js|*.vue) FRONTEND_TS_FILES="$FRONTEND_TS_FILES $f" ;;
    esac
    case "$f" in
      *.ts|*.js|*.vue|*.css|*.json|*.md) FRONTEND_PRETTIER_FILES="$FRONTEND_PRETTIER_FILES $f" ;;
    esac
  fi
done <<< "$CHANGED_FILES"

if [ -n "$FRONTEND_PRETTIER_FILES" ]; then
  if command -v prettier >/dev/null 2>&1 || [ -f "frontend/node_modules/.bin/prettier" ]; then
    PRETTIER_BIN="prettier"
    [ -f "frontend/node_modules/.bin/prettier" ] && PRETTIER_BIN="frontend/node_modules/.bin/prettier"
    echo "==> Running Prettier on frontend files (auto-fix)..."
    $PRETTIER_BIN --write $FRONTEND_PRETTIER_FILES 2>&1 || true

    echo "==> Running Prettier on frontend files (check)..."
    if ! $PRETTIER_BIN --check $FRONTEND_PRETTIER_FILES 2>&1; then
      echo "  FAIL: Prettier formatting issues remain"
      LINT_FAILED=1
    else
      echo "  Prettier: PASS"
    fi
    echo ""
  fi
fi

if [ -n "$FRONTEND_TS_FILES" ]; then
  if [ -f "frontend/node_modules/.bin/eslint" ] || command -v eslint >/dev/null 2>&1; then
    ESLINT_BIN="eslint"
    [ -f "frontend/node_modules/.bin/eslint" ] && ESLINT_BIN="frontend/node_modules/.bin/eslint"
    echo "==> Running ESLint on frontend files (auto-fix)..."
    $ESLINT_BIN --fix $FRONTEND_TS_FILES 2>&1 || true

    echo "==> Running ESLint on frontend files (check)..."
    if ! $ESLINT_BIN $FRONTEND_TS_FILES 2>&1; then
      echo "  FAIL: ESLint errors remain in frontend files"
      LINT_FAILED=1
    else
      echo "  Frontend ESLint: PASS"
    fi
    echo ""
  fi
fi

# ── Result ────────────────────────────────────────────────────────────────────
if [ "$LINT_FAILED" -ne 0 ]; then
  echo "Lint FAILED — issues remain."
  exit 1
fi

echo "Lint PASSED."
exit 0

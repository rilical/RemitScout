# Ralph verifier wiring (stable `quality.*` payload)

Business goal: keep the orchestration loop unblocked by ensuring every
`verify.passed`/`verify.failed` event includes a complete `quality` object.

## Setup

- The repo ignores `ralph.yml` (local-only).
- Use the tracked template:

```bash
cp ralph.example.yml ralph.yml
```

## Emitting verify events (required)

Always emit verify events via `scripts/verifier/emit-verify.mjs`. It guarantees
these keys always exist:

- `quality.tests`
- `quality.coverage`
- `quality.lint`
- `quality.audit`
- `quality.mutation`
- `quality.complexity`

Missing signals are filled with `status:"n/a"`.

Implementation detail: each `quality.*` field is normalized to an object (at
minimum `{status:"n/a"}`) so downstream consumers can reliably read
`quality.<signal>.status`.

### Minimal repro (safe; no event emitted)

```bash
node scripts/verifier/emit-verify.mjs verify.passed \
  --json '{"quality":{"tests":{"status":"pass","command":"pnpm -C frontend test"}}}' \
  --dry-run | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{console.log(JSON.stringify(JSON.parse(s).quality,null,2))})'
```

### Real emit (writes to `.ralph/events-*.jsonl`)

```bash
node scripts/verifier/emit-verify.mjs verify.passed \
  --json '{"quality":{"tests":{"status":"pass","command":"pnpm -C frontend test"}}}'
```

## Frontend-scoped verifier (recommended during frontend polish loops)

To avoid backend lint debt blocking frontend audit iterations, generate a
frontend-only quality payload (lint + typecheck; unit tests optional):

Notes:
- Default behavior is **diff-scoped**: if the last commit didn’t change any
  `frontend/` files, lint/typecheck/tests are marked `n/a`.
- Use `--full` to force lint/typecheck even if the commit didn’t touch frontend.

```bash
QUALITY_JSON="$(node scripts/verifier/run-frontend-quality.mjs)"
node scripts/verifier/emit-verify.mjs verify.passed --json "$QUALITY_JSON"
```

To include unit tests:

```bash
QUALITY_JSON="$(node scripts/verifier/run-frontend-quality.mjs --run-unit-tests)"
node scripts/verifier/emit-verify.mjs verify.passed --json "$QUALITY_JSON"
```

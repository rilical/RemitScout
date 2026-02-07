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

Always emit verify events via the repo helper `scripts/verifier/run-frontend-quality.mjs`.
This is the single blessed path because it:

- Collects frontend signals (lint/typecheck/tests)
- Normalizes the payload schema
- Emits through the verifier choke-point (no drift)

It guarantees these keys always exist:

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
node scripts/verifier/run-frontend-quality.mjs --emit verify.passed --dry-run \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const j=JSON.parse(s);console.log(JSON.stringify(j.quality,null,2))})'
```

### Real emit (writes to `.ralph/events-*.jsonl`)

```bash
node scripts/verifier/run-frontend-quality.mjs --emit verify.passed
```

### Correlate quality reports to tasks

If the orchestration loop needs to associate a `verify.*` event with a specific
task, pass the task id through so it lands on the emitted payload:

```bash
node scripts/verifier/run-frontend-quality.mjs --full --task-id task-123 --emit verify.passed
```

## Frontend-scoped verifier (recommended during frontend polish loops)

To avoid backend lint debt blocking frontend audit iterations, default behavior is
diff-scoped: if the last commit didn’t change any `frontend/` files,
lint/typecheck/tests are marked `n/a`.

```bash
# Diff-scoped (default): only check changed `frontend/` files in last commit
node scripts/verifier/run-frontend-quality.mjs --emit verify.passed

# Force full frontend lint/typecheck regardless of last commit
node scripts/verifier/run-frontend-quality.mjs --full --emit verify.passed

# Include unit tests (slower)
node scripts/verifier/run-frontend-quality.mjs --run-unit-tests --emit verify.passed
```

## Low-level helper (debug only)

`scripts/verifier/emit-verify.mjs` is the normalization/emission choke-point used by
`run-frontend-quality.mjs`. Avoid calling it directly in the loop unless you’re
debugging payload normalization.

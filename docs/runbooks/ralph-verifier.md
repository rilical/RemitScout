# Ralph verifier wiring (stable `quality.*` payload)

Business goal: keep the orchestration loop unblocked by ensuring every
`verify.passed`/`verify.failed` event includes a complete `quality` object.

## Setup

- `ralph.yml` is tracked (project source-of-truth).
- The Verifier must always emit via `scripts/verifier/emit-verify.mjs`.

## Emitting verify events (required)

Always emit verify events via `scripts/verifier/emit-verify.mjs`. It guarantees
these keys always exist:

- `quality.tests`
- `quality.coverage`
- `quality.lint`
- `quality.audit`
- `quality.mutation`
- `quality.complexity`

Missing signals are filled with `"n/a"`.

### Preferred wrapper commands

To reduce quoting mistakes and prevent schema drift, prefer the pnpm wrappers:

```bash
pnpm verifier:emit:passed
pnpm verifier:emit:failed
```

To provide a richer payload, pass args through to the underlying script:

```bash
pnpm verifier:emit:passed -- --json '{"quality":{"tests":{"status":"pass","command":"pnpm -C backend test"}}}'
```

Important: `quality.tests` is a *path*, not a JSON key. Do not emit dotted keys
like `{"quality.tests": ...}`.

## Smoke check (recommended)

```bash
node scripts/verifier/smoke.mjs
```

If your local toolchain is aligned to `engines.node` (Node 20), this also works:

```bash
pnpm verifier:smoke
```

### Minimal repro (safe; no event emitted)

```bash
node scripts/verifier/emit-verify.mjs verify.passed \
  --json '{"quality":{"tests":{"status":"pass","command":"pnpm -C backend test"}}}' \
  --dry-run | jq .quality
```

### Real emit (writes to `.ralph/events-*.jsonl`)

```bash
node scripts/verifier/emit-verify.mjs verify.passed \
  --json '{"quality":{"tests":{"status":"pass","command":"pnpm -C backend test"}}}'
```

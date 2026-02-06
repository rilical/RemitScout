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

Missing signals are filled with `"n/a"`.

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


# Ralph Audit Loop (Codex)

This folder contains a read-only, autonomous Ralph-style audit loop for Remit-Scout.

## What it does per iteration
- Reads next `passes: false` story from `prd.json` (sorted by `priority`)
- Builds a one-shot prompt from story metadata + `CODEX.md`
- Runs `codex exec` in **read-only** mode (`-s read-only`)
- Optionally enables web research (`--search`)
- Captures final model message (`--output-last-message`)
- Writes report to the audit file defined in acceptance criteria
- Marks story as passed in `prd.json` and checks it in `progress.txt`

## Run

```bash
cd .codex/ralph-audit
./ralph.sh 20
```

Disable web research:

```bash
./ralph.sh 20 --no-search
```

Skip security env preflight (not recommended):

```bash
./ralph.sh 20 --skip-security-check
```

## Environment overrides
- `RALPH_AUDIT_MODEL` (default `gpt-5.3-codex`)
- `RALPH_AUDIT_FALLBACK_MODEL` (default `gpt-5.3-codex`)
- `RALPH_AUDIT_REASONING_EFFORT` (default `medium`)
- `MAX_ATTEMPTS_PER_STORY` (default `5`)
- `TAIL_N` (default `200`)
- `RALPH_AUDIT_DISABLE_MCP` (`1` by default; avoids local MCP config failures)

## Logs
- `events.log` (high-level progress)
- `run.log` (full Codex output)

Tail:

```bash
tail -n 200 -f events.log
tail -n 200 -f run.log
```

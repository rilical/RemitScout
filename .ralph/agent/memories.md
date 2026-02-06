# Memories

## Patterns

## Decisions

## Fixes

### mem-1770385176-c53f
> failure: cmd=sed -n '1,200p' .ralph/agent/scratchpad.md, exit=1, error=No such file or directory, next=create .ralph/agent/scratchpad.md before appending
<!-- tags: tooling, ralph, scratchpad | created: 2026-02-06 -->

### mem-1770375111-729d
> failure: cmd=apply_patch (invoked via zsh -lc with backticks), exit=1, error=zsh executed backtick tokens and patch parse failed, next=run apply_patch as a direct command array (not via shell) to avoid backtick substitution
<!-- tags: tooling, shell, apply_patch | created: 2026-02-06 -->

### mem-1770371129-09f6
> failure: cmd=pnpm -C backend build, exit=1, error=ERR_PNPM_UNSUPPORTED_ENGINE expected Node 20.18.x got v23.11.0 (because nvm not sourced in non-interactive shell), next=prefix pnpm commands with 'source ~/.nvm/nvm.sh && nvm use'
<!-- tags: tooling, node, pnpm | created: 2026-02-06 -->

### mem-1770370250-0a1d
> failure: cmd=ralph emit 'refactor.done' ..., exit=1, error=zsh: no matches found (shell globbing from stray characters in command), next=rerun with clean quoted command
<!-- tags: tooling, orchestration | created: 2026-02-06 -->

### mem-1770366466-ca71
> failure: cmd=pnpm -C backend test (Node v20.18.1), exit=1, error=tests/db.test.ts:163 expected duration >= 0.01 but got 0.009 (flaky timing assertion); rerun passed. next=deflake by loosening threshold or asserting >=0 and < upper bound, or mock timer source.
<!-- tags: testing, backend, flaky | created: 2026-02-06 -->

## Context

### mem-1770356066-6d26
> Backend stack baseline: Node.js + TypeScript + Fastify. Plane A/C deployed as API Gateway v2 -> Lambda using @fastify/aws-lambda (entrypoints backend/plane-a/src/lambda.ts, backend/plane-c/src/lambda.ts wired in infrastructure/cdk/lib/api.ts). Plane B runs on ECS/Fargate services + tasks (infrastructure/cdk/lib/ecs-services.ts, ecs-tasks.ts) and uses SQS/EventBridge for workers/jobs.
<!-- tags: backend, architecture, aws, planes | created: 2026-02-06 -->

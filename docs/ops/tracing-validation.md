# Tracing Validation (A -> C -> B)

## Goal
Validate end-to-end request/queue trace continuity for production-readiness.

## Required Fields
- `traceparent` / OTel context in downstream calls
- `x-trace-id` and `x-correlation-id` on queue message attributes where available
- Request id propagation via `x-request-id`

## Validation Procedure
1. Trigger one quote path request in Plane A with explicit `x-request-id`.
2. Trigger one publisher path request in Plane C.
3. Observe queue worker spans for fanout/refresh/notifications.
4. Confirm all spans are correlated by trace id and correlation id.

## Pass Criteria
- One request produces a single trace tree with no more than 2 correlation gaps.
- Queue messages carry trace metadata (`x-trace-id`, `x-correlation-id`) when produced from traced contexts.
- Worker-side span context extraction succeeds without parse errors.

## Failure Handling
- Open incident with reason code `evidence.error`.
- Capture failing span identifiers and message attribute snapshots.
- Patch propagation boundary and re-run synthetic trace validation.


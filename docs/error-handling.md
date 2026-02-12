# Error Handling Strategy

This document defines how Remit-Scout handles errors across Plane A/B/C APIs, workers, and shared infrastructure utilities.

## 1) Error Model

The backend uses typed application errors from `backend/shared/errors.ts`:

- `AppError` (base)
- `ValidationError` (400)
- `AuthenticationError` (401)
- `AuthorizationError` (403)
- `NotFoundError` (404)
- `ConflictError` (409)
- `RateLimitError` (429)
- `CircuitBreakerOpenError` (503)

Each error includes:

- `statusCode`: HTTP/status semantic code
- `code`: stable machine-readable identifier
- `details` (optional): structured debug payload
- `cause` (optional): underlying error

## 2) Plane A HTTP Mapping

`backend/plane-a/src/plugins/error-handler.ts` is the centralized formatter:

- `AppError` -> returns `statusCode`, `code`, `message`, optional `details`
- Database/Stripe/Fastify validation errors -> normalized API error responses
- Unknown errors -> `500 internal_error`

Route handlers should prefer `throw` over `reply.code(...).send(...)` for business and validation errors so all responses stay consistent.

## 3) Worker and Script Failure Policy

Shared shutdown handling (`backend/shared/shutdown.ts`) installs:

- `process.on('unhandledRejection', ...)`
- `process.on('uncaughtException', ...)`

Behavior:

- log structured error
- capture to Sentry (`captureError`)
- abort running retry loops through shutdown `AbortSignal`
- exit process (`process.exit(1)`) for fail-fast restart under ECS/supervision

## 4) Retry Policy

### Generic retry (`backend/shared/retry.ts`)

- bounded exponential backoff
- supports `maxRetries`, `initialDelayMs`, `maxDelayMs`, `timeoutMs`, `signal`
- supports operation name and custom retryable predicate

### Worker retry (`backend/shared/worker-retry.ts`)

- defaults for transient infra failures
- accepts `AbortSignal` to stop retries immediately during shutdown

### Repository retry / circuit breaker (`backend/shared/repository-retry.ts`)

- failures count toward circuit breaker threshold
- open breaker throws `CircuitBreakerOpenError(repositoryName)`
- half-open/close transitions control recovery

## 5) SQS Error Handling

Shared SQS utilities (`backend/shared/sqs.ts`) distinguish operational error states:

- `receiveJsonMessages()` returns `{ messages, error? }`
- `deleteMessages()` returns `{ succeeded, failed }`
- `sendToDLQ()` logs and emits error metrics on failure

Critical SQS metrics (`backend/shared/sqs-metrics.ts`):

- `sqs_receive_errors_total`
- `sqs_delete_errors_total`
- `sqs_dlq_send_errors_total`

DLQ send failure is treated as a data-loss risk and is alarmed in CDK monitoring (`infrastructure/cdk/lib/monitoring.ts`) with a 5-minute > 0 threshold.

## 6) Swallow vs Rethrow Rules

Swallow only in explicitly non-critical paths:

- best-effort metrics/tracing emission
- optional audit log writes where core business action already succeeded
- non-blocking telemetry updates

Even when swallowed, log at `debug` or `warn` with contextual identifiers (`provider_id`, `corridor_id`, `queue_url`, `user_id`, etc.).

Never swallow in critical data paths:

- persistence writes
- queue receive/delete/DLQ transitions
- transaction commit/rollback failures
- entitlement/security checks

## 7) Observability Requirements

All critical error paths should include:

- structured logs with context
- metric emission where applicable
- Sentry capture for process-level crashes and high-severity faults

Minimum context fields by domain:

- API: `request_id`, `user_id`, route, status
- Queue: `queue_url`, `message_id`, receipt handle (not full payload)
- Data pipeline: `provider_id`, `corridor_id`, batch/window identifiers


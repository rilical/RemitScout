# AUDIT-RS-003 — Queues and Workers Deep Audit Findings

Audit Date: 2026-02-28T06:51:11Z  
Files Examined: 18  
Total Findings: 7

## Summary by Severity
- Critical: 1
- High: 6
- Medium: 0
- Low: 0

---

## Findings

### [CRITICAL] Finding #1: Corridor fanout drops failed providers after retry ceiling without DLQ handoff

**File:** `backend/scripts/ingest-fanout-worker.ts`  
**Lines:** 811-856  
**Category:** `broken-logic`

**Description:**  
When provider tasks fail in a corridor payload and `attempt > maxAttempts`, the worker only logs `fanout_corridor_dropped` and then continues to mark the message processed (`message_processed`) and returns `true`. That causes the source SQS message to be deleted by caller flow, with no DLQ write and no replay artifact for failed providers.

**Code:**
```ts
if (failedProviders.length > 0) {
  const attempt = (payload.attempt ?? 0) + 1
  if (attempt <= maxAttempts) {
    await sendJsonMessage(queueUrl!, {
      ...payload,
      providers: failedProviders,
      attempt,
    })
  } else {
    logger.error('fanout_corridor_dropped', {
      corridor_id: payload.corridorId,
      failed_providers: failedProviders.length,
      attempt,
    })
  }
}

await recordWorkerMetric('ingest-fanout-worker', 'message_processed', 1)
return true
```

**Why this matters:**  
This creates deterministic data loss at retry ceiling: failed provider tasks are neither retried nor preserved in DLQ for controlled replay.

---

### [HIGH] Finding #2: Batch send helper treats partial SQS failures as full success

**File:** `backend/shared/sqs.ts`  
**Lines:** 513-560  
**Category:** `broken-logic`

**Description:**  
`sendBatchJsonMessages` ignores `SendMessageBatchCommand` per-entry outcomes and returns every item as `success: true` if the API call itself does not throw. SQS batch sends can partially fail while still returning HTTP success.

**Code:**
```ts
const sendBatchAttempt = async (): Promise<void> => {
  await withAbortTimeout(
    (signal) => sqs.send(new SendMessageBatchCommand({ ... }), { abortSignal: signal }),
    DEFAULT_AWS_OP_TIMEOUT_MS,
    'sqs_send_message_batch',
  )
}

await retry(sendBatchAttempt, { ... })
trackMessageSent(queueUrl, messages.length)
return messages.map((msg) => ({ id: msg.id, success: true }))
```

**Why this matters:**  
Producers/schedulers can mark enqueue operations successful when some entries never reached SQS, causing silent task loss and incorrect run status accounting.

---

### [HIGH] Finding #3: Tiered ingest queue setup can be incorrectly disabled by base-queue gate

**File:** `backend/scripts/b2b-sweep-dispatch.ts`  
**Lines:** 134-142, 891-895  
**Category:** `will-break`

**Description:**  
`ingestFanoutEnabled` requires `config.queues.ingestFanout.url`, even though tiered mode uses `tier1Url`/`tier2Url`. In tiered-only deployments (base URL intentionally unset), scheduler exits as `queue_not_configured`.

**Code:**
```ts
const ingestFanoutQueueUrl = config.queues.ingestFanout.url
const ingestFanoutQueueTier1Url = config.queues.ingestFanout.tier1Url
const ingestFanoutQueueTier2Url = config.queues.ingestFanout.tier2Url
const ingestFanoutTiered = Boolean(ingestFanoutQueueTier1Url && ingestFanoutQueueTier2Url)
const ingestFanoutEnabled = ingestFanoutMode === 'queue' && Boolean(ingestFanoutQueueUrl)

if (!ingestFanoutEnabled) {
  logger.warn('scheduler_disabled', { reason: 'queue_not_configured' })
  return 0
}
```

**Why this matters:**  
A valid tiered queue deployment can be hard-disabled at runtime, preventing sweep dispatch and creating backlog growth/stale coverage.

---

### [HIGH] Finding #4: Notifications worker sends to DLQ but does not ACK source message on failure

**File:** `backend/scripts/notifications-queue-worker.ts`  
**Lines:** 146-156, 172-175  
**Category:** `broken-logic`

**Description:**  
On processing failure, the worker manually sends message content to DLQ but does not add source receipt handle to `deleteHandles`. The original message remains in main queue for retries/redrive while also being copied to DLQ, duplicating failure artifacts.

**Code:**
```ts
} catch (error) {
  await recordWorkerMetric('notifications-queue-worker', 'message_failed', 1)
  await sendToDLQ(queueUrl!, message, err)
  await recordWorkerMetric('notifications-queue-worker', 'dlq_sent', 1)
}

const { failed } = await deleteMessages(queueUrl, deleteHandles)
```

**Why this matters:**  
This can cause repeated processing attempts plus repeated DLQ copies, inflating DLQ and creating duplicate replay units.

---

### [HIGH] Finding #5: Ops alerts worker duplicates failed messages via manual DLQ copy without source delete

**File:** `backend/scripts/ops-alerts-queue-worker.ts`  
**Lines:** 155-166, 182-185  
**Category:** `broken-logic`

**Description:**  
Failure path mirrors notifications behavior: message is sent to DLQ but source receipt handle is not queued for delete, so original message remains active for retry/redrive.

**Code:**
```ts
} catch (error) {
  await recordWorkerMetric('ops-alerts-queue-worker', 'message_failed', 1)
  await sendToDLQ(queueUrl!, message, err)
  await recordWorkerMetric('ops-alerts-queue-worker', 'dlq_sent', 1)
}

const { failed } = await deleteMessages(queueUrl, deleteHandles)
```

**Why this matters:**  
Creates duplicate failure records and can amplify queue churn under persistent downstream errors.

---

### [HIGH] Finding #6: Export queue worker manually DLQs but leaves source message unacked

**File:** `backend/scripts/export-queue-worker.ts`  
**Lines:** 1111-1119, 1126-1129  
**Category:** `broken-logic`

**Description:**  
When `processJob` fails after retries, worker sends message to DLQ but does not append receipt handle for deletion from source queue.

**Code:**
```ts
} catch (error) {
  await recordWorkerMetric('export-queue-worker', 'message_failed', 1)
  await sendToDLQ(queueUrl, message, err)
  await recordWorkerMetric('export-queue-worker', 'dlq_sent', 1)
}

const { failed } = await deleteMessages(queueUrl, deleteHandles)
```

**Why this matters:**  
Generates duplicate DLQ entries and repeat processing, increasing operational load and complicating replay correctness.

---

### [HIGH] Finding #7: Alert evaluation worker DLQ path does not remove original SQS message

**File:** `backend/scripts/alert-evaluation-worker.ts`  
**Lines:** 158-168, 189-192  
**Category:** `broken-logic`

**Description:**  
On evaluation failure, worker sends failed message to DLQ but does not add source receipt handle to deletion list.

**Code:**
```ts
} catch (error) {
  await recordWorkerMetric('alert-evaluation-worker', 'message_failed', 1)
  await sendToDLQ(queueUrl, message, err)
  await recordWorkerMetric('alert-evaluation-worker', 'dlq_sent', 1)
}

const { failed } = await deleteMessages(queueUrl, deleteHandles)
```

**Why this matters:**  
Failure handling is non-idempotent operationally: same failure can be represented multiple times and retried repeatedly before source queue redrive.
# Normalization Worker DLQ Handling

The normalization queue carries raw provider payloads for extraction into canonical rate schema before writing to the Silver layer. When processing fails after retries, messages land in the dead letter queue (DLQ).

## How It Works

**Queue config** (`infrastructure/cdk/lib/queues.ts`):

| Parameter | Value |
|-----------|-------|
| Visibility timeout | 5 minutes |
| Max receive count | 5 (before DLQ) |
| Main queue retention | 4 days |
| DLQ retention | 14 days |

**Processing flow:**
1. Collectors publish raw payloads to the normalization queue
2. Worker receives messages, routes through `FactorExtractionRouter`
3. Extracts fees/rates/delivery times/promotions per provider
4. Persists normalized factors to `silver.factor` table
5. After 5 failed attempts, message moves to DLQ

## Symptoms

- CloudWatch alarm on `ApproximateNumberOfMessagesVisible > 0` for the DLQ
- Missing or stale quotes for specific providers/corridors
- Worker logs show `normalization_process_error`

## Diagnosis

### 1. Check DLQ Depth

```bash
aws sqs get-queue-attributes \
  --queue-url https://sqs.<region>.amazonaws.com/<account>/remit-scout-<env>-normalization-dlq \
  --attribute-names ApproximateNumberOfMessages
```

### 2. Inspect Failed Messages

```bash
aws sqs receive-message \
  --queue-url <dlq-url> \
  --max-number-of-messages 10 \
  --wait-time-seconds 5 \
  --message-attribute-names All
```

Key fields in the message body:
- `providerId` — which provider (e.g., "wise", "remitly")
- `corridorId` — route (e.g., "us-mx-usd-mxn")
- `rawPayload` — provider API response
- `collectorType` — extraction rule set used

### 3. Check Worker Logs

```
CloudWatch Log Group: /aws/ecs/remit-scout-<env>-normalization-queue-worker
Filter: normalization_process_error
```

### 4. Common Failure Reasons

| Cause | Pattern | Fix |
|-------|---------|-----|
| Provider payload format changed | Parse/extraction error for one provider | Update extractor rules |
| Missing required fields | `providerId` or `corridorId` null | Check collector output |
| DB constraint violation | Factor conflict (usually suppressed) | Check `ON CONFLICT` logic |
| Database connection timeout | Pool exhaustion or unreachable DB | Check Plane B DB health |
| Extractor misconfiguration | Fee/rate/delivery rules broken | Review extraction router |

## Recovery

### Reprocess Single Message

```bash
# Receive from DLQ
aws sqs receive-message --queue-url <dlq-url> --max-number-of-messages 1 > msg.json

# Extract body and send to main queue
BODY=$(jq -r '.Messages[0].Body' msg.json)
RECEIPT=$(jq -r '.Messages[0].ReceiptHandle' msg.json)

aws sqs send-message \
  --queue-url <main-queue-url> \
  --message-body "$BODY"

# Delete from DLQ after successful resend
aws sqs delete-message --queue-url <dlq-url> --receipt-handle "$RECEIPT"
```

### Bulk Reprocess

```bash
# Loop: receive from DLQ, send to main queue, delete from DLQ
while true; do
  MSG=$(aws sqs receive-message --queue-url <dlq-url> --max-number-of-messages 10 --wait-time-seconds 2)
  COUNT=$(echo "$MSG" | jq '.Messages | length')
  [ "$COUNT" = "0" ] || [ "$COUNT" = "null" ] && break

  echo "$MSG" | jq -c '.Messages[]' | while read -r m; do
    BODY=$(echo "$m" | jq -r '.Body')
    RECEIPT=$(echo "$m" | jq -r '.ReceiptHandle')
    aws sqs send-message --queue-url <main-queue-url> --message-body "$BODY"
    aws sqs delete-message --queue-url <dlq-url> --receipt-handle "$RECEIPT"
  done
done
```

### Discard Stale Messages

If messages are no longer relevant (e.g., provider already re-collected):

```bash
aws sqs purge-queue --queue-url <dlq-url>
```

## Tuning

| Parameter | Location | Default | When to Adjust |
|-----------|----------|---------|----------------|
| `visibilityTimeout` | `queues.ts:313` | 5 min | Worker needs more processing time |
| `maxReceiveCount` | `queues.ts:318` | 5 | Increase for transient failures |
| `NORMALIZATION_BATCH_SIZE` | ECS task env | 5 | Increase for higher throughput |
| `NORMALIZATION_IDLE_SLEEP_MS` | ECS task env | 2000 | Decrease for lower latency |

## Related

- `infrastructure/cdk/lib/queues.ts` — queue and DLQ definitions
- `backend/plane-b/src/` — normalization worker and extraction router
- `docs/runbooks/agent-operations.md` — general agent operations
- `docs/runbooks/cost-spike.md` — if DLQ buildup causes reprocessing cost spike

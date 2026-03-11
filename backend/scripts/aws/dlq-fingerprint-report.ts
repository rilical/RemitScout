import crypto from 'node:crypto'

import {
  ChangeMessageVisibilityBatchCommand,
  DeleteMessageBatchCommand,
  GetQueueAttributesCommand,
  GetQueueUrlCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from '@aws-sdk/client-sqs'

import { DLQ_PURGE_ALLOWLIST } from './dlq-fixed-signatures'

type FingerprintSummary = {
  fingerprint: string
  count: number
  oldestAgeDays: number
  sampleReason: string
}

type QueueReport = {
  queueName: string
  queueUrl: string
  approximateVisible: number
  approximateInFlight: number
  approximateAgeOfOldestSeconds: number
  sampledMessages: number
  purgeEligibleSampledMessages: number
  purgedMessages: number
  fingerprints: FingerprintSummary[]
}

const DEFAULT_SAMPLE_LIMIT = 50
const DEFAULT_PURGE_MIN_AGE_DAYS = 7

const chunkArray = <T>(items: T[], chunkSize: number): T[][] => {
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) return [items]
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

const normalizeEnvName = (value: string): string => {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'production') return 'prod'
  if (normalized === 'development') return 'dev'
  return normalized
}

const defaultQueueNames = (envName: string): string[] => ([
  `remit-scout-${envName}-gold-live-dlq`,
  `remit-scout-${envName}-ingest-fanout-dlq`,
  `remit-scout-${envName}-ingest-fanout-tier2-dlq`,
])

const readQueueNames = (env: NodeJS.ProcessEnv, envName: string): string[] => {
  const raw = String(env.DLQ_QUEUE_NAMES || '').trim()
  if (!raw) return defaultQueueNames(envName)
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const parseJson = (value: string): unknown => {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const deriveSignatureSource = (messageBody: string): string => {
  const parsed = parseJson(messageBody)
  if (!parsed || typeof parsed !== 'object') {
    return messageBody.trim().slice(0, 1000)
  }

  const record = parsed as Record<string, unknown>
  const dlqMeta = record.__rs_dlq && typeof record.__rs_dlq === 'object'
    ? record.__rs_dlq as Record<string, unknown>
    : undefined
  const source = {
    provider: record.provider || record.provider_id || record.providerId || null,
    reason: dlqMeta?.reason || record.reason || record.errorCode || null,
    errorType: dlqMeta?.errorType || record.errorType || record.type || null,
    statusCode: record.statusCode || dlqMeta?.statusCode || null,
    message: String(dlqMeta?.message || record.message || '').slice(0, 500),
  }
  return JSON.stringify(source)
}

const buildFingerprint = (messageBody: string): { fingerprint: string; sampleReason: string } => {
  const source = deriveSignatureSource(messageBody)
  return {
    fingerprint: crypto.createHash('sha256').update(source).digest('hex').slice(0, 16),
    sampleReason: source.slice(0, 240),
  }
}

const readSentTimestampMs = (message: Message): number | null => {
  const raw = message.Attributes?.SentTimestamp
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

const ageDaysForMessage = (message: Message): number => {
  const sentTimestampMs = readSentTimestampMs(message)
  if (!sentTimestampMs) return 0
  return (Date.now() - sentTimestampMs) / (24 * 60 * 60 * 1000)
}

const restoreVisibility = async (
  sqs: SQSClient,
  queueUrl: string,
  messages: Message[],
): Promise<void> => {
  const entries = messages
    .filter((message) => message.MessageId && message.ReceiptHandle)
    .map((message) => ({
      Id: message.MessageId!,
      ReceiptHandle: message.ReceiptHandle!,
      VisibilityTimeout: 0,
    }))
  for (const chunk of chunkArray(entries, 10)) {
    if (chunk.length === 0) continue
    await sqs.send(new ChangeMessageVisibilityBatchCommand({
      QueueUrl: queueUrl,
      Entries: chunk,
    }))
  }
}

const deleteMessages = async (
  sqs: SQSClient,
  queueUrl: string,
  messages: Message[],
): Promise<number> => {
  const entries = messages
    .filter((message) => message.MessageId && message.ReceiptHandle)
    .map((message) => ({
      Id: message.MessageId!,
      ReceiptHandle: message.ReceiptHandle!,
    }))
  let deleted = 0
  for (const chunk of chunkArray(entries, 10)) {
    if (chunk.length === 0) continue
    const response = await sqs.send(new DeleteMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: chunk,
    }))
    deleted += response.Successful?.length ?? 0
  }
  return deleted
}

const inspectQueue = async (
  sqs: SQSClient,
  queueName: string,
  sampleLimit: number,
  purgeMatched: boolean,
  purgeMinAgeDays: number,
): Promise<QueueReport> => {
  const queueUrlResponse = await sqs.send(new GetQueueUrlCommand({ QueueName: queueName }))
  const queueUrl = queueUrlResponse.QueueUrl
  if (!queueUrl) {
    throw new Error(`Queue URL not found for ${queueName}`)
  }

  const attributes = await sqs.send(new GetQueueAttributesCommand({
    QueueUrl: queueUrl,
    AttributeNames: [
      'ApproximateNumberOfMessages',
      'ApproximateNumberOfMessagesNotVisible',
    ],
  }))
  const approximateVisible = Number(attributes.Attributes?.ApproximateNumberOfMessages ?? '0')
  const approximateInFlight = Number(attributes.Attributes?.ApproximateNumberOfMessagesNotVisible ?? '0')
  let approximateAgeOfOldestSeconds = 0

  const fingerprintCounts = new Map<string, FingerprintSummary>()
  const sampledMessages: Message[] = []
  const purgeCandidates: Message[] = []

  while (sampledMessages.length < sampleLimit) {
    const response = await sqs.send(new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: Math.min(10, sampleLimit - sampledMessages.length),
      VisibilityTimeout: 30,
      WaitTimeSeconds: 0,
      AttributeNames: ['All'],
      MessageAttributeNames: ['All'],
    }))
    const messages = response.Messages ?? []
    if (messages.length === 0) break

    for (const message of messages) {
      sampledMessages.push(message)
      const ageDays = ageDaysForMessage(message)
      approximateAgeOfOldestSeconds = Math.max(
        approximateAgeOfOldestSeconds,
        Math.round(ageDays * 24 * 60 * 60),
      )
      const { fingerprint, sampleReason } = buildFingerprint(message.Body || '')
      const existing = fingerprintCounts.get(fingerprint)
      if (existing) {
        existing.count += 1
        existing.oldestAgeDays = Math.max(existing.oldestAgeDays, ageDays)
      } else {
        fingerprintCounts.set(fingerprint, {
          fingerprint,
          count: 1,
          oldestAgeDays: ageDays,
          sampleReason,
        })
      }

      const queueAllowlist = new Set(DLQ_PURGE_ALLOWLIST[queueName] ?? [])
      if (ageDays >= purgeMinAgeDays && queueAllowlist.has(fingerprint)) {
        purgeCandidates.push(message)
      }
    }
  }

  let purgedMessages = 0
  if (purgeMatched && purgeCandidates.length > 0) {
    purgedMessages = await deleteMessages(sqs, queueUrl, purgeCandidates)
  }

  const messagesToRestore = sampledMessages.filter(
    (message) => !purgeCandidates.some((candidate) => candidate.MessageId === message.MessageId),
  )
  if (messagesToRestore.length > 0) {
    await restoreVisibility(sqs, queueUrl, messagesToRestore)
  }

  return {
    queueName,
    queueUrl,
    approximateVisible,
    approximateInFlight,
    approximateAgeOfOldestSeconds,
    sampledMessages: sampledMessages.length,
    purgeEligibleSampledMessages: purgeCandidates.length,
    purgedMessages,
    fingerprints: [...fingerprintCounts.values()].sort((left, right) => right.count - left.count),
  }
}

export const run = async (env: NodeJS.ProcessEnv = process.env): Promise<void> => {
  const envName = normalizeEnvName(String(env.ENV_NAME || env.ENVIRONMENT || '').trim())
  if (!envName) {
    throw new Error('Missing ENV_NAME or ENVIRONMENT')
  }

  const sampleLimit = Number(env.DLQ_SAMPLE_LIMIT || DEFAULT_SAMPLE_LIMIT)
  const purgeMatched = String(env.DLQ_PURGE_MATCHED || '0').trim() === '1'
  const purgeMinAgeDays = Number(env.DLQ_PURGE_MIN_AGE_DAYS || DEFAULT_PURGE_MIN_AGE_DAYS)
  const queueNames = readQueueNames(env, envName)
  const sqs = new SQSClient({})

  const reports: QueueReport[] = []
  for (const queueName of queueNames) {
    reports.push(await inspectQueue(sqs, queueName, sampleLimit, purgeMatched, purgeMinAgeDays))
  }

  console.log(JSON.stringify({
    envName,
    sampleLimit,
    purgeMatched,
    purgeMinAgeDays,
    reports,
  }, null, 2))
}

const isDirectExecution = /(^|[/\\])dlq-fingerprint-report\.(ts|js)$/.test(process.argv[1] || '')

if (isDirectExecution) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}

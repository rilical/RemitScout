export const QUEUE_CLASSES = [
  'ingest-fanout-t1',
  'ingest-fanout-t2',
  'gold-live',
  'fx-rate-refresh',
  'quote-refresh',
] as const

export type QueueClass = typeof QUEUE_CLASSES[number]

export interface QueueMessageEnvelopeV1<T = unknown> {
  envelopeVersion: 1
  queueClass: QueueClass
  producedAtIso: string
  runId?: string
  correlationId?: string
  payload: T
}

export const isQueueClass = (value: unknown): value is QueueClass => {
  return typeof value === 'string' && (QUEUE_CLASSES as readonly string[]).includes(value)
}

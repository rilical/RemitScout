export type BillingWebhookEventInput = {
  eventId: string
  type: string
  payloadHash: string
  payloadJson: unknown
}

export type BillingWebhookEventRecord = {
  event_id: string
  type: string
  payload_hash: string
  payload_json: unknown
  received_at: Date
  processed_at: Date | null
}

export interface IBillingWebhookEventRepository {
  insertEvent(input: BillingWebhookEventInput): Promise<boolean>
  markAsProcessed(eventId: string): Promise<void>
  getEvent(eventId: string): Promise<BillingWebhookEventRecord | null>
}


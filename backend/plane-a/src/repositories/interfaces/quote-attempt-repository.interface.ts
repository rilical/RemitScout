export type QuoteAttemptRecord = {
  corridor_id: string
  attempted_at: string | Date | null
  success: boolean | null
  error_type: string | null
  http_status: number | null
  error_message: string | null
  request_fingerprint: string | null
}

export interface IQuoteAttemptRepository {
  listLatestAttemptsByProvider(
    providerId: string,
    corridorIds: string[],
  ): Promise<QuoteAttemptRecord[]>
}

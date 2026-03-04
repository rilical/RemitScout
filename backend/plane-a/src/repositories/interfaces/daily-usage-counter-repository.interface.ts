export type DailyUsageCounterRecord = {
  client_id: string
  usage_date: string
  request_count: number
}

export interface IDailyUsageCounterRepository {
  /**
   * Atomically increment the daily request counter for the given client.
   * Uses UPSERT (INSERT ... ON CONFLICT DO UPDATE) so it is safe to call
   * concurrently from multiple workers.
   *
   * Returns the new count after incrementing.
   */
  incrementAndGet(clientId: string): Promise<number>

  /**
   * Read the current daily request count for a client (today, UTC).
   * Returns 0 if no row exists for today.
   */
  getCount(clientId: string): Promise<number>
}

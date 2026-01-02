export type AttemptMetricsInput = {
  providerId: string
  locale: string
  avgAttemptSeconds: number
  sampleCount: number
}

export type AttemptMetricsRecord = {
  avg_attempt_seconds: number | null
  sample_count: number | null
}

export interface IAttemptMetricsRepository {
  getMetrics(providerId: string, locale: string): Promise<AttemptMetricsRecord | null>
  upsertMetrics(input: AttemptMetricsInput): Promise<void>
}

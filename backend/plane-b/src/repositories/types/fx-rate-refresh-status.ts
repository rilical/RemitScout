export enum FxRateRefreshStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export type FxRateRefreshStatusValue = `${FxRateRefreshStatus}`

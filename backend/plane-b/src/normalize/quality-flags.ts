export const qualityFlags = {
  partial_data: 'partial_data',
  blocked: 'blocked',
  stale: 'stale',
  parse_error: 'parse_error',
  min_send_violation: 'min_send_violation',
  bucket_approx: 'bucket_approx',
  unknown_method: 'unknown_method',
  unsupported_corridor: 'unsupported_corridor',
} as const

export type QualityFlag = (typeof qualityFlags)[keyof typeof qualityFlags]

export type AggregatedData = {
  corridorId: string
  timestampBucket: Date
  providerCount: number
  avgRate: number
  minRate: number
  maxRate: number
  topProviderShare: number
  topTwoShare: number
  contributorCount: number
  metadata?: Record<string, unknown>
}

export type GateResult = {
  allowed: boolean
  reasons: string[]
}

export type PublisherResult = {
  published: number
  withheld: number
  errors: number
}


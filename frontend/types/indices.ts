export type IndexKey = 'teer' | 'rci' | 'rvi_bps'

export type PublicationStatus = 'provisional' | 'final'

export type IndexSeriesPoint = {
  date: string
  teer: number | null
  rci: number | null
  rvi_bps: number | null
  providerCountBinned: number | null
  providerCount?: number | null
  suppressionFlag: boolean
  suppressionReason: string | null
  midMarketRate?: number | null
  weightConfidence?: number | null
  weightWindowDays?: number | null
  methodologyVersion?: string
  publicationStatus?: PublicationStatus
  confidence?: number
}

export type IndexSeriesResponse = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  weightingModel: string
  methodologyVersion?: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  lastUpdated: string | null
  dataTier?: 1 | 2
  cadenceMinutes?: number
  exportCadenceMinutes?: number
  collectionCadenceMinutes?: number
  collectionTier?: 'tier_1' | 'tier_2'
  isUsdOrigin?: boolean
  dataWindow?: {
    requestedDays: number
    availableDays: number | null
    returnedDays: number
    availableStartDate: string | null
    availableEndDate: string | null
    startDate: string
    endDate: string
    capped: boolean
  }
  series: IndexSeriesPoint[]
  asOf?: string
  methodology?: string
}

export type TriangulatedIndexPoint = {
  date: string
  stress_score: number | null
  stress_level: string
  teer: number | null
  rci: number | null
  confidence: string | null
  leg1_corridor: string
  leg2_corridor: string
  leg1_teer: number | null
  leg2_teer: number | null
  methodology_version: string | null
}

export type TriangulatedIndexResponse = {
  corridorId: string
  series: TriangulatedIndexPoint[]
}

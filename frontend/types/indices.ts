export type IndexKey = 'teer' | 'rci' | 'rvi_bps'

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
}

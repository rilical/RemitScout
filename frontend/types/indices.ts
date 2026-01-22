export type IndexKey = 'teer' | 'rci' | 'rvi'

export type IndexSeriesPoint = {
  date: string
  teer: number | null
  rci: number | null
  rvi: number | null
  providerCountBinned: number | null
  suppressionFlag: boolean
  suppressionReason: string | null
}

export type IndexSeriesResponse = {
  corridorId: string
  amountBucket: number
  methodProfile: string
  weightingModel: string
  lastUpdated: string | null
  series: IndexSeriesPoint[]
}

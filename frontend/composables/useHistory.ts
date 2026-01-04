export type CorridorHistoryPoint = {
  date: string
  corridorId: string
  amountBucket: number
  methodProfile: string
  rciLeaderBps: number | null
  rciMedianBps: number | null
  rciP10Bps: number | null
  rciP90Bps: number | null
  dispersionBps: number | null
  leaderEdgeBps: number | null
  volatility7d: number | null
  providerCountBinned: number | null
  suppressionFlag: boolean
  suppressionReason: string | null
  methodologyVersion: string | null
  pipelineVersion: string | null
}

export type CorridorHistoryResponse = {
  corridorId: string
  granularity: string
  fromDate: string | null
  toDate: string | null
  lastUpdated: string | null
  data: CorridorHistoryPoint[]
}

export const useHistory = () => {
  const { request } = useApi()

  const getCorridorHistory = async (params: {
    corridorId: string
    fromDate?: string
    toDate?: string
    granularity?: 'daily' | '4h' | 'hourly'
    amountBucket?: number
    methodProfile?: string
  }) => {
    return await request<CorridorHistoryResponse>('/history/corridor', {
      query: {
        corridor_id: params.corridorId,
        from_date: params.fromDate,
        to_date: params.toDate,
        granularity: params.granularity,
        amount_bucket: params.amountBucket,
        method_profile: params.methodProfile,
      },
    })
  }

  return {
    getCorridorHistory,
  }
}

import { useApi } from '~/composables/useApi'
import type { IndexSeriesPoint, IndexSeriesResponse } from '~/types/indices'

type IndexSeriesParams = {
  corridor_id: string
  amount_bucket?: number
  method_profile?: string
  days?: number
  api_key?: string
}

export type IndicesEmbedSnapshotCreateParams = {
  corridor_id: string
  amount_bucket?: number
  method_profile?: 'standard_bank' | 'standard_card' | 'cash_pickup' | 'mobile_wallet' | 'airtime_topup' | 'card_delivery' | 'home_delivery'
  days?: number
}

export type IndicesEmbedSnapshotCreateResponse = {
  success: true
  snapshotId: string
  createdAt: string
  expiresAt: string
  corridorId: string
  amountBucket: number
  methodProfile: string
  returnedDays: number
}

export type IndicesEmbedSnapshotResponse = {
  snapshotId: string
  corridorId: string
  amountBucket: number
  methodProfile: string
  weightingModel: string
  methodologyVersion: string
  weightConfidence?: number | null
  weightWindowDays?: number | null
  lastUpdated: string | null
  dataTier: 1 | 2
  cadenceMinutes: number
  exportCadenceMinutes: number
  collectionCadenceMinutes: number
  collectionTier: 'tier_1' | 'tier_2'
  isUsdOrigin: boolean
  series: IndexSeriesPoint[]
  dataWindow: {
    requestedDays: number
    availableDays: number | null
    returnedDays: number
    availableStartDate: string | null
    availableEndDate: string | null
    startDate: string
    endDate: string
    capped: boolean
  }
  createdAt: string
  expiresAt: string
}

export async function getIndexSeries(params: IndexSeriesParams): Promise<IndexSeriesResponse> {
  const { request } = useApi()
  const { api_key, ...query } = params
  const headers = api_key ? { 'x-api-key': api_key } : undefined
  return await request<IndexSeriesResponse>('/indices/series', { query, headers })
}

export async function getPublicIndexSeries(params: Omit<IndexSeriesParams, 'api_key'>): Promise<IndexSeriesResponse> {
  const { request } = useApi()
  return await request<IndexSeriesResponse>('/public/indices/series', { query: params })
}

export async function createIndicesEmbedSnapshot(
  params: IndicesEmbedSnapshotCreateParams,
): Promise<IndicesEmbedSnapshotCreateResponse> {
  const { request } = useApi()
  return await request<IndicesEmbedSnapshotCreateResponse>('/indices/embed-snapshots', {
    method: 'POST',
    body: params,
  })
}

export async function getPublicIndicesEmbedSnapshot(
  snapshotId: string,
): Promise<IndicesEmbedSnapshotResponse> {
  const { request } = useApi()
  return await request<IndicesEmbedSnapshotResponse>(`/public/indices/embed-snapshots/${encodeURIComponent(snapshotId)}`)
}

import { useApi } from '~/composables/useApi'
import type { IndexSeriesPoint, IndexSeriesResponse, TriangulatedIndexResponse } from '~/types/indices'
import type { PublishedEmbedVariant } from './pulseApi'

type IndexSeriesParams = {
  corridor_id: string
  amount_bucket?: number
  method_profile?: string
  days?: number
  api_key?: string
  as_of?: string
  methodology?: string
}

export type TriangulatedIndexParams = {
  amount_bucket?: number
  method_profile?: string
  as_of?: string
  methodology?: string
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

export type IndicesPublishedEmbedCreateParams = IndicesEmbedSnapshotCreateParams & {
  theme?: 'dark' | 'light'
}

export type IndicesPublishedEmbedCreateResponse = {
  success: true
  publishedId: string
  title: string
  theme: 'dark' | 'light'
  publicUrl: string
  embedCode: string
  variants: PublishedEmbedVariant[]
  createdAt: string
  publishedAt: string
  corridorId: string
  amountBucket: number
  methodProfile: string
}

export type IndicesPublishedEmbedResponse = IndexSeriesResponse & {
  publishedId: string
  theme: 'dark' | 'light'
  createdAt: string
  publishedAt: string
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

export async function createIndicesPublishedEmbed(
  params: IndicesPublishedEmbedCreateParams,
): Promise<IndicesPublishedEmbedCreateResponse> {
  const { request } = useApi()
  return await request<IndicesPublishedEmbedCreateResponse>('/indices/published-embeds', {
    method: 'POST',
    body: params,
  })
}

export async function getPublicIndicesPublishedEmbed(
  publishedId: string,
): Promise<IndicesPublishedEmbedResponse> {
  const { request } = useApi()
  return await request<IndicesPublishedEmbedResponse>(`/public/indices/published-embeds/${encodeURIComponent(publishedId)}`)
}

export async function getTriangulatedIndex(
  corridorId: string,
  params?: TriangulatedIndexParams,
): Promise<TriangulatedIndexResponse> {
  const { request } = useApi()
  return await request<TriangulatedIndexResponse>(
    `/indices/triangulated/${encodeURIComponent(corridorId)}`,
    { query: params },
  )
}

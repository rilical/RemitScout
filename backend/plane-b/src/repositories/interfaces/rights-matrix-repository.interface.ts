export type RightsMatrixStatusRecord = {
  stoplist_status: string
  notes: string | null
}

export type RightsMatrixEntryRecord = {
  provider_id: string
  allowed_collect: boolean
  allowed_b2c: boolean
  allowed_b2b: boolean
  stoplist_status: string
}

export type RightsMatrixStoplistRecord = {
  provider_id: string
  stoplist_status: string
}

export type RightsMatrixUpsertInput = {
  providerId: string
  allowedCollect: boolean
  allowedB2c: boolean
  allowedB2b: boolean
  notes: string | null
}

export interface IRightsMatrixRepository {
  pauseProvider(providerId: string, notes: string): Promise<void>
  getProviderStatus(providerId: string): Promise<RightsMatrixStatusRecord | null>
  setProviderActive(providerId: string): Promise<void>
  loadProviderRights(): Promise<RightsMatrixEntryRecord[]>
  upsertProviderRights(input: RightsMatrixUpsertInput): Promise<void>
  loadStoplistStatuses(): Promise<RightsMatrixStoplistRecord[]>
}

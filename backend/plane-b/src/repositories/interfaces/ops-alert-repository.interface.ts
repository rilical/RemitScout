export type OpsAlertInput = {
  providerId: string
  corridorId: string
  amountBucket: number
  httpStatus: number | null
  blockReason: string | null
  bronzeObjectKey: string | null
  requestId: string
  payload: unknown
}

export type OpsAlertRecord = {
  alert_id: string
  provider_id: string | null
  corridor_id: string | null
  amount_bucket: number | null
  http_status: number | null
  block_reason: string | null
  bronze_object_key: string | null
  request_id: string | null
  payload: unknown
  created_at: string
}

export interface IOpsAlertRepository {
  insertAlert(input: OpsAlertInput): Promise<string | null>
  getAlert(alertId: string): Promise<OpsAlertRecord | null>
}

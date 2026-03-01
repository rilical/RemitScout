export type CorrectionLedgerRow = {
  correction_id: string
  corridor_id: string
  field_name: string
  date: Date
  old_value: number | null
  new_value: number | null
  reason: string
  corrected_by: string
  methodology_version: string | null
  approved_by: string | null
  approved_at: Date | null
  created_at: Date
}

export interface ICorrectionLedgerRepository {
  list(input: {
    limit: number
    offset: number
    corridor_id?: string
    field_name?: string
  }): Promise<{ rows: CorrectionLedgerRow[]; total: number }>
}

export type ProviderVisitCreateInput = {
  provider_id: string
  corridor_id?: string | null
  user_id?: string | null
  anon_session_id?: string | null
  session_id: string
  target_url?: string | null
  page_path?: string | null
  utm?: Record<string, unknown> | null
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
  quoted_rate?: number | null
  quoted_fee?: number | null
}

export type ProviderVisitRow = {
  id: string
  provider_id: string
  provider_name: string | null
  corridor_id: string | null
  user_id: string | null
  anon_session_id: string | null
  session_id: string
  visit_timestamp: Date
  target_url: string | null
  page_path: string | null
  utm: unknown | null
  gclid?: string | null
  fbclid?: string | null
  msclkid?: string | null
  quoted_rate: number | null
  quoted_fee: number | null
  completed_transfer: boolean | null
  transfer_amount: number | null
  transfer_date: Date | null
  actual_rate: number | null
  actual_fee: number | null
  rate_difference_pct: number | null
  feedback_rating: number | null
  feedback_notes: string | null
  feedback_timestamp: Date | null
  returned_at: Date | null
}

export type ProviderVisitFeedbackInput = {
  completed_transfer: boolean
  transfer_amount?: number | null
  transfer_date?: Date | null
  actual_rate?: number | null
  actual_fee?: number | null
  rate_difference_pct?: number | null
  feedback_rating?: number | null
  feedback_notes?: string | null
}

export interface IProviderVisitRepository {
  createVisit(input: ProviderVisitCreateInput): Promise<void>
  getVisitById(id: string): Promise<ProviderVisitRow | null>
  listPendingFeedback(userId: string, limit?: number, lookbackDays?: number): Promise<ProviderVisitRow[]>
  markReturned(ids: string[]): Promise<void>
  recordFeedback(id: string, userId: string, input: ProviderVisitFeedbackInput): Promise<boolean>
}

export type PendingProviderVisit = {
  id: string
  provider_id: string
  provider_name: string | null
  corridor_id: string | null
  visit_timestamp: string
  target_url: string | null
  page_path: string | null
  quoted_rate: number | null
  quoted_fee: number | null
}

export type ProviderVisitFeedback = {
  completed_transfer: boolean
  transfer_amount?: number | null
  transfer_date?: string | null
  actual_rate?: number | null
  actual_fee?: number | null
  feedback_rating?: number | null
  feedback_notes?: string | null
}

export const useProviderVisits = () => {
  const { request } = useApi()

  const pendingVisits = useState<PendingProviderVisit[]>('provider-visits:pending', () => [])
  const loading = useState<boolean>('provider-visits:loading', () => false)
  const error = useState<string | null>('provider-visits:error', () => null)

  const fetchPendingFeedback = async (limit = 3) => {
    loading.value = true
    error.value = null
    try {
      const response = await request<{ visits: PendingProviderVisit[] }>('/provider-visits/pending-feedback', {
        method: 'GET',
        query: { limit },
      })
      pendingVisits.value = Array.isArray(response.visits) ? response.visits : []
    } catch (err: any) {
      error.value = err?.message || 'Failed to load provider feedback.'
    } finally {
      loading.value = false
    }
  }

  const submitFeedback = async (visitId: string, feedback: ProviderVisitFeedback) => {
    error.value = null
    await request(`/provider-visits/${visitId}/feedback`, {
      method: 'POST',
      body: feedback,
    })
    pendingVisits.value = pendingVisits.value.filter((visit) => visit.id !== visitId)
  }

  const trackProviderVisit = async (payload: {
    session_id: string
    anon_id?: string
    provider_id: string
    corridor_id?: string
    target_url: string
    page_path?: string
    utm?: Record<string, string>
    quoted_rate?: number
    quoted_fee?: number
  }) => {
    try {
      await request('/provider-visits/track', {
        method: 'POST',
        body: payload,
        retries: 0,
      })
    } catch {
      // ignore tracking errors
    }
  }

  return {
    pendingVisits,
    loading,
    error,
    fetchPendingFeedback,
    submitFeedback,
    trackProviderVisit,
  }
}

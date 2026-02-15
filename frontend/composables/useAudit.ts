type AuditLogFilters = {
  actor_id?: string
  actor_type?: string
  action?: string
  entity_type?: string
  entity_id?: string
  category?: string
  severity?: string
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}

type ExportFormat = 'csv' | 'json'

type AuditPagination = {
  total: number
  limit: number
  offset: number
}

type AuditLogsResponse = {
  logs: any[]
  pagination: AuditPagination
}

export const useAudit = () => {
  const { request } = useApi()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const withLoading = async <T>(fn: () => Promise<T>) => {
    loading.value = true
    error.value = null
    try {
      return await fn()
    }
    catch (err: any) {
      error.value = err?.message || 'Failed to load audit logs.'
      throw err
    }
    finally {
      loading.value = false
    }
  }

  const getLogs = (params: AuditLogFilters) =>
    withLoading(() => request<AuditLogsResponse>('/audit/logs', { method: 'GET', query: params }))

  const getLog = (eventId: string) =>
    withLoading(() => request(`/audit/logs/${eventId}`, { method: 'GET' }))

  const exportLogs = (params: AuditLogFilters, format: ExportFormat = 'csv') =>
    withLoading(() =>
      request<string>('/audit/logs/export', {
        method: 'GET',
        query: { ...params, format },
        headers: format === 'csv' ? { accept: 'text/csv' } : undefined,
      }),
    )

  const getMyActivity = () =>
    withLoading(() => request('/audit/my-activity', { method: 'GET' }))

  return {
    loading,
    error,
    getLogs,
    getLog,
    exportLogs,
    getMyActivity,
  }
}

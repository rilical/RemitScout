import { ref, computed } from 'vue'
import { useApi } from '~/composables/useApi'
import type { DataTableColumn } from '~/ui'
import { EXPORTS_MAX_WINDOW_DAYS_HARD_CAP } from '~/shared/lib/exports'

type ExportJobRecord = {
  id: string
  jobType: string
  status: 'queued' | 'running' | 'done' | 'failed'
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  expiresAt: string | null
  error: string | null
}

export function useEnterpriseExports() {
  const { request } = useApi()

  const jobs = ref<ExportJobRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const loaded = ref(false)
  const jobType = ref<'history' | 'watchlist' | 'alerts' | 'all' | 'indices'>('history')
  const format = ref<'csv' | 'pdf'>('csv')
  const dateFrom = ref('')
  const dateTo = ref('')
  const creating = ref(false)

  const columns: DataTableColumn[] = [
    { key: 'jobType', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: '', align: 'right', widthClass: 'w-28' },
  ]

  const rowKey = (row: unknown, rowIndex: number) => {
    return (row as ExportJobRecord).id || String(rowIndex)
  }

  const fromRow = (row: unknown): ExportJobRecord => row as ExportJobRecord

  const statusClasses = (status: string) => {
    switch (status) {
      case 'done': return 'bg-success-100 text-success-700'
      case 'failed': return 'bg-danger-100 text-danger-700'
      case 'running': return 'bg-brand-100 text-brand-700'
      default: return 'bg-neutral-100 text-neutral-600'
    }
  }

  const fetchJobs = async () => {
    if (loading.value) return
    loading.value = true
    error.value = null
    try {
      const response = await request<{ success: boolean; jobs: ExportJobRecord[] }>('/exports')
      jobs.value = response.jobs ?? []
      loaded.value = true
    } catch (err) {
      const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
      error.value = /429|too many|rate.?limit/i.test(raw) ? 'Rate limited — wait a moment then press Refresh.' : (raw || 'Unable to load exports.')
    } finally {
      loading.value = false
    }
  }

  const createJob = async () => {
    if (creating.value) return
    creating.value = true
    error.value = null
    try {
      const body: Record<string, unknown> = {
        dataType: jobType.value,
        format: format.value,
      }
      if (dateFrom.value) body.dateFrom = dateFrom.value
      if (dateTo.value) body.dateTo = dateTo.value

      const requiresDateRange = jobType.value === 'history' || jobType.value === 'all' || jobType.value === 'indices'
      if (requiresDateRange) {
        if (!dateFrom.value || !dateTo.value) {
          throw new Error(`Please select a date range (max ${EXPORTS_MAX_WINDOW_DAYS_HARD_CAP} days).`)
        }
        const from = new Date(`${dateFrom.value}T00:00:00.000Z`)
        const to = new Date(`${dateTo.value}T23:59:59.999Z`)
        if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
          throw new Error('Invalid date range.')
        }
        const diffDays = Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1
        if (diffDays > EXPORTS_MAX_WINDOW_DAYS_HARD_CAP) {
          throw new Error(`Export window too large. Max is ${EXPORTS_MAX_WINDOW_DAYS_HARD_CAP} days.`)
        }
      }

      await request<{ success: boolean; job: { id: string; status: string; jobType: string; createdAt: string } }>('/exports', { method: 'POST', body })
      await fetchJobs()
    } catch (err) {
      const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
      error.value = raw || 'Unable to create export.'
    } finally {
      creating.value = false
    }
  }

  const downloadJob = async (jobId: string) => {
    try {
      const result = await request<{ url: string }>(`/exports/${jobId}/download`)
      if (import.meta.client) {
        window.open(result.url, '_blank', 'noopener')
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
      error.value = raw || 'Unable to fetch export download URL.'
    }
  }

  return {
    jobs,
    loading,
    error,
    loaded,
    jobType,
    format,
    dateFrom,
    dateTo,
    creating,
    columns,
    rowKey,
    fromRow,
    statusClasses,
    fetchJobs,
    createJob,
    downloadJob,
  }
}

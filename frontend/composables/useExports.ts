export type ExportJobStatus = 'queued' | 'running' | 'done' | 'failed'

export type ExportJob = {
  id: string
  jobType: string
  status: ExportJobStatus
  createdAt: string
  startedAt?: string | null
  finishedAt?: string | null
  expiresAt?: string | null
  error?: string | null
}

export type CreateExportInput = {
  dataType: 'history' | 'watchlist' | 'alerts' | 'all'
  format: 'csv' | 'pdf'
  dateFrom?: string
  dateTo?: string
  itemIds?: string[]
}

export const useExports = () => {
  const { request } = useApi()

  const createExport = async (input: CreateExportInput) => {
    return await request<{ success: boolean; job: ExportJob }>('/exports', {
      method: 'POST',
      body: input,
    })
  }

  const listExports = async (params?: { status?: ExportJobStatus; limit?: number; offset?: number }) => {
    return await request<{ success: boolean; jobs: ExportJob[] }>('/exports', {
      query: params,
    })
  }

  const getExportStatus = async (id: string) => {
    return await request<{ success: boolean; job: ExportJob }>(`/exports/${id}`)
  }

  const getExportDownloadUrl = async (id: string) => {
    return await request<{ success: boolean; url: string; expiresIn: number }>(
      `/exports/${id}/download`,
    )
  }

  return {
    createExport,
    listExports,
    getExportStatus,
    getExportDownloadUrl,
  }
}
